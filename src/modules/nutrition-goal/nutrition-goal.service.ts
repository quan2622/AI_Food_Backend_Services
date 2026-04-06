import {
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
import { NutritionGoalStatus } from '@/generated/prisma/enums';

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
      const sort = prismaSortFromAqp(aqpSort, { createdAt: 'desc' });

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

    // Goal mới nhất là current
    const [currentGoal, ...historyGoals] = goals;

    // Enrich current goal (full info)
    const [currentEnriched] = await this.enrichGoalType([currentGoal]);

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
        ...(dto.endDate != null && { endDate: new Date(dto.endDate) }),
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
}
