import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateFoodDto } from './dto/create-food.dto.js';
import type { UpdateFoodDto } from './dto/update-food.dto.js';

type FoodWithCategoryInfo = {
  id: number;
  foodName: string;
  description: string | null;
  category: string;
  categoryInfo: { value: string; description: string | null } | null;
  imageUrl: string | null;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class FoodService {
  constructor(private readonly prisma: PrismaService) {}

  // Enrich category với value từ AllCode theo keyMap (batch, không N+1)
  private async enrichCategory<T extends { category: string }>(
    foods: T[],
  ): Promise<
    (T & {
      categoryInfo: { value: string; description: string | null } | null;
    })[]
  > {
    const keyMaps = [...new Set(foods.map((f) => f.category))];

    const allCodes = await this.prisma.allCode.findMany({
      where: { keyMap: { in: keyMaps } },
      select: { keyMap: true, value: true, description: true },
    });

    const allCodeMap = new Map(allCodes.map((a) => [a.keyMap, a]));

    return foods.map((food) => ({
      ...food,
      categoryInfo: allCodeMap.get(food.category) ?? null,
    }));
  }

  create(dto: CreateFoodDto) {
    return this.prisma.food.create({
      data: {
        foodName: dto.foodName,
        description: dto.description,
        category: dto.category,
        imageUrl: dto.imageUrl,
        protein: dto.protein ?? 0,
        carbs: dto.carbs ?? 0,
        fat: dto.fat ?? 0,
        calories: dto.calories ?? 0,
      },
    });
  }

  async createMany(items: CreateFoodDto[]): Promise<{ createdCount: number }> {
    const result = await this.prisma.food.createMany({
      data: items.map((dto) => ({
        foodName: dto.foodName,
        description: dto.description,
        category: dto.category,
        imageUrl: dto.imageUrl,
        protein: dto.protein ?? 0,
        carbs: dto.carbs ?? 0,
        fat: dto.fat ?? 0,
        calories: dto.calories ?? 0,
      })),
      skipDuplicates: true,
    });

    return { createdCount: result.count };
  }

  async findAll(): Promise<FoodWithCategoryInfo[]> {
    const foods = await this.prisma.food.findMany({
      orderBy: { foodName: 'asc' },
    });
    return this.enrichCategory(foods);
  }

  async findByCategory(category: string): Promise<FoodWithCategoryInfo[]> {
    const foods = await this.prisma.food.findMany({
      where: { category },
      orderBy: { foodName: 'asc' },
    });
    return this.enrichCategory(foods);
  }

  async findOne(id: number): Promise<FoodWithCategoryInfo> {
    const food = await this.prisma.food.findUnique({ where: { id } });

    if (!food) {
      throw new NotFoundException(`Food #${id} không tồn tại`);
    }

    const [enriched] = await this.enrichCategory([food]);
    return enriched;
  }

  async update(id: number, dto: UpdateFoodDto) {
    const food = await this.prisma.food.findUnique({ where: { id } });

    if (!food) {
      throw new NotFoundException(`Food #${id} không tồn tại`);
    }

    return this.prisma.food.update({
      where: { id },
      data: {
        ...(dto.foodName != null && { foodName: dto.foodName }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category != null && { category: dto.category }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.protein != null && { protein: dto.protein }),
        ...(dto.carbs != null && { carbs: dto.carbs }),
        ...(dto.fat != null && { fat: dto.fat }),
        ...(dto.calories != null && { calories: dto.calories }),
      },
    });
  }

  async remove(id: number): Promise<void> {
    const food = await this.prisma.food.findUnique({ where: { id } });

    if (!food) {
      throw new NotFoundException(`Food #${id} không tồn tại`);
    }

    await this.prisma.food.delete({ where: { id } });
  }

  async removeMany(ids: number[]): Promise<{ deletedCount: number }> {
    const result = await this.prisma.food.deleteMany({
      where: { id: { in: ids } },
    });

    return { deletedCount: result.count };
  }
}
