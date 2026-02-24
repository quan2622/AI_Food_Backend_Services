import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Food } from '../../generated/prisma/client.js';
import type { CreateFoodDto } from './dto/create-food.dto.js';
import type { UpdateFoodDto } from './dto/update-food.dto.js';

@Injectable()
export class FoodService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateFoodDto): Promise<Food> {
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

  findAll(): Promise<Food[]> {
    return this.prisma.food.findMany({
      orderBy: { foodName: 'asc' },
    });
  }

  findByCategory(category: string): Promise<Food[]> {
    return this.prisma.food.findMany({
      where: { category },
      orderBy: { foodName: 'asc' },
    });
  }

  async findOne(id: number): Promise<Food> {
    const food = await this.prisma.food.findUnique({ where: { id } });

    if (!food) {
      throw new NotFoundException(`Food #${id} không tồn tại`);
    }

    return food;
  }

  async update(id: number, dto: UpdateFoodDto): Promise<Food> {
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
}
