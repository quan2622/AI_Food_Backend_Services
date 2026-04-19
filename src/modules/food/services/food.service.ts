import {
  BadRequestException,
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
import { SearchService } from '../../search/search.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import type { CreateFoodDto } from '../dto/create-food.dto.js';
import {
  type FoodIngredientUnit,
  type CreateFoodWithIngredientsDto,
} from '../dto/create-food-with-ingredients.dto.js';
import type { UpdateFoodDto } from '../dto/update-food.dto.js';

@Injectable()
export class FoodService {
  private static readonly UNIT_TO_GRAMS: Record<FoodIngredientUnit, number> = {
    UNIT_G: 1,
    UNIT_KG: 1000,
    UNIT_MG: 0.001,
    UNIT_OZ: 28.349523125,
    UNIT_LB: 453.59237,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private toGrams(quantity: number, unit: FoodIngredientUnit): number {
    const factor = FoodService.UNIT_TO_GRAMS[unit];
    return Math.round(quantity * factor * 1000) / 1000;
  }

  async create(dto: CreateFoodDto, image?: Express.Multer.File) {
    let imageUrl = dto.imageUrl;
    if (image) {
      const uploaded = await this.cloudinaryService.uploadFile(image);
      imageUrl = uploaded.url;
    }

    if (dto.ingredients && dto.ingredients.length > 0) {
      return this.createWithIngredients({
        foodName: dto.foodName,
        description: dto.description,
        imageUrl,
        categoryId: dto.categoryId,
        defaultServingGrams: dto.defaultServingGrams,
        ingredients: dto.ingredients,
      });
    }

    const created = this.prisma.food.create({
      data: {
        foodName: dto.foodName,
        description: dto.description,
        categoryId: dto.categoryId ?? null,
        imageUrl,
        defaultServingGrams: dto.defaultServingGrams,
      },
    });
    created.then((f) => this.searchService.indexFood(f.id).catch(() => null));
    return created;
  }

  async createWithIngredients(dto: CreateFoodWithIngredientsDto) {
    if (dto.ingredients.length === 0) {
      throw new BadRequestException('ingredients không được rỗng');
    }

    const ingredientIds = dto.ingredients.map((i) => i.ingredientId);
    const duplicateIds = ingredientIds.filter(
      (id, index) => ingredientIds.indexOf(id) !== index,
    );
    if (duplicateIds.length > 0) {
      throw new BadRequestException(
        `ingredientId bị trùng: ${[...new Set(duplicateIds)].join(', ')}`,
      );
    }

    const existingIngredients = await this.prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } },
      select: { id: true },
    });
    const existingIdSet = new Set(existingIngredients.map((i) => i.id));
    const missingIds = ingredientIds.filter((id) => !existingIdSet.has(id));
    if (missingIds.length > 0) {
      throw new NotFoundException(
        `Nguyên liệu không tồn tại: ${[...new Set(missingIds)].join(', ')}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const food = await tx.food.create({
        data: {
          foodName: dto.foodName,
          description: dto.description,
          categoryId: dto.categoryId ?? null,
          imageUrl: dto.imageUrl,
          defaultServingGrams: dto.defaultServingGrams,
        },
      });

      await tx.foodIngredient.createMany({
        data: dto.ingredients.map((item) => ({
          foodId: food.id,
          ingredientId: item.ingredientId,
          quantityGrams: this.toGrams(item.quantity, item.unit),
        })),
      });

      return tx.food.findUnique({
        where: { id: food.id },
        include: {
          foodCategory: {
            select: { id: true, name: true, description: true, parentId: true },
          },
          foodIngredients: {
            include: { ingredient: true },
            orderBy: { id: 'asc' },
          },
        },
      });
    });

    if (result) {
      this.searchService.indexFood(result.id).catch(() => null);
    }
    return result;
  }

  async createMany(items: CreateFoodDto[]): Promise<{ createdCount: number }> {
    const result = await this.prisma.food.createMany({
      data: items.map((dto) => ({
        foodName: dto.foodName,
        description: dto.description,
        categoryId: dto.categoryId ?? null,
        imageUrl: dto.imageUrl,
        defaultServingGrams: dto.defaultServingGrams,
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

  async findAllAdmin(page: number, limit: number, queryString: string) {
    try {
      const parsed = aqp(queryString) as AqpQuery;
      const { filter } = parsed;
      const { sort: aqpSort } = parsed;

      stripAdminPaginationFilter(filter as Record<string, unknown>);
      const sort = prismaSortFromAqp(aqpSort, { updatedAt: 'desc' });

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;

      const totalItems = await this.prisma.food.count({ where: filter });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const result = await this.prisma.food.findMany({
        where: filter,
        orderBy: sort,
        include: {
          foodCategory: {
            select: { id: true, name: true, description: true, parentId: true },
          },
          foodIngredients: {
            include: {
              ingredient: true,
            },
            orderBy: { id: 'asc' },
          },
        },
        skip: offset,
        take: defaultLimit,
      });

      return {
        EC: 0,
        EM: 'Get foods with query paginate success (admin)',
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
        'Error in food service get paginate (admin):',
        (error as Error).message,
      );
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in food service get paginate',
      });
    }
  }

  async findOne(id: number) {
    const food = await this.prisma.food.findUnique({ where: { id } });

    if (!food) {
      throw new NotFoundException(`Food #${id} không tồn tại`);
    }

    return food;
  }

  async findDetail(id: number) {
    const food = await this.prisma.food.findUnique({
      where: { id },
      include: {
        foodCategory: { select: { id: true, name: true } },
        foodIngredients: {
          include: {
            ingredient: {
              include: {
                ingredientNutritions: {
                  include: {
                    values: { include: { nutrient: true } },
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        nutritionProfile: {
          include: {
            values: { include: { nutrient: true } },
          },
        },
      },
    });

    if (!food) {
      throw new NotFoundException(`Food #${id} không tồn tại`);
    }

    const { nutritionProfile, foodIngredients, ...foodBase } = food;

    const nutritionPer100g = nutritionProfile
      ? nutritionProfile.values.reduce(
          (acc, v) => {
            const name = v.nutrient.name.toLowerCase();
            if (name === 'protein') acc.protein = v.value;
            else if (name === 'carbs' || name === 'carbohydrates') acc.carbs = v.value;
            else if (name === 'fat') acc.fat = v.value;
            else if (name === 'fiber') acc.fiber = v.value;
            else if (name === 'calories' || name.includes('calorie')) acc.calories = v.value;
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
        )
      : null;

    const ingredients = foodIngredients.map((fi) => {
      const latestNutrition = fi.ingredient.ingredientNutritions[0] ?? null;
      return {
        id: fi.id,
        ingredientId: fi.ingredientId,
        quantityGrams: fi.quantityGrams,
        ingredient: {
          id: fi.ingredient.id,
          name: fi.ingredient.ingredientName,
          description: fi.ingredient.description,
          imageUrl: fi.ingredient.imageUrl,
          nutritionPer100g: latestNutrition
            ? latestNutrition.values.reduce(
                (acc, v) => {
                  const name = v.nutrient.name.toLowerCase();
                  if (name === 'protein') acc.protein = v.value;
                  else if (name === 'carbs' || name === 'carbohydrates') acc.carbs = v.value;
                  else if (name === 'fat') acc.fat = v.value;
                  else if (name === 'fiber') acc.fiber = v.value;
                  else if (name === 'calories' || name.includes('calorie')) acc.calories = v.value;
                  return acc;
                },
                { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
              )
            : null,
        },
      };
    });

    return {
      ...foodBase,
      nutritionPer100g,
      ingredients,
    };
  }

  async update(id: number, dto: UpdateFoodDto, image?: Express.Multer.File) {
    const food = await this.prisma.food.findUnique({ where: { id } });

    if (!food) {
      throw new NotFoundException(`Food #${id} không tồn tại`);
    }

    let imageUrl = dto.imageUrl;
    if (image) {
      const uploaded = await this.cloudinaryService.uploadFile(image);
      imageUrl = uploaded.url;
    }

    const updated = await this.prisma.food.update({
      where: { id },
      data: {
        ...(dto.foodName != null && { foodName: dto.foodName }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.categoryId !== undefined && {
          categoryId: dto.categoryId ?? null,
        }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(dto.defaultServingGrams !== undefined && {
          defaultServingGrams: dto.defaultServingGrams ?? null,
        }),
      },
    });
    this.searchService.indexFood(id).catch(() => null);
    return updated;
  }

  async remove(id: number): Promise<void> {
    const food = await this.prisma.food.findUnique({ where: { id } });

    if (!food) {
      throw new NotFoundException(`Food #${id} không tồn tại`);
    }

    await this.prisma.food.delete({ where: { id } });
    this.searchService.removeFood(id).catch(() => null);
  }

  async removeMany(ids: number[]): Promise<{ deletedCount: number }> {
    const result = await this.prisma.food.deleteMany({
      where: { id: { in: ids } },
    });

    return { deletedCount: result.count };
  }
}
