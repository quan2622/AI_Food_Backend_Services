import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateNutritionComponentDto } from '../dto/food-nutrition/create-nutrition-component.dto.js';
import { CreateFoodNutritionDto } from '../dto/food-nutrition/create-food-nutrition.dto.js';
import { UpdateFoodNutritionDto } from '../dto/food-nutrition/update-food-nutrition.dto.js';
import { UpsertNutritionValueDto } from '../dto/food-nutrition/upsert-nutrition-value.dto.js';

@Injectable()
export class FoodNutritionService {
  constructor(private readonly prisma: PrismaService) {}

  // NutritionComponent
  findAllComponents() {
    return this.prisma.nutritionComponent.findMany({
      orderBy: { name: 'asc' },
    });
  }

  createComponent(dto: CreateNutritionComponentDto) {
    return this.prisma.nutritionComponent.create({
      data: {
        name: dto.name,
        unit: dto.unit,
      },
    });
  }

  async updateComponent(id: number, dto: CreateNutritionComponentDto) {
    const existing = await this.prisma.nutritionComponent.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`NutritionComponent #${id} không tồn tại`);
    }

    return this.prisma.nutritionComponent.update({
      where: { id },
      data: {
        ...(dto.name != null && { name: dto.name }),
        ...(dto.unit != null && { unit: dto.unit }),
      },
    });
  }

  async removeComponent(id: number) {
    const existing = await this.prisma.nutritionComponent.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`NutritionComponent #${id} không tồn tại`);
    }

    await this.prisma.nutritionComponent.delete({ where: { id } });
  }

  // FoodNutrition
  findByFoodId(foodId: number) {
    return this.prisma.foodNutrition.findMany({
      where: { foodId },
      include: {
        values: {
          include: { component: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneNutrition(id: number) {
    const nutrition = await this.prisma.foodNutrition.findUnique({
      where: { id },
      include: {
        values: {
          include: { component: true },
        },
      },
    });

    if (!nutrition) {
      throw new NotFoundException(`FoodNutrition #${id} không tồn tại`);
    }

    return nutrition;
  }

  async createNutrition(foodId: number, dto: CreateFoodNutritionDto) {
    const food = await this.prisma.food.findUnique({ where: { id: foodId } });
    if (!food) {
      throw new NotFoundException(`Food #${foodId} không tồn tại`);
    }

    return this.prisma.foodNutrition.create({
      data: {
        foodId,
        servingSize: dto.servingSize,
        servingUnit: dto.servingUnit,
        source: dto.source,
        isCalculated: dto.isCalculated ?? false,
      },
    });
  }

  async updateNutrition(id: number, dto: UpdateFoodNutritionDto) {
    const existing = await this.prisma.foodNutrition.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`FoodNutrition #${id} không tồn tại`);
    }

    return this.prisma.foodNutrition.update({
      where: { id },
      data: {
        ...(dto.servingSize != null && { servingSize: dto.servingSize }),
        ...(dto.servingUnit != null && { servingUnit: dto.servingUnit }),
        ...(dto.source != null && { source: dto.source }),
        ...(dto.isCalculated != null && { isCalculated: dto.isCalculated }),
      },
    });
  }

  async removeNutrition(id: number) {
    const existing = await this.prisma.foodNutrition.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`FoodNutrition #${id} không tồn tại`);
    }

    await this.prisma.foodNutrition.delete({ where: { id } });
  }

  async upsertValues(nutritionId: number, dto: UpsertNutritionValueDto) {
    const nutrition = await this.prisma.foodNutrition.findUnique({
      where: { id: nutritionId },
    });
    if (!nutrition) {
      throw new NotFoundException(
        `FoodNutrition #${nutritionId} không tồn tại`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.foodNutritionValue.deleteMany({
        where: { nutritionId },
      }),
      this.prisma.foodNutritionValue.createMany({
        data: dto.values.map((v) => ({
          nutritionId,
          componentId: v.componentId,
          value: v.value,
        })),
      }),
    ]);

    return this.findOneNutrition(nutritionId);
  }

  // Stub: tính dinh dưỡng từ DishIngredient, sẽ được hoàn thiện sau
  async calculateFromIngredients(foodId: number) {
    const food = await this.prisma.food.findUnique({ where: { id: foodId } });
    if (!food) {
      throw new NotFoundException(`Food #${foodId} không tồn tại`);
    }

    return this.findByFoodId(foodId);
  }
}
