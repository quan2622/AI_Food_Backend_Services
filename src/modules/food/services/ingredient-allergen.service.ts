import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import aqp from 'api-query-params';
import type { AqpQuery } from 'api-query-params';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  prismaSortFromAqp,
  stripAdminPaginationFilter,
} from '../../../common/utils/admin-pagination.util';
import type { CreateIngredientAllergenDto } from '../dto/ingredient-allergen/create-ingredient-allergen.dto.js';

@Injectable()
export class IngredientAllergenService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIngredientAllergenDto) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: dto.ingredientId },
    });
    if (!ingredient) {
      throw new NotFoundException(`Ingredient #${dto.ingredientId} không tồn tại`);
    }

    const allergen = await this.prisma.allergen.findUnique({
      where: { id: dto.allergenId },
    });
    if (!allergen) {
      throw new NotFoundException(`Allergen #${dto.allergenId} không tồn tại`);
    }

    const existing = await this.prisma.ingredientAllergen.findFirst({
      where: {
        ingredientId: dto.ingredientId,
        allergenId: dto.allergenId,
      },
    });
    if (existing) {
      throw new ConflictException('Dị ứng này đã được liên kết với nguyên liệu');
    }

    return this.prisma.ingredientAllergen.create({
      data: {
        ingredientId: dto.ingredientId,
        allergenId: dto.allergenId,
      },
      include: { allergen: true },
    });
  }

  findByIngredient(ingredientId: number) {
    return this.prisma.ingredientAllergen.findMany({
      where: { ingredientId },
      include: { allergen: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllAdmin(page: number, limit: number, queryString: string) {
    try {
      const parsed = aqp(queryString) as AqpQuery;
      const { filter } = parsed;
      const { sort: aqpSort } = parsed;

      stripAdminPaginationFilter(filter as Record<string, unknown>);
      const sort = prismaSortFromAqp(aqpSort, { createdAt: 'desc' });

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;

      const totalItems = await this.prisma.ingredientAllergen.count({
        where: filter,
      });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const result = await this.prisma.ingredientAllergen.findMany({
        where: filter,
        orderBy: sort,
        include: {
          allergen: true,
          ingredient: true,
        },
        skip: offset,
        take: defaultLimit,
      });

      return {
        EC: 0,
        EM: 'Get ingredient-allergens with query paginate success (admin)',
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
        'Error in ingredient-allergen service get paginate (admin):',
        (error as Error).message,
      );
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in ingredient-allergen service get paginate',
      });
    }
  }

  async remove(id: number) {
    const item = await this.prisma.ingredientAllergen.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`IngredientAllergen #${id} không tồn tại`);
    }

    await this.prisma.ingredientAllergen.delete({ where: { id } });
  }

  async removeByCompositeKey(ingredientId: number, allergenId: number) {
    const item = await this.prisma.ingredientAllergen.findUnique({
      where: {
        ingredientId_allergenId: { ingredientId, allergenId },
      },
    });
    if (!item) {
      throw new NotFoundException('Liên kết giữa nguyên liệu và dị ứng không tồn tại');
    }

    await this.prisma.ingredientAllergen.delete({ where: { id: item.id } });
  }
}
