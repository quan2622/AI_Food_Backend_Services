import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateMealItemDto } from './dto/create-meal-item.dto.js';
import type { UpdateMealItemDto } from './dto/update-meal-item.dto.js';

@Injectable()
export class MealItemService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateMealItemDto) {
    // Kiểm tra meal tồn tại + ownership qua dailyLog
    const meal = await this.prisma.meal.findUnique({
      where: { id: dto.mealId },
      include: { dailyLog: { select: { userId: true } } },
    });
    if (!meal) throw new NotFoundException(`Meal #${dto.mealId} không tồn tại`);
    if (meal.dailyLog.userId !== userId)
      throw new ForbiddenException(
        'Bạn không có quyền thêm item vào bữa ăn này',
      );

    // Kiểm tra food tồn tại
    const food = await this.prisma.food.findUnique({
      where: { id: dto.foodId },
    });
    if (!food) throw new NotFoundException(`Food #${dto.foodId} không tồn tại`);

    return this.prisma.mealItem.create({
      data: {
        foodId: dto.foodId,
        mealId: dto.mealId,
        quantity: dto.quantity,
        calories: dto.calories ?? 0,
        protein: dto.protein ?? 0,
        carbs: dto.carbs ?? 0,
        fat: dto.fat ?? 0,
        fiber: dto.fiber ?? 0,
      },
      include: {
        food: {
          select: {
            id: true,
            foodName: true,
            imageUrl: true,
            foodCategory: { select: { name: true } },
          },
        },
      },
    });
  }

  async findAllByMealId(mealId: number) {
    const meal = await this.prisma.meal.findUnique({ where: { id: mealId } });
    if (!meal) throw new NotFoundException(`Meal #${mealId} không tồn tại`);

    return this.prisma.mealItem.findMany({
      where: { mealId },
      include: {
        food: {
          select: {
            id: true,
            foodName: true,
            imageUrl: true,
            foodCategory: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.mealItem.findUnique({
      where: { id },
      include: {
        food: {
          select: {
            id: true,
            foodName: true,
          },
        },
        meal: {
          select: {
            id: true,
            mealType: true,
            mealDateTime: true,
            dailyLogId: true,
          },
        },
      },
    });
    if (!item) throw new NotFoundException(`MealItem #${id} không tồn tại`);
    return item;
  }

  async update(id: number, userId: number, dto: UpdateMealItemDto) {
    const item = await this.prisma.mealItem.findUnique({
      where: { id },
      include: {
        meal: {
          include: { dailyLog: { select: { userId: true } } },
        },
      },
    });
    if (!item) throw new NotFoundException(`MealItem #${id} không tồn tại`);
    if (item.meal.dailyLog.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền cập nhật item này');

    return this.prisma.mealItem.update({
      where: { id },
      data: {
        ...(dto.quantity != null && { quantity: dto.quantity }),
        ...(dto.calories != null && { calories: dto.calories }),
        ...(dto.protein != null && { protein: dto.protein }),
        ...(dto.carbs != null && { carbs: dto.carbs }),
        ...(dto.fat != null && { fat: dto.fat }),
        ...(dto.fiber != null && { fiber: dto.fiber }),
      },
      include: {
        food: { select: { id: true, foodName: true, imageUrl: true } },
      },
    });
  }

  async remove(id: number, userId: number): Promise<void> {
    const item = await this.prisma.mealItem.findUnique({
      where: { id },
      include: {
        meal: {
          include: { dailyLog: { select: { userId: true } } },
        },
      },
    });
    if (!item) throw new NotFoundException(`MealItem #${id} không tồn tại`);
    if (item.meal.dailyLog.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền xóa item này');

    await this.prisma.mealItem.delete({ where: { id } });
  }
}
