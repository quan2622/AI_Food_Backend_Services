import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateMealItemDto } from './dto/create-meal-item.dto.js';
import type { UpdateMealItemDto } from './dto/update-meal-item.dto.js';
import { DailyLogService } from '../daily-log/daily-log.service';

// Nutrition per 100g formula
const calcNutrition = (foodValue: number, quantity: number) =>
  parseFloat((foodValue * quantity).toFixed(4));

@Injectable()
export class MealItemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dailyLogService: DailyLogService,
  ) {}

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

    // Cập nhật DailyLog: cộng dồn dinh dưỡng của bữa ăn vào ngày tương ứng
    await this.dailyLogService.addNutrition(
      userId,
      new Date(meal.mealDateTime as Date),
      { calories, protein, carbs, fat },
    );

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
    const oldProtein = item.protein;
    const oldCarbs = item.carbs;
    const oldFat = item.fat;

    const newCalories = calcNutrition(Number(item.food.calories), newQ);
    const newProtein = calcNutrition(Number(item.food.protein), newQ);
    const newCarbs = calcNutrition(Number(item.food.carbs), newQ);
    const newFat = calcNutrition(Number(item.food.fat), newQ);
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

    // Cập nhật DailyLog: trừ giá trị cũ rồi cộng giá trị mới
    const mealDate = new Date(item.meal.mealDateTime as Date);
    await this.dailyLogService.subtractNutrition(userId, mealDate, {
      calories: Number(oldCalories),
      protein: Number(oldProtein),
      carbs: Number(oldCarbs),
      fat: Number(oldFat),
    });
    await this.dailyLogService.addNutrition(userId, mealDate, {
      calories: newCalories,
      protein: newProtein,
      carbs: newCarbs,
      fat: newFat,
    });

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

    // Cập nhật DailyLog: trừ dinh dưỡng của item vừa xóa
    await this.dailyLogService.subtractNutrition(
      userId,
      new Date(item.meal.mealDateTime as Date),
      {
        calories: Number(item.calories),
        protein: Number(item.protein),
        carbs: Number(item.carbs),
        fat: Number(item.fat),
      },
    );
  }
}
