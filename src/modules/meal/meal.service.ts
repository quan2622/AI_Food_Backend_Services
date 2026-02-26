import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateMealDto } from './dto/create-meal.dto.js';
import type { UpdateMealDto } from './dto/update-meal.dto.js';

@Injectable()
export class MealService {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy mealTypeInfo từ AllCode theo keyMap
  private async enrichMealType<T extends { mealType: string }>(
    meals: T[],
  ): Promise<
    (T & {
      mealTypeInfo: { value: string; description: string | null } | null;
    })[]
  > {
    const keyMaps = [...new Set(meals.map((m) => m.mealType))];
    const allCodes = await this.prisma.allCode.findMany({
      where: { keyMap: { in: keyMaps } },
      select: { keyMap: true, value: true, description: true },
    });
    const map = new Map(allCodes.map((a) => [a.keyMap, a]));
    return meals.map((meal) => ({
      ...meal,
      mealTypeInfo: map.get(meal.mealType) ?? null,
    }));
  }

  async create(userId: number, dto: CreateMealDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User #${userId} không tồn tại`);

    return this.prisma.meal.create({
      data: {
        userId,
        mealType: dto.mealType,
        mealDateTime: new Date(dto.mealDateTime),
      },
    });
  }

  async findAllByUserId(userId: number) {
    const meals = await this.prisma.meal.findMany({
      where: { userId },
      orderBy: { mealDateTime: 'desc' },
      include: {
        mealItems: {
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
        },
        foodImages: {
          select: {
            id: true,
            imageUrl: true,
            fileName: true,
            uploadedAt: true,
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
        user: { select: { id: true, fullName: true, email: true } },
        mealItems: {
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
        },
        foodImages: {
          select: {
            id: true,
            imageUrl: true,
            fileName: true,
            uploadedAt: true,
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
        user: { select: { id: true, fullName: true, email: true } },
        mealItems: {
          include: {
            food: {
              select: {
                id: true,
                foodName: true,
                imageUrl: true,
                category: true,
                calories: true,
              },
            },
          },
        },
        foodImages: true,
      },
    });
    if (!meal) throw new NotFoundException(`Meal #${id} không tồn tại`);
    const [enriched] = await this.enrichMealType([meal]);
    return enriched;
  }

  async update(id: number, userId: number, dto: UpdateMealDto) {
    const meal = await this.prisma.meal.findUnique({ where: { id } });
    if (!meal) throw new NotFoundException(`Meal #${id} không tồn tại`);
    if (meal.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa bữa ăn này');

    return this.prisma.meal.update({
      where: { id },
      data: {
        ...(dto.mealType != null && { mealType: dto.mealType }),
        ...(dto.mealDateTime != null && {
          mealDateTime: new Date(dto.mealDateTime),
        }),
      },
    });
  }

  async remove(id: number, userId: number): Promise<void> {
    const meal = await this.prisma.meal.findUnique({ where: { id } });
    if (!meal) throw new NotFoundException(`Meal #${id} không tồn tại`);
    if (meal.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền xóa bữa ăn này');

    await this.prisma.meal.delete({ where: { id } });
  }
}
