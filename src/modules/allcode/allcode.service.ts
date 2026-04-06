import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import aqp from 'api-query-params';
import type { AqpQuery } from 'api-query-params';
import { PrismaService } from '../../prisma/prisma.service';
import {
  prismaSortFromAqp,
  stripAdminPaginationFilter,
} from '../../common/utils/admin-pagination.util';
import type { AllCode } from '../../generated/prisma/client.js';
import type { CreateAllcodeDto } from './dto/create-allcode.dto.js';
import type { UpdateAllcodeDto } from './dto/update-allcode.dto.js';

@Injectable()
export class AllcodeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAllcodeDto): Promise<AllCode> {
    const existing = await this.prisma.allCode.findUnique({
      where: { keyMap: dto.keyMap },
    });
    if (existing) {
      throw new ConflictException(`keyMap "${dto.keyMap}" đã tồn tại`);
    }

    return this.prisma.allCode.create({
      data: {
        keyMap: dto.keyMap,
        type: dto.type,
        value: dto.value,
        description: dto.description,
      },
    });
  }

  async createMany(
    items: CreateAllcodeDto[],
  ): Promise<{ createdCount: number }> {
    const result = await this.prisma.allCode.createMany({
      data: items.map((dto) => ({
        keyMap: dto.keyMap,
        type: dto.type,
        value: dto.value,
        description: dto.description,
      })),
      skipDuplicates: true, // bỏ qua keyMap đã tồn tại
    });

    return { createdCount: result.count };
  }

  findAll(): Promise<AllCode[]> {
    return this.prisma.allCode.findMany({
      orderBy: { type: 'asc' },
    });
  }

  findByType(type: string): Promise<AllCode[]> {
    return this.prisma.allCode.findMany({
      where: { type },
      orderBy: { keyMap: 'asc' },
    });
  }

  async findAllAdmin(page: number, limit: number, queryString: string) {
    try {
      const parsed = aqp(queryString) as AqpQuery;
      const { filter } = parsed;
      const { sort: aqpSort } = parsed;

      stripAdminPaginationFilter(filter as Record<string, unknown>);
      const sort = prismaSortFromAqp(aqpSort, { type: 'asc' });

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;

      const totalItems = await this.prisma.allCode.count({ where: filter });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const result = await this.prisma.allCode.findMany({
        where: filter,
        orderBy: sort,
        skip: offset,
        take: defaultLimit,
      });

      return {
        EC: 0,
        EM: 'Get all codes with query paginate success (admin)',
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
        'Error in allcode service get paginate (admin):',
        (error as Error).message,
      );
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in allcode service get paginate',
      });
    }
  }

  async findOne(id: number): Promise<AllCode> {
    const code = await this.prisma.allCode.findUnique({ where: { id } });

    if (!code) {
      throw new NotFoundException(`AllCode #${id} không tồn tại`);
    }

    return code;
  }

  async findByKeyMap(keyMap: string): Promise<AllCode> {
    const code = await this.prisma.allCode.findUnique({ where: { keyMap } });

    if (!code) {
      throw new NotFoundException(
        `AllCode với keyMap "${keyMap}" không tồn tại`,
      );
    }

    return code;
  }

  async update(id: number, dto: UpdateAllcodeDto): Promise<AllCode> {
    const code = await this.prisma.allCode.findUnique({ where: { id } });

    if (!code) {
      throw new NotFoundException(`AllCode #${id} không tồn tại`);
    }

    if (dto.keyMap && dto.keyMap !== code.keyMap) {
      const existing = await this.prisma.allCode.findUnique({
        where: { keyMap: dto.keyMap },
      });
      if (existing) {
        throw new ConflictException(`keyMap "${dto.keyMap}" đã tồn tại`);
      }
    }

    return this.prisma.allCode.update({
      where: { id },
      data: {
        ...(dto.keyMap != null && { keyMap: dto.keyMap }),
        ...(dto.type != null && { type: dto.type }),
        ...(dto.value != null && { value: dto.value }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async remove(id: number): Promise<void> {
    const code = await this.prisma.allCode.findUnique({ where: { id } });

    if (!code) {
      throw new NotFoundException(`AllCode #${id} không tồn tại`);
    }

    await this.prisma.allCode.delete({ where: { id } });
  }

  async removeMany(ids: number[]): Promise<{ deletedCount: number }> {
    const result = await this.prisma.allCode.deleteMany({
      where: { id: { in: ids } },
    });

    return { deletedCount: result.count };
  }

  async removeAll(): Promise<{ deletedCount: number }> {
    const result = await this.prisma.allCode.deleteMany({});
    return { deletedCount: result.count };
  }
}
