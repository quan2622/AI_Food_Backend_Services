import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { CreateFoodDto } from '../dto/create-food.dto.js';
import type { UpdateFoodDto } from '../dto/update-food.dto.js';

@Injectable()
export class FoodService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateFoodDto) {
    return this.prisma.food.create({
      data: {
        foodName: dto.foodName,
        description: dto.description,
        categoryId: dto.categoryId ?? null,
        foodType: dto.foodType ?? 'INGREDIENT',
        imageUrl: dto.imageUrl,
        protein: dto.protein ?? 0,
        carbs: dto.carbs ?? 0,
        fat: dto.fat ?? 0,
        fiber: dto.fiber ?? 0,
        calories: dto.calories ?? 0,
      },
    });
  }

  async createMany(items: CreateFoodDto[]): Promise<{ createdCount: number }> {
    const result = await this.prisma.food.createMany({
      data: items.map((dto) => ({
        foodName: dto.foodName,
        description: dto.description,
        categoryId: dto.categoryId ?? null,
        foodType: dto.foodType ?? 'INGREDIENT',
        imageUrl: dto.imageUrl,
        protein: dto.protein ?? 0,
        carbs: dto.carbs ?? 0,
        fat: dto.fat ?? 0,
        fiber: dto.fiber ?? 0,
        calories: dto.calories ?? 0,
      })),
      skipDuplicates: true,
    });

    return { createdCount: result.count };
  }

  async findAll() {
    return this.prisma.food.findMany({
      orderBy: { foodName: 'asc' },
    });
  }

  async findByCategoryId(categoryId: number) {
    return this.prisma.food.findMany({
      where: { categoryId },
      orderBy: { foodName: 'asc' },
    });
  }

  async findOne(id: number) {
    const food = await this.prisma.food.findUnique({ where: { id } });

    if (!food) {
      throw new NotFoundException(`Food #${id} không tồn tại`);
    }

    return food;
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
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId ?? null }),
        ...(dto.foodType != null && { foodType: dto.foodType }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.protein != null && { protein: dto.protein }),
        ...(dto.carbs != null && { carbs: dto.carbs }),
        ...(dto.fat != null && { fat: dto.fat }),
        ...(dto.fiber != null && { fiber: dto.fiber }),
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

