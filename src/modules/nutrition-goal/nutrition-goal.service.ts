import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import aqp from 'api-query-params';
import type { AqpQuery } from 'api-query-params';
import { PrismaService } from '../../prisma/prisma.service';
import {
  prismaSortFromAqp,
  stripAdminPaginationFilter,
} from '../../common/utils/admin-pagination.util';
import type { CreateNutritionGoalDto } from './dto/create-nutrition-goal.dto.js';
import type { UpdateNutritionGoalDto } from './dto/update-nutrition-goal.dto.js';
import type { SmartCreateNutritionGoalDto } from './dto/smart-create-nutrition-goal.dto.js';
import { GoalType, GenderType, NutritionGoalStatus } from '@/generated/prisma/enums';

// ─── Hằng số tính toán ───────────────────────────────────────────────────────
const KCAL_PER_KG = 7700;
const MIN_DAYS = 30;
const MAX_DAILY_DELTA_KCAL = 750; // tối đa cho GOAL_STRICT
const SAFE_DAILY_DELTA_KCAL = 500; // tối đa cho GOAL_LOSS / GOAL_GAIN
const MIN_CALORIES_MALE = 1500;
const MIN_CALORIES_FEMALE = 1200;

const ACTIVITY_FACTORS: Record<string, number> = {
  ACT_SEDENTARY: 1.2,
  ACT_LIGHT: 1.375,
  ACT_MODERATE: 1.55,
  ACT_VERY: 1.725,
  ACT_SUPER: 1.9,
};

// Tỉ lệ macro theo goalType (protein%, carbs%, fat%, fiber_g)
const MACRO_RATIOS: Record<GoalType, { protein: number; carbs: number; fat: number; fiber: number }> = {
  [GoalType.GOAL_LOSS]:     { protein: 0.30, carbs: 0.40, fat: 0.30, fiber: 25 },
  [GoalType.GOAL_GAIN]:     { protein: 0.25, carbs: 0.50, fat: 0.25, fiber: 30 },
  [GoalType.GOAL_MAINTAIN]: { protein: 0.25, carbs: 0.50, fat: 0.25, fiber: 28 },
  [GoalType.GOAL_STRICT]:   { protein: 0.35, carbs: 0.30, fat: 0.35, fiber: 20 },
};

// Type cho History Goal (limited fields)
type NutritionGoalHistoryItem = {
  id: number;
  goalType: string;
  goalTypeInfo: {
    keyMap: string;
    value: string;
    description: string | null;
  } | null;
  status: string;
  statusInfo: {
    keyMap: string;
    value: string;
    description: string | null;
  } | null;
  targetWeight: number | null;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
};

// Type response cho API goals với current + history
type MyGoalsResponse = {
  current: NutritionGoalWithGoalTypeInfo | null;
  history: NutritionGoalHistoryItem[];
};
type NutritionGoalWithGoalTypeInfo = {
  id: number;
  goalType: string;
  status: string;
  goalTypeInfo: {
    keyMap: string;
    value: string;
    description: string | null;
  } | null;
  statusInfo: {
    keyMap: string;
    value: string;
    description: string | null;
  } | null;
  targetWeight: number | null;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetFiber: number;

  startDate: Date;
  endDate: Date;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: number; fullName: string; email: string };
};

