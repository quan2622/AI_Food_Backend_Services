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

    // Lấy thông tin dinh dưỡng từ Food
    const food = await this.prisma.food.findUnique({
      where: { id: dto.foodId },
    });
    if (!food) throw new NotFoundException(`Food #${dto.foodId} không tồn tại`);

    const calories = calcNutrition(food.calories, dto.quantity);
    const protein = calcNutrition(food.protein, dto.quantity);
    const carbs = calcNutrition(food.carbs, dto.quantity);
    const fat = calcNutrition(food.fat, dto.quantity);
    const fiber = calcNutrition(food.fiber, dto.quantity);

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
          fiber,
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
      }),
    ]);

    // Cập nhật DailyLog: cộng dồn dinh dưỡng của bữa ăn vào ngày tương ứng
    await this.dailyLogService.addNutrition(userId, meal.mealDateTime, {
      calories,
      protein,
      carbs,
      fat,
      fiber,
    });

    return mealItem;
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
            calories: true,
            protein: true,
            carbs: true,
            fat: true,
            fiber: true,
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
        food: true,
      },
    });
    if (!item) throw new NotFoundException(`MealItem #${id} không tồn tại`);
    if (item.meal.dailyLog.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền cập nhật item này');

    if (dto.quantity == null) return item;

    const newQ = dto.quantity;
    const oldCalories = item.calories;
    const oldProtein = item.protein;
    const oldCarbs = item.carbs;
    const oldFat = item.fat;
    const oldFiber = item.fiber;

    const newCalories = calcNutrition(Number(item.food.calories), newQ);
    const newProtein = calcNutrition(Number(item.food.protein), newQ);
    const newCarbs = calcNutrition(Number(item.food.carbs), newQ);
    const newFat = calcNutrition(Number(item.food.fat), newQ);
    const newFiber = calcNutrition(Number(item.food.fiber), newQ);
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
          fiber: newFiber,
        },
        include: {
          food: { select: { id: true, foodName: true, imageUrl: true } },
        },
      }),
    ]);

    // Cập nhật DailyLog: trừ giá trị cũ rồi cộng giá trị mới
    const mealDate = item.meal.mealDateTime;
    await this.dailyLogService.subtractNutrition(userId, mealDate, {
      calories: Number(oldCalories),
      protein: Number(oldProtein),
      carbs: Number(oldCarbs),
      fat: Number(oldFat),
      fiber: Number(oldFiber),
    });
    await this.dailyLogService.addNutrition(userId, mealDate, {
      calories: newCalories,
      protein: newProtein,
      carbs: newCarbs,
      fat: newFat,
      fiber: newFiber,
    });

    return updated;
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

    await this.prisma.$transaction([
      this.prisma.mealItem.delete({ where: { id } }),
    ]);

    // Cập nhật DailyLog: trừ dinh dưỡng của item vừa xóa
    await this.dailyLogService.subtractNutrition(
      userId,
      item.meal.mealDateTime,
      {
        calories: Number(item.calories),
        protein: Number(item.protein),
        carbs: Number(item.carbs),
        fat: Number(item.fat),
        fiber: Number(item.fiber),
      },
    );
  }
}
