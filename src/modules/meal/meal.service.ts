import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MealType } from '../../generated/prisma/enums';
import type { CreateMealDto } from './dto/create-meal.dto.js';
import type { UpdateMealDto } from './dto/update-meal.dto.js';

@Injectable()
export class MealService {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy mealTypeInfo từ AllCode theo keyMap
  private async enrichMealType<
    T extends {
      mealType: MealType;
      mealItems?: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
      }[];
    },
  >(
    meals: T[],
  ): Promise<
    (T & {
      mealTypeInfo: { value: string; description: string | null } | null;
      totalCalories: number;
      totalProtein: number;
      totalCarbs: number;
      totalFat: number;
      totalFiber: number;
    })[]
  > {
    const keyMaps = [...new Set(meals.map((m) => m.mealType))];
    const allCodes = await this.prisma.allCode.findMany({
      where: { keyMap: { in: keyMaps } },
      select: { keyMap: true, value: true, description: true },
    });
    const map = new Map(allCodes.map((a) => [a.keyMap, a]));

    return meals.map((meal) => {
      const totals = (meal.mealItems || []).reduce(
        (acc, item) => ({
          calories: acc.calories + (Number(item.calories) || 0),
          protein: acc.protein + (Number(item.protein) || 0),
          carbs: acc.carbs + (Number(item.carbs) || 0),
          fat: acc.fat + (Number(item.fat) || 0),
          fiber: acc.fiber + (Number(item.fiber) || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      );

      return {
        ...meal,
        mealTypeInfo: map.get(meal.mealType) ?? null,
        totalCalories: parseFloat(totals.calories.toFixed(4)),
        totalProtein: parseFloat(totals.protein.toFixed(4)),
        totalCarbs: parseFloat(totals.carbs.toFixed(4)),
        totalFat: parseFloat(totals.fat.toFixed(4)),
        totalFiber: parseFloat(totals.fiber.toFixed(4)),
      };
    });
  }

  private get mealInclude() {
    return {
      mealItems: {
        include: {
          food: {
            select: {
              id: true,
              foodName: true,
              calories: true,
              imageUrl: true,
              foodCategory: { select: { name: true } },
            },
          },
        },
      },
    };
  }

  async create(userId: number, dto: CreateMealDto) {
    // Kiểm tra DailyLog tồn tại và thuộc về user hiện tại
    const dailyLog = await this.prisma.dailyLog.findUnique({
      where: { id: dto.dailyLogId },
    });
    if (!dailyLog)
      throw new NotFoundException(`DailyLog #${dto.dailyLogId} không tồn tại`);
    if (dailyLog.userId !== userId)
      throw new ForbiddenException(
        'Bạn không có quyền thêm bữa ăn vào daily log này',
      );

    const meal = await this.prisma.meal.create({
      data: {
        dailyLogId: dto.dailyLogId,
        mealType: dto.mealType,
        mealDateTime: new Date(dto.mealDateTime),
      },
      include: this.mealInclude,
    });
    const [enriched] = await this.enrichMealType([meal]);
    return enriched;
  }

  async findAllByDailyLogId(dailyLogId: number, userId: number) {
    // Kiểm tra DailyLog tồn tại và thuộc về user hiện tại
    const dailyLog = await this.prisma.dailyLog.findUnique({
      where: { id: dailyLogId },
    });
    if (!dailyLog)
      throw new NotFoundException(`DailyLog #${dailyLogId} không tồn tại`);
    if (dailyLog.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền truy cập daily log này');

    const meals = await this.prisma.meal.findMany({
      where: { dailyLogId },
      orderBy: { mealDateTime: 'asc' },
      include: {
        mealItems: {
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
        },
      },
    });
    return this.enrichMealType(meals);
  }

  async findAll() {
    const meals = await this.prisma.meal.findMany({
      orderBy: { mealDateTime: 'desc' },
      include: {
        dailyLog: {
          select: {
            id: true,
            logDate: true,
            userId: true,
          },
        },
        mealItems: {
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
        },
      },
    });
    return this.enrichMealType(meals);
  }

  async findOne(id: number) {
    const meal = await this.prisma.meal.findUnique({
      where: { id },
      include: {
        dailyLog: {
          select: { id: true, logDate: true, userId: true },
        },
        ...this.mealInclude,
      },
    });
    if (!meal) throw new NotFoundException(`Meal #${id} không tồn tại`);
    const [enriched] = await this.enrichMealType([meal]);
    return enriched;
  }

  async update(id: number, userId: number, dto: UpdateMealDto) {
    const meal = await this.prisma.meal.findUnique({
      where: { id },
      include: { dailyLog: { select: { userId: true } } },
    });
    if (!meal) throw new NotFoundException(`Meal #${id} không tồn tại`);
    if (meal.dailyLog.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bữa ăn này');

    const updated = await this.prisma.meal.update({
      where: { id },
      data: {
        ...(dto.mealType != null && { mealType: dto.mealType }),
        ...(dto.mealDateTime != null && {
          mealDateTime: new Date(dto.mealDateTime),
        }),
      },
      include: this.mealInclude,
    });
    const [enriched] = await this.enrichMealType([updated]);
    return enriched;
  }

  async remove(id: number, userId: number): Promise<void> {
    const meal = await this.prisma.meal.findUnique({
      where: { id },
      include: { dailyLog: { select: { userId: true } } },
    });
    if (!meal) throw new NotFoundException(`Meal #${id} không tồn tại`);
    if (meal.dailyLog.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền xóa bữa ăn này');

    await this.prisma.meal.delete({ where: { id } });
  }
}