@Injectable()
export class NutritionGoalService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper: Enrich goals cho history (chỉ với fields cần thiết)
  private async enrichHistoryGoals<
    T extends { goalType: string; status: string },
  >(
    goals: T[],
  ): Promise<
    (T & {
      goalTypeInfo: {
        keyMap: string;
        value: string;
        description: string | null;
      } | null;
      statusInfo: {
        keyMap: string;
        value: string;
        description: string | null;
      } | null;
    })[]
  > {
    const goalTypeKeyMaps = [...new Set(goals.map((g) => g.goalType))];
    const statusValues = [...new Set(goals.map((g) => g.status))];

    const [goalTypeAllCodes, statusAllCodes] = await Promise.all([
      this.prisma.allCode.findMany({
        where: { keyMap: { in: goalTypeKeyMaps } },
        select: { keyMap: true, value: true, description: true },
      }),
      this.prisma.allCode.findMany({
        where: { keyMap: { in: statusValues } },
        select: { keyMap: true, value: true, description: true },
      }),
    ]);

    const goalTypeMap = new Map(goalTypeAllCodes.map((a) => [a.keyMap, a]));
    const statusMap = new Map(statusAllCodes.map((a) => [a.keyMap, a]));

    return goals.map((goal) => {
      const goalTypeAllCode = goalTypeMap.get(goal.goalType);
      const statusAllCode = statusMap.get(goal.status);
      return {
        ...goal,
        goalTypeInfo: goalTypeAllCode
          ? {
              keyMap: goalTypeAllCode.keyMap,
              value: goalTypeAllCode.value,
              description: goalTypeAllCode.description,
            }
          : null,
        statusInfo: statusAllCode
          ? {
              keyMap: statusAllCode.keyMap,
              value: statusAllCode.value,
              description: statusAllCode.description,
            }
          : null,
      };
    });
  }
  private async enrichGoalType<T extends { goalType: string; status: string }>(
    goals: T[],
  ): Promise<
    (T & {
      goalTypeInfo: {
        keyMap: string;
        value: string;
        description: string | null;
      } | null;
      statusInfo: {
        keyMap: string;
        value: string;
        description: string | null;
      } | null;
    })[]
  > {
    const goalTypeKeyMaps = [...new Set(goals.map((g) => g.goalType))];
    const statusValues = [...new Set(goals.map((g) => g.status))];

    const [goalTypeAllCodes, statusAllCodes] = await Promise.all([
      this.prisma.allCode.findMany({
        where: { keyMap: { in: goalTypeKeyMaps } },
        select: { keyMap: true, value: true, description: true },
      }),
      this.prisma.allCode.findMany({
        where: { keyMap: { in: statusValues } },
        select: { keyMap: true, value: true, description: true },
      }),
    ]);

    const goalTypeMap = new Map(goalTypeAllCodes.map((a) => [a.keyMap, a]));
    const statusMap = new Map(statusAllCodes.map((a) => [a.keyMap, a]));

    return goals.map((goal) => {
      const goalTypeAllCode = goalTypeMap.get(goal.goalType);
      const statusAllCode = statusMap.get(goal.status);
      return {
        ...goal,
        goalTypeInfo: goalTypeAllCode
          ? {
              keyMap: goalTypeAllCode.keyMap,
              value: goalTypeAllCode.value,
              description: goalTypeAllCode.description,
            }
          : null,
        statusInfo: statusAllCode
          ? {
              keyMap: statusAllCode.keyMap,
              value: statusAllCode.value,
              description: statusAllCode.description,
            }
          : null,
      };
    });
  }

  async create(userId: number, dto: CreateNutritionGoalDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User #${userId} không tồn tại`);
    }

    return this.prisma.nutritionGoal.create({
      data: {
        userId,
        goalType: dto.goalType,
        targetWeight: dto.targetWeight,
        targetCalories: dto.targetCalories,
        targetProtein: dto.targetProtein,
        targetCarbs: dto.targetCarbs,
        targetFat: dto.targetFat,
        targetFiber: dto.targetFiber,
        status: dto.status || NutritionGoalStatus.NUTR_GOAL_ONGOING,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });
  }

  async findAll(): Promise<NutritionGoalWithGoalTypeInfo[]> {
    const goals = await this.prisma.nutritionGoal.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return this.enrichGoalType(goals);
  }

  async findAllAdmin(page: number, limit: number, queryString: string) {
    try {
      const parsed = aqp(queryString) as AqpQuery;
      const { filter } = parsed;
      const { sort: aqpSort } = parsed;

      stripAdminPaginationFilter(filter as Record<string, unknown>);
      const sort = prismaSortFromAqp(aqpSort, { updatedAt: 'desc' });

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;

      const totalItems = await this.prisma.nutritionGoal.count({
        where: filter,
      });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const goals = await this.prisma.nutritionGoal.findMany({
        where: filter,
        orderBy: sort,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
        skip: offset,
        take: defaultLimit,
      });

      const enriched = await this.enrichGoalType(goals);

      return {
        EC: 0,
        EM: 'Get nutrition goals with query paginate success (admin)',
        meta: {
          current: page,
          pageSize: limit,
          pages: totalPages,
          total: totalItems,
        },
        result: enriched,
      };
    } catch (error) {
      console.error(
        'Error in nutrition goal service get paginate (admin):',
        (error as Error).message,
      );
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in nutrition goal service get paginate',
      });
    }
  }

  async findAllByUserId(
    userId: number,
  ): Promise<NutritionGoalWithGoalTypeInfo[]> {
    const goals = await this.prisma.nutritionGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return this.enrichGoalType(goals);
  }

  async findMyGoalsWithHistory(userId: number): Promise<MyGoalsResponse> {
    const goals = await this.prisma.nutritionGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (goals.length === 0) {
      return { current: null, history: [] };
    }

    // Current = goal đang ONGOING hoặc PAUSED mới nhất
    const activeStatuses: string[] = [
      NutritionGoalStatus.NUTR_GOAL_ONGOING,
      NutritionGoalStatus.NUTR_GOAL_PAUSED,
    ];
    const currentGoal = goals.find((g) => activeStatuses.includes(g.status)) ?? null;
    const historyGoals = goals.filter((g) => g !== currentGoal);

    // Enrich current goal (full info)
    const currentEnriched = currentGoal
      ? (await this.enrichGoalType([currentGoal]))[0]
      : null;

    // Enrich history goals (limited fields)
    const historyEnriched = await this.enrichHistoryGoals(historyGoals);

    // Map history sang format yêu cầu
    const history: NutritionGoalHistoryItem[] = historyEnriched.map((g) => ({
      id: g.id,
      goalType: g.goalType,
      goalTypeInfo: g.goalTypeInfo,
      status: g.status,
      statusInfo: g.statusInfo,
      targetWeight: g.targetWeight,
      startDate: g.startDate,
      endDate: g.endDate,
      createdAt: g.createdAt,
    }));

    return {
      current: currentEnriched,
      history,
    };
  }

  async findCurrentGoal(
    userId: number,
  ): Promise<NutritionGoalWithGoalTypeInfo | null> {
    const goal = await this.prisma.nutritionGoal.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!goal) {
      return null;
    }

    const [enriched] = await this.enrichGoalType([goal]);
    return enriched;
  }

  async findOne(id: number): Promise<NutritionGoalWithGoalTypeInfo> {
    const goal = await this.prisma.nutritionGoal.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!goal) {
      throw new NotFoundException(`NutritionGoal #${id} không tồn tại`);
    }

    const [enriched] = await this.enrichGoalType([goal]);
    return enriched;
  }

  async update(id: number, userId: number, dto: UpdateNutritionGoalDto) {
    const goal = await this.prisma.nutritionGoal.findUnique({ where: { id } });

    if (!goal) {
      throw new NotFoundException(`NutritionGoal #${id} không tồn tại`);
    }

    if (goal.userId !== userId) {
      throw new NotFoundException(`NutritionGoal #${id} không tồn tại`);
    }

    const autoSetEndDate =
      dto.status === NutritionGoalStatus.NUTR_GOAL_COMPLETED ||
      dto.status === NutritionGoalStatus.NUTR_GOAL_FAILED;

    return this.prisma.nutritionGoal.update({
      where: { id },
      data: {
        ...(dto.goalType != null && { goalType: dto.goalType }),
        ...(dto.targetWeight != null && { targetWeight: dto.targetWeight }),
        ...(dto.targetCalories != null && {
          targetCalories: dto.targetCalories,
        }),
        ...(dto.targetProtein != null && {
          targetProtein: dto.targetProtein,
        }),
        ...(dto.targetCarbs != null && {
          targetCarbs: dto.targetCarbs,
        }),
        ...(dto.targetFat != null && {
          targetFat: dto.targetFat,
        }),
        ...(dto.targetFiber != null && {
          targetFiber: dto.targetFiber,
        }),

        ...(dto.startDate != null && { startDate: new Date(dto.startDate) }),
        // Nếu COMPLETED hoặc FAILED, tự động cập nhật endDate = hôm nay
        // Nếu không, dùng endDate từ dto (nếu có)
        endDate: autoSetEndDate
          ? new Date()
          : dto.endDate != null
            ? new Date(dto.endDate)
            : undefined,
        ...(dto.status != null && { status: dto.status as any }),
      },
    });
  }

  async remove(id: number, userId: number): Promise<void> {
    const goal = await this.prisma.nutritionGoal.findUnique({ where: { id } });

    if (!goal) {
      throw new NotFoundException(`NutritionGoal #${id} không tồn tại`);
    }

    if (goal.userId !== userId) {
      throw new NotFoundException(`NutritionGoal #${id} không tồn tại`);
    }

    await this.prisma.nutritionGoal.delete({ where: { id } });
  }

  async removeMany(
    ids: number[],
    userId: number,
  ): Promise<{ deletedCount: number }> {
    // Chỉ xóa những goals thuộc về user hiện tại
    const result = await this.prisma.nutritionGoal.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    return { deletedCount: result.count };
  }

  // ─── Smart Create ─────────────────────────────────────────────────────────

  async smartCreate(userId: number, dto: SmartCreateNutritionGoalDto) {
    // 1. Lấy UserProfile
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new BadRequestException(
        'Bạn cần tạo hồ sơ cá nhân trước khi đặt mục tiêu',
      );
    }

    // 2. Tính ngày
    const startDate = new Date();
    const endDate = new Date(dto.endDate);
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (days < MIN_DAYS) {
      throw new BadRequestException(
        `Thời gian mục tiêu phải ít nhất ${MIN_DAYS} ngày`,
      );
    }

    // 3. Tính BMR theo Mifflin-St Jeor từ profile (đã lưu sẵn)
    // Dùng luôn bmr/tdee từ profile để nhất quán với dữ liệu hiện có
    const tdee = profile.tdee;

    // 4. Tính targetCalories theo goalType
    const goalType = dto.goalType as GoalType;
    let targetCalories: number;

    if (goalType === GoalType.GOAL_MAINTAIN) {
      targetCalories = tdee;
    } else {
      if (dto.targetWeight == null) {
        throw new BadRequestException(
          'Cân nặng mục tiêu không được để trống với loại mục tiêu này',
        );
      }
      const weightDiff = Math.abs(profile.weight - dto.targetWeight);
      const dailyDelta = (KCAL_PER_KG * weightDiff) / days;

      const maxDelta =
        goalType === GoalType.GOAL_STRICT
          ? MAX_DAILY_DELTA_KCAL
          : SAFE_DAILY_DELTA_KCAL;

      if (dailyDelta > maxDelta) {
        const minDays = Math.ceil((KCAL_PER_KG * weightDiff) / maxDelta);
        throw new BadRequestException(
          `Mục tiêu quá nhanh, cần ít nhất ${minDays} ngày để đạt mục tiêu an toàn`,
        );
      }

      targetCalories =
        goalType === GoalType.GOAL_GAIN
          ? tdee + dailyDelta
          : tdee - dailyDelta;
    }

    // 5. Clamp calories tối thiểu an toàn
    const minCalories =
      profile.gender === GenderType.MALE ? MIN_CALORIES_MALE : MIN_CALORIES_FEMALE;
    targetCalories = Math.max(Math.round(targetCalories), minCalories);

    // 6. Tính macro từ tỉ lệ theo goalType
    const ratio = MACRO_RATIOS[goalType];
    // Protein & Carbs: 4 kcal/g — Fat: 9 kcal/g
    const targetProtein = Math.round((targetCalories * ratio.protein) / 4);
    const targetCarbs = Math.round((targetCalories * ratio.carbs) / 4);
    const targetFat = Math.round((targetCalories * ratio.fat) / 9);
    const targetFiber = ratio.fiber;

    // 7. Tạo goal
    return this.prisma.nutritionGoal.create({
      data: {
        userId,
        goalType,
        targetWeight: dto.targetWeight ?? null,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
        targetFiber,
        status: NutritionGoalStatus.NUTR_GOAL_ONGOING,
        startDate,
        endDate,
      },
    });
  }
}
