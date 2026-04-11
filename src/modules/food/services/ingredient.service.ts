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
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { SearchService } from '../../search/search.service';
import type { CreateIngredientDto } from '../dto/ingredient/create-ingredient.dto.js';
import type { UpdateIngredientDto } from '../dto/ingredient/update-ingredient.dto.js';

@Injectable()
export class IngredientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly searchService: SearchService,
  ) {}

  async create(dto: CreateIngredientDto, image: Express.Multer.File) {
    const { url } = await this.cloudinaryService.uploadFile(image);

    const created = await this.prisma.ingredient.create({
      data: {
        ingredientName: dto.ingredientName,
        description: dto.description,
        imageUrl: url,
        ...(dto.nutritionValues?.length && {
          ingredientNutritions: {
            create: {
              servingSize: 100,
              servingUnit: 'UNIT_G',
              source: dto.source ?? 'SRC_MANUAL',
              values: {
                create: dto.nutritionValues.map((nv) => ({
                  nutrientId: nv.nutrientId,
                  value: nv.value,
                })),
              },
            },
          },
        }),
      },
      include: {
        ingredientNutritions: {
          include: { values: { include: { nutrient: { select: { id: true, name: true, unit: true } } } } },
        },
      },
    });
    this.searchService.indexIngredient(created.id).catch(() => null);
    return created;
  }

  async update(
    id: number,
    dto: UpdateIngredientDto,
    image?: Express.Multer.File,
  ) {
    const existing = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Ingredient #${id} không tồn tại`);
    }

    let imageUrl = existing.imageUrl;
    if (image) {
      const { url } = await this.cloudinaryService.uploadFile(image);
      imageUrl = url;
    }

    await this.prisma.ingredient.update({
      where: { id },
      data: {
        ...(dto.ingredientName != null && { ingredientName: dto.ingredientName }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(image != null && { imageUrl }),
      },
    });

    // Upsert nutrition values if provided
    if (dto.nutritionValues?.length || dto.source !== undefined) {
      let nutritionProfile = await this.prisma.ingredientNutrition.findFirst({
        where: { ingredientId: id },
      });

      if (!nutritionProfile) {
        nutritionProfile = await this.prisma.ingredientNutrition.create({
          data: {
            ingredientId: id,
            servingSize: 100,
            servingUnit: 'UNIT_G',
            source: dto.source ?? 'SRC_MANUAL',
          },
        });
      } else if (dto.source !== undefined) {
        await this.prisma.ingredientNutrition.update({
          where: { id: nutritionProfile.id },
          data: { source: dto.source },
        });
      }

      for (const nv of dto.nutritionValues ?? []) {
        await this.prisma.nutritionValue.upsert({
          where: {
            ingredientNutritionId_nutrientId: {
              ingredientNutritionId: nutritionProfile.id,
              nutrientId: nv.nutrientId,
            },
          },
          update: { value: nv.value },
          create: {
            ingredientNutritionId: nutritionProfile.id,
            nutrientId: nv.nutrientId,
            value: nv.value,
          },
        });
      }
    }

    const result = await this.findOne(id);
    this.searchService.indexIngredient(id).catch(() => null);
    return result;
  }

  findAll() {
    return this.prisma.ingredient.findMany({
      orderBy: { ingredientName: 'asc' },
    });
  }

  async findTopAllergen(limit = 10) {
    // Lấy top ingredients có nhiều allergen nhất
    const rows = await this.prisma.ingredientAllergen.groupBy({
      by: ['ingredientId'],
      _count: { allergenId: true },
      orderBy: { _count: { allergenId: 'desc' } },
      take: limit,
    });

    if (rows.length === 0) {
      // Fallback: trả về 10 ingredients mới nhất nếu chưa có mapping
      return this.prisma.ingredient.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, ingredientName: true, imageUrl: true },
      });
    }

    const ids = rows.map((r) => r.ingredientId);
    const ingredients = await this.prisma.ingredient.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        ingredientName: true,
        imageUrl: true,
        ingredientAllergens: { select: { allergenId: true } },
      },
    });

    // Sắp xếp lại theo thứ tự count giảm dần
    const countMap = new Map(rows.map((r) => [r.ingredientId, r._count.allergenId]));
    return ingredients.sort((a, b) => (countMap.get(b.id) ?? 0) - (countMap.get(a.id) ?? 0));
  }

  searchByName(name: string) {
    return this.prisma.ingredient.findMany({
      where: {
        ingredientName: { contains: name ?? '', mode: 'insensitive' },
      },
      orderBy: { ingredientName: 'asc' },
      take: 20,
      select: { id: true, ingredientName: true, imageUrl: true },
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

      const totalItems = await this.prisma.ingredient.count({ where: filter });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const raw = await this.prisma.ingredient.findMany({
        where: filter,
        orderBy: sort,
        skip: offset,
        take: defaultLimit,
        include: {
          ingredientNutritions: {
            include: {
              values: {
                include: {
                  nutrient: { select: { id: true, name: true, unit: true } },
                },
              },
            },
          },
        },
      });

      const getNutrient = (
        values: { value: number; nutrient: { name: string } }[],
        name: string,
      ) => values.find((v) => v.nutrient.name === name)?.value ?? null;

      const result = raw.map((item) => {
        const values = item.ingredientNutritions[0]?.values ?? [];
        return {
          ...item,
          calories: getNutrient(values, 'Calories'),
          protein: getNutrient(values, 'Protein'),
          carbs: getNutrient(values, 'Carbohydrates'),
          fat: getNutrient(values, 'Fat'),
          fiber: getNutrient(values, 'Fiber'),
          nutritionSource: item.ingredientNutritions[0]?.source ?? null,
        };
      });

      return {
        EC: 0,
        EM: 'Get ingredients with query paginate success (admin)',
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
        'Error in ingredient service get paginate (admin):',
        (error as Error).message,
      );
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in ingredient service get paginate',
      });
    }
  }

  async findOne(id: number) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
      include: {
        ingredientNutritions: {
          include: {
            values: {
              include: {
                nutrient: {
                  select: {
                    id: true,
                    name: true,
                    unit: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!ingredient) {
      throw new NotFoundException(`Ingredient #${id} không tồn tại`);
    }
    return ingredient;
  }
}

