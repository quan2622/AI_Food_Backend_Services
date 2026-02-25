import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateNutritionGoalDto } from './dto/create-nutrition-goal.dto.js';
import type { UpdateNutritionGoalDto } from './dto/update-nutrition-goal.dto.js';

// Type trả về đã được enrich thêm goalTypeInfo từ AllCode
type NutritionGoalWithGoalTypeInfo = {
  id: number;
  goalType: string;
  goalTypeInfo: { value: string; description: string | null } | null;
  targetCaloriesPerDay: number;
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

  // Enrich goalType với value từ AllCode theo keyMap
  private async enrichGoalType<T extends { goalType: string }>(
    goals: T[],
  ): Promise<
    (T & {
      goalTypeInfo: { value: string; description: string | null } | null;
    })[]
  > {
    const keyMaps = [...new Set(goals.map((g) => g.goalType))];

    const allCodes = await this.prisma.allCode.findMany({
      where: { keyMap: { in: keyMaps } },
      select: { keyMap: true, value: true, description: true },
    });

    const allCodeMap = new Map(allCodes.map((a) => [a.keyMap, a]));

    return goals.map((goal) => ({
      ...goal,
      goalTypeInfo: allCodeMap.get(goal.goalType) ?? null,
    }));
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
        targetCaloriesPerDay: dto.targetCaloriesPerDay,
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

  async findAllByUserId(
    userId: number,
  ): Promise<NutritionGoalWithGoalTypeInfo[]> {
    const goals = await this.prisma.nutritionGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return this.enrichGoalType(goals);
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
        ...(dto.targetCaloriesPerDay != null && {
          targetCaloriesPerDay: dto.targetCaloriesPerDay,
        }),
        ...(dto.startDate != null && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate != null && { endDate: new Date(dto.endDate) }),
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
