import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateMealItemDto } from './dto/create-meal-item.dto.js';
import type { UpdateMealItemDto } from './dto/update-meal-item.dto.js';

// Nutrition per 100g formula
const calcNutrition = (foodValue: number, quantity: number) =>
  parseFloat((foodValue * quantity).toFixed(4));

@Injectable()
export class MealItemService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateMealItemDto) {
    // Kiểm tra meal tồn tại + ownership
    const meal = await this.prisma.meal.findUnique({
      where: { id: dto.mealId },
    });
    if (!meal) throw new NotFoundException(`Meal #${dto.mealId} không tồn tại`);
    if (meal.userId !== userId)
      throw new ForbiddenException(
        'Bạn không có quyền thêm item vào bữa ăn này',
      );

    // Lấy thông tin dinh dưỡng từ Food
    const food = await this.prisma.food.findUnique({
      where: { id: dto.foodId },
    });
    if (!food) throw new NotFoundException(`Food #${dto.foodId} không tồn tại`);

    const calories = calcNutrition(food.calories, dto.quantity);
    const protein = calcNutrition(food.protein, dto.quantity);
    const carbs = calcNutrition(food.carbs, dto.quantity);
    const fat = calcNutrition(food.fat, dto.quantity);

    // Transaction: tạo item + cập nhật totalCalories của Meal
    const [mealItem] = await this.prisma.$transaction([
      this.prisma.mealItem.create({
        data: {
          foodId: dto.foodId,
          mealId: dto.mealId,
          quantity: dto.quantity,
          calories,
          protein,
          carbs,
          fat,
        },
        include: {
          food: {
            select: {
              id: true,
              foodName: true,
              imageUrl: true,
              category: true,
            },
          },
        },
      }),
      this.prisma.meal.update({
        where: { id: dto.mealId },
        data: { totalCalories: { increment: calories } },
      }),
    ]);

    return mealItem;
  }

  async findAllByMealId(mealId: number) {
    const meal = await this.prisma.meal.findUnique({ where: { id: mealId } });
    if (!meal) throw new NotFoundException(`Meal #${mealId} không tồn tại`);

    return this.prisma.mealItem.findMany({
      where: { mealId },
      include: {
        food: {
          select: { id: true, foodName: true, imageUrl: true, category: true },
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
            calories: true,
            protein: true,
            carbs: true,
            fat: true,
          },
        },
        meal: {
          select: {
            id: true,
            mealType: true,
            mealDateTime: true,
            totalCalories: true,
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
      include: { meal: true, food: true },
    });
    if (!item) throw new NotFoundException(`MealItem #${id} không tồn tại`);
    if (item.meal.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền cập nhật item này');

    if (dto.quantity == null) return item;

    const newQ = dto.quantity;
    const oldCalories = item.calories;

    const newCalories = calcNutrition(item.food.calories, newQ);
    const newProtein = calcNutrition(item.food.protein, newQ);
    const newCarbs = calcNutrition(item.food.carbs, newQ);
    const newFat = calcNutrition(item.food.fat, newQ);
    const calorieDiff = newCalories - oldCalories;

    const [updated] = await this.prisma.$transaction([
      this.prisma.mealItem.update({
        where: { id },
        data: {
          quantity: newQ,
          calories: newCalories,
          protein: newProtein,
          carbs: newCarbs,
          fat: newFat,
        },
        include: {
          food: { select: { id: true, foodName: true, imageUrl: true } },
        },
      }),
      this.prisma.meal.update({
        where: { id: item.mealId },
        data: { totalCalories: { increment: calorieDiff } },
      }),
    ]);

    return updated;
  }

  async remove(id: number, userId: number): Promise<void> {
    const item = await this.prisma.mealItem.findUnique({
      where: { id },
      include: { meal: true },
    });
    if (!item) throw new NotFoundException(`MealItem #${id} không tồn tại`);
    if (item.meal.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền xóa item này');

    await this.prisma.$transaction([
      this.prisma.mealItem.delete({ where: { id } }),
      this.prisma.meal.update({
        where: { id: item.mealId },
        data: { totalCalories: { decrement: item.calories } },
      }),
    ]);
  }
}
