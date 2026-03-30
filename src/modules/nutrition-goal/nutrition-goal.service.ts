import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
  startDay: Date;
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

  startDay: Date;
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
        where: { type: 'NUTR_GOAL', value: { in: statusValues } },
        select: { keyMap: true, value: true, description: true },
      }),
    ]);

    const goalTypeMap = new Map(goalTypeAllCodes.map((a) => [a.keyMap, a]));
    const statusMap = new Map(statusAllCodes.map((a) => [a.value, a]));

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
        where: { type: 'NUTR_GOAL', value: { in: statusValues } },
        select: { keyMap: true, value: true, description: true },
      }),
    ]);

    const goalTypeMap = new Map(goalTypeAllCodes.map((a) => [a.keyMap, a]));
    const statusMap = new Map(statusAllCodes.map((a) => [a.value, a]));

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
        startDay: new Date(dto.startDay),
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
      startDay: g.startDay,
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

        ...(dto.startDay != null && { startDay: new Date(dto.startDay) }),
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
