import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import aqp from 'api-query-params';
import type { AqpQuery } from 'api-query-params';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  prismaSortFromAqp,
  stripAdminPaginationFilter,
} from '../../../common/utils/admin-pagination.util';
import { CreateFoodCategoryDto } from '../dto/food/create-food-category.dto.js';
import { UpdateFoodCategoryDto } from '../dto/food/update-food-category.dto.js';

@Injectable()
export class FoodCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  private mapCategoryWithFoodCount<
    T extends {
      _count: { foods: number };
    },
  >(category: T): Omit<T, '_count'> & { foodCount: number } {
    const { _count, ...rest } = category;
    return {
      ...rest,
      foodCount: _count.foods,
    };
  }

  findAll() {
    return this.prisma.foodCategory.findMany({
      where: { parentId: null },
      include: {
        children: true,
        _count: {
          select: { foods: true },
        },
      },
      orderBy: { name: 'asc' },
    }).then((categories) =>
      categories.map((category) => this.mapCategoryWithFoodCount(category)),
    );
  }

  findRoots() {
    return this.prisma.foodCategory.findMany({
      where: { parentId: null },
      include: {
        _count: {
          select: { foods: true },
        },
      },
      orderBy: { name: 'asc' },
    }).then((categories) =>
      categories.map((category) => this.mapCategoryWithFoodCount(category)),
    );
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

      const totalItems = await this.prisma.foodCategory.count({ where: filter });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const result = await this.prisma.foodCategory.findMany({
        where: filter,
        orderBy: sort,
        include: {
          parent: {
            select: { id: true, name: true },
          },
          children: {
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
          },
          _count: {
            select: { foods: true },
          },
        },
        skip: offset,
        take: defaultLimit,
      });

      const normalizedResult = result.map((category) =>
        this.mapCategoryWithFoodCount(category),
      );

      return {
        EC: 0,
        EM: 'Get food categories with query paginate success (admin)',
        meta: {
          current: page,
          pageSize: limit,
          pages: totalPages,
          total: totalItems,
        },
        result: normalizedResult,
      };
    } catch (error) {
      console.error(
        'Error in food category service get paginate (admin):',
        (error as Error).message,
      );
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in food category service get paginate',
      });
    }
  }

  findChildren(parentId: number) {
    return this.prisma.foodCategory.findMany({
      where: { parentId },
      include: {
        _count: {
          select: { foods: true },
        },
      },
      orderBy: { name: 'asc' },
    }).then((categories) =>
      categories.map((category) => this.mapCategoryWithFoodCount(category)),
    );
  }

  async findOne(id: number) {
    const category = await this.prisma.foodCategory.findUnique({
      where: { id },
      include: {
        children: true,
        _count: {
          select: { foods: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`FoodCategory #${id} không tồn tại`);
    }

    return this.mapCategoryWithFoodCount(category);
  }

  async create(dto: CreateFoodCategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.foodCategory.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('parentId không hợp lệ');
      }
    }

    return this.prisma.foodCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
        parentId: dto.parentId ?? null,
      },
    });
  }

  async update(id: number, dto: UpdateFoodCategoryDto) {
    const existing = await this.prisma.foodCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`FoodCategory #${id} không tồn tại`);
    }

    if (dto.parentId && dto.parentId === id) {
      throw new BadRequestException('parentId không được trùng với chính nó');
    }

    if (dto.parentId) {
      const parent = await this.prisma.foodCategory.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('parentId không hợp lệ');
      }
    }

    return this.prisma.foodCategory.update({
      where: { id },
      data: {
        ...(dto.name != null && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId ?? null }),
      },
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.foodCategory.findUnique({
      where: { id },
      include: { foods: true, children: true },
    });

    if (!existing) {
      throw new NotFoundException(`FoodCategory #${id} không tồn tại`);
    }

    if (existing.children.length > 0) {
      throw new BadRequestException('Không thể xóa category đang có category con');
    }

    if (existing.foods.length > 0) {
      throw new BadRequestException('Không thể xóa category đang được sử dụng bởi Food');
    }

    await this.prisma.foodCategory.delete({ where: { id } });
  }
}

