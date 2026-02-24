import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { NutritionGoal } from '../../generated/prisma/client.js';
import type { CreateNutritionGoalDto } from './dto/create-nutrition-goal.dto.js';
import type { UpdateNutritionGoalDto } from './dto/update-nutrition-goal.dto.js';

@Injectable()
export class NutritionGoalService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: number,
    dto: CreateNutritionGoalDto,
  ): Promise<NutritionGoal> {
    // Kiểm tra user tồn tại
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

  async findAll(): Promise<NutritionGoal[]> {
    return this.prisma.nutritionGoal.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllByUserId(userId: number): Promise<NutritionGoal[]> {
    return this.prisma.nutritionGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<NutritionGoal> {
    const goal = await this.prisma.nutritionGoal.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!goal) {
      throw new NotFoundException(`NutritionGoal #${id} không tồn tại`);
    }

    return goal;
  }

  async update(
    id: number,
    userId: number,
    dto: UpdateNutritionGoalDto,
  ): Promise<NutritionGoal> {
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
}
