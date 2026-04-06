import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import aqp from 'api-query-params';
import type { AqpQuery } from 'api-query-params';
import { PrismaService } from '../../prisma/prisma.service';
import {
  prismaSortFromAqp,
  stripAdminPaginationFilter,
} from '../../common/utils/admin-pagination.util';
import type { CreateAllergenDto } from './dto/create-allergen.dto.js';
import type { UpdateAllergenDto } from './dto/update-allergen.dto.js';

@Injectable()
export class AllergenService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.allergen.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findAllAdmin(page: number, limit: number, queryString: string) {
    try {
      const parsed = aqp(queryString) as AqpQuery;
      const { filter } = parsed;
      const { sort: aqpSort } = parsed;

      stripAdminPaginationFilter(filter as Record<string, unknown>);
      const sort = prismaSortFromAqp(aqpSort, { name: 'asc' });

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;

      const totalItems = await this.prisma.allergen.count({ where: filter });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const result = await this.prisma.allergen.findMany({
        where: filter,
        orderBy: sort,
        skip: offset,
        take: defaultLimit,
      });

      return {
        EC: 0,
        EM: 'Get allergens with query paginate success (admin)',
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
        'Error in allergen service get paginate (admin):',
        (error as Error).message,
      );
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in allergen service get paginate',
      });
    }
  }

  async findOne(id: number) {
    const item = await this.prisma.allergen.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Allergen #${id} không tồn tại`);
    return item;
  }

  create(dto: CreateAllergenDto) {
    return this.prisma.allergen.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async update(id: number, dto: UpdateAllergenDto) {
    const item = await this.prisma.allergen.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Allergen #${id} không tồn tại`);

    return this.prisma.allergen.update({
      where: { id },
      data: {
        ...(dto.name != null && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async remove(id: number) {
    const item = await this.prisma.allergen.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Allergen #${id} không tồn tại`);

    await this.prisma.allergen.delete({ where: { id } });
  }
}
