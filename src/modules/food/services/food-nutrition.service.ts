import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import aqp from 'api-query-params';
import type { AqpQuery } from 'api-query-params';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  prismaSortFromAqp,
  stripAdminPaginationFilter,
} from '../../../common/utils/admin-pagination.util';
import { CreateNutritionComponentDto } from '../dto/food-nutrition/create-nutrition-component.dto.js';
import { CreateFoodNutritionDto } from '../dto/food-nutrition/create-food-nutrition.dto.js';
import { UpdateFoodNutritionDto } from '../dto/food-nutrition/update-food-nutrition.dto.js';
import { UpsertNutritionValueDto } from '../dto/food-nutrition/upsert-nutrition-value.dto.js';
import { UnitType } from '../../../generated/prisma/enums.js';

@Injectable()
export class FoodNutritionService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Nutrient (formerly NutritionComponent) ───────────────────────────────

  findAllComponents() {
    return this.prisma.nutrient.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findAllComponentsAdmin(page: number, limit: number, queryString: string) {
    try {
      const parsed = aqp(queryString) as AqpQuery;
      const { filter } = parsed;
      const { sort: aqpSort } = parsed;

      stripAdminPaginationFilter(filter as Record<string, unknown>);
      const sort = prismaSortFromAqp(aqpSort, { updatedAt: 'desc' });

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;

      const totalItems = await this.prisma.nutrient.count({ where: filter });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const result = await this.prisma.nutrient.findMany({
        where: filter,
        orderBy: sort,
        skip: offset,
        take: defaultLimit,
      });

      return {
        EC: 0,
        EM: 'Get nutrients with query paginate success (admin)',
        meta: {
          current: page,
          pageSize: limit,
          pages: totalPages,
          total: totalItems,
        },
        result,
      };
    } catch (error) {
      console.error(
        'Error in food nutrition service get nutrients paginate (admin):',
        (error as Error).message,
      );
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in nutrients get paginate',
      });
    }
  }

  createComponent(dto: CreateNutritionComponentDto) {
    return this.prisma.nutrient.create({
      data: {
        name: dto.name,
        unit: dto.unit,
      },
    });
  }

  async updateComponent(id: number, dto: CreateNutritionComponentDto) {
    const existing = await this.prisma.nutrient.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Nutrient #${id} không tồn tại`);
    }

    return this.prisma.nutrient.update({
      where: { id },
      data: {
        ...(dto.name != null && { name: dto.name }),
        ...(dto.unit != null && { unit: dto.unit }),
      },
    });
  }

  async removeComponent(id: number) {
    const existing = await this.prisma.nutrient.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Nutrient #${id} không tồn tại`);
    }

    await this.prisma.nutrient.delete({ where: { id } });
  }

  // ─── IngredientNutrition (per Ingredient) ───────────────────────────────────

  findByIngredientId(ingredientId: number) {
    return this.prisma.ingredientNutrition.findMany({
      where: { ingredientId },
      include: {
        values: {
          include: { nutrient: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneNutrition(id: number) {
    const nutrition = await this.prisma.ingredientNutrition.findUnique({
      where: { id },
      include: {
        values: {
          include: { nutrient: true },
        },
      },
    });

    if (!nutrition) {
      throw new NotFoundException(`IngredientNutrition #${id} không tồn tại`);
    }

    return nutrition;
  }

  async createNutrition(ingredientId: number, dto: CreateFoodNutritionDto) {
    const ingredient = await this.prisma.ingredient.findUnique({ where: { id: ingredientId } });
    if (!ingredient) {
      throw new NotFoundException(`Ingredient #${ingredientId} không tồn tại`);
    }

    return this.prisma.ingredientNutrition.create({
      data: {
        ingredientId,
        servingSize: dto.servingSize,
        servingUnit: dto.servingUnit,
        source: dto.source,
        isCalculated: dto.isCalculated ?? false,
      },
    });
  }

  async updateNutrition(id: number, dto: UpdateFoodNutritionDto) {
    const existing = await this.prisma.ingredientNutrition.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`IngredientNutrition #${id} không tồn tại`);
    }

    return this.prisma.ingredientNutrition.update({
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
    const existing = await this.prisma.ingredientNutrition.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`IngredientNutrition #${id} không tồn tại`);
    }

    await this.prisma.ingredientNutrition.delete({ where: { id } });
  }

  async upsertValues(nutritionId: number, dto: UpsertNutritionValueDto) {
    const nutrition = await this.prisma.ingredientNutrition.findUnique({
      where: { id: nutritionId },
    });
    if (!nutrition) {
      throw new NotFoundException(
        `IngredientNutrition #${nutritionId} không tồn tại`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.nutritionValue.deleteMany({
        where: { ingredientNutritionId: nutritionId },
      }),
      this.prisma.nutritionValue.createMany({
        data: dto.values.map((v) => ({
          ingredientNutritionId: nutritionId,
          nutrientId: v.nutrientId,
          value: v.value,
        })),
      }),
    ]);

    return this.findOneNutrition(nutritionId);
  }

  async getNutritionForFoodIngredients(foodId: number) {
    const food = await this.prisma.food.findUnique({
      where: { id: foodId },
      include: { foodIngredients: { include: { ingredient: true } } },
    });
    if (!food) {
      throw new NotFoundException(`Food #${foodId} không tồn tại`);
    }

    const ingredientIds = food.foodIngredients.map((fi) => fi.ingredientId);
    if (ingredientIds.length === 0) return [];

    return this.prisma.ingredientNutrition.findMany({
      where: { ingredientId: { in: ingredientIds } },
      include: {
        ingredient: true,
        values: { include: { nutrient: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
