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
        imageUrl: dto.imageUrl,
      },
    });
  }

  async createMany(items: CreateFoodDto[]): Promise<{ createdCount: number }> {
    const result = await this.prisma.food.createMany({
      data: items.map((dto) => ({
        foodName: dto.foodName,
        description: dto.description,
        categoryId: dto.categoryId ?? null,
        imageUrl: dto.imageUrl,
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
      const sort = prismaSortFromAqp(aqpSort, { createdAt: 'desc' });

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
        ...(dto.categoryId !== undefined && {
          categoryId: dto.categoryId ?? null,
        }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
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
