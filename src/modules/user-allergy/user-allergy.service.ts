import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import aqp from 'api-query-params';
import type { AqpQuery } from 'api-query-params';
import { isEmpty } from 'lodash';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { AllCodeLookupService } from '../../common/services/allcode-lookup.service';
import type { CreateUserAllergyDto } from './dto/create-user-allergy.dto.js';
import type { UpdateUserAllergyDto } from './dto/update-user-allergy.dto.js';
import { UserAllergyPaginationDto } from './dto/user-allergy-pagination.dto';
import { UserAllergyGroupedDto } from './dto/user-allergy-grouped.dto';

@Injectable()
export class UserAllergyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly allCodeLookup: AllCodeLookupService,
  ) {}

  async create(dto: CreateUserAllergyDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException(`User #${dto.userId} không tồn tại`);

    const allergen = await this.prisma.allergen.findUnique({
      where: { id: dto.allergenId },
    });
    if (!allergen) throw new NotFoundException(`Allergen #${dto.allergenId} không tồn tại`);

    const existing = await this.prisma.userAllergy.findFirst({
      where: {
        userId: dto.userId,
        allergenId: dto.allergenId,
      },
    });
    if (existing) {
      throw new ConflictException('Dị ứng này đã được thêm vào tài khoản của bạn');
    }

    return this.prisma.userAllergy.create({
      data: {
        userId: dto.userId,
        allergenId: dto.allergenId,
        severity: dto.severity,
        note: dto.note,
      },
      include: { allergen: true },
    });
  }

  findAllByUserId(userId: number) {
    return this.prisma.userAllergy.findMany({
      where: { userId },
      include: { allergen: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllAdmin(
    page: number,
    limit: number,
    queryString: string,
  ) {
    try {
      const parsed = aqp(queryString) as AqpQuery;
      const { filter } = parsed;
      const { sort: aqpSort } = parsed;

      delete filter.current;
      delete filter.pageSize;

      // Convert aqp sort format to Prisma sort format
      let sort: Record<string, 'asc' | 'desc'>;
      if (isEmpty(aqpSort)) {
        sort = { updatedAt: 'desc' };
      } else {
        sort = Object.entries(aqpSort as Record<string, number>).reduce(
          (acc, [key, value]) => {
            acc[key] = value === 1 ? 'asc' : 'desc';
            return acc;
          },
          {} as Record<string, 'asc' | 'desc'>,
        );
      }

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;

      const totalItems = await this.prisma.userAllergy.count({ where: filter });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const result = await this.prisma.userAllergy.findMany({
        where: filter,
        orderBy: sort,
        include: {
          allergen: true,
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        skip: offset,
        take: defaultLimit,
      });

      const severityMap = await this.allCodeLookup.mapByKeyMaps(
        result.map((r) => r.severity),
      );

      // Group by user
      const groupedMap = new Map<number, UserAllergyGroupedDto>();
      for (const item of result) {
        const allergyRow = {
          id: item.id,
          severity: item.severity,
          severityInfo: severityMap.get(item.severity) ?? null,
          note: item.note,
          allergenId: item.allergenId,
          allergen: item.allergen,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
        const existing = groupedMap.get(item.userId);
        if (existing) {
          existing.allergies.push(allergyRow);
        } else {
          groupedMap.set(item.userId, {
            userId: item.userId,
            user: item.user,
            allergies: [allergyRow],
          });
        }
      }

      return {
        EC: 0,
        EM: 'Get user allergies with query paginate success (admin)',
        meta: {
          current: page,
          pageSize: limit,
          pages: totalPages,
          total: totalItems,
        },
        result: plainToInstance(UserAllergyGroupedDto, Array.from(groupedMap.values())),
      };
    } catch (error) {
      console.error('Error in user allergy service get paginate(admin):', error.message);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in user allergy service get paginate',
      });
    }
  }

  async findOne(id: number) {
    const item = await this.prisma.userAllergy.findUnique({
      where: { id },
      include: { allergen: true },
    });
    if (!item) throw new NotFoundException(`UserAllergy #${id} không tồn tại`);
    return item;
  }

  async update(id: number, dto: UpdateUserAllergyDto) {
    const item = await this.prisma.userAllergy.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`UserAllergy #${id} không tồn tại`);

    return this.prisma.userAllergy.update({
      where: { id },
      data: {
        ...(dto.severity != null && { severity: dto.severity }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
      include: { allergen: true },
    });
  }

  async remove(id: number) {
    const item = await this.prisma.userAllergy.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`UserAllergy #${id} không tồn tại`);

    await this.prisma.userAllergy.delete({ where: { id } });
  }
}
