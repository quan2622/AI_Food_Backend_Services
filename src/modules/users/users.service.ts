import {
  Injectable,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import aqp from 'api-query-params';
import type { AqpQuery } from 'api-query-params';
import { isEmpty } from 'lodash';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { NutritionGoalStatus } from '@/generated/prisma/enums';
import type { User } from '../../generated/prisma/client.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import type { UpdatePasswordDto } from './dto/update-password.dto.js';
import type { UpdateStatusDto } from './dto/update-status.dto.js';
import { UserPaginationDto } from './dto/user-pagination.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const SALT_ROUNDS = 10;

const hashPassword: (data: string, saltRounds: number) => Promise<string> = (
  bcrypt as { hash: (data: string, saltRounds: number) => Promise<string> }
).hash;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const hashedPassword = await hashPassword(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        fullName: dto.fullName,
        avatarUrl: dto.avatarUrl,
        dateOfBirth: dto.birthOfDate ? new Date(dto.birthOfDate) : undefined,
        isAdmin: dto.isAdmin ?? false,
      },
    });

    const { password: _pw, ...result } = user;
    return result;
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findAllAdmin(
    page: number,
    limit: number,
    queryString: string,
  ) {
    try {
      const parsed = aqp(queryString) as AqpQuery;
      const { filter, projection } = parsed;
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

      const totalItems = await this.prisma.user.count({ where: filter });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const result = await this.prisma.user.findMany({
        where: filter,
        orderBy: sort,
        skip: offset,
        take: defaultLimit,
      });

      const data = result.map((user) => {
        const { password: _pw, accessToken: _at, refreshToken: _rt, ...userWithoutSensitive } = user;
        return userWithoutSensitive;
      });

      return {
        EC: 0,
        EM: 'Get users with query paginate success (admin)',
        meta: {
          current: page,
          pageSize: limit,
          pages: totalPages,
          total: totalItems,
        },
        result: plainToInstance(UserPaginationDto, data),
      };
    } catch (error) {
      console.error('Error in user service get users paginate(admin):', error.message);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in user service get users paginate',
      });
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findOne(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User #${id} không tồn tại`);
    }

    const { password: _pw, ...result } = user;

    return result;
  }

  async findOneAdmin(
    id: number,
  ): Promise<Omit<User, 'password'> & { userProfile: any; currentGoal: any | null }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userProfile: true,
        nutritionGoals: {
          where: { status: NutritionGoalStatus.NUTR_GOAL_ONGOING },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User #${id} không tồn tại`);
    }

    const { password: _pw, accessToken: _at, refreshToken: _rt, nutritionGoals, ...result } = user;
    const currentGoal = nutritionGoals?.[0] ?? null;

    return {
      ...result,
      accessToken: _at,
      refreshToken: _rt,
      currentGoal,
    };
  }

  async getMe(
    id: number,
  ): Promise<Omit<User, 'password'> & { userProfile: any }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userProfile: true },
    });

    if (!user) {
      throw new NotFoundException(`User #${id} không tồn tại`);
    }

    const { password: _pw, ...result } = user;

    return result;
  }

  async update(
    id: number,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User #${id} không tồn tại`);
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existing) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }

    const data: Parameters<PrismaService['user']['update']>[0]['data'] = {
      ...(dto.email != null && { email: dto.email }),
      ...(dto.fullName != null && { fullName: dto.fullName }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      ...(dto.birthOfDate !== undefined && {
        dateOfBirth: dto.birthOfDate ? new Date(dto.birthOfDate) : null,
      }),
      ...(dto.isAdmin !== undefined && { isAdmin: dto.isAdmin }),
      ...(dto.status !== undefined && { status: dto.status }),
    };

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    const { password: _pw, ...result } = updated;

    return result;
  }

  async updateMe(
    id: number,
    dto: UpdateUserDto,
    avatar?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} không tồn tại`);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing) throw new ConflictException('Email đã được sử dụng');
    }

    let avatarUrl = dto.avatarUrl;
    if (avatar) {
      const uploaded = await this.cloudinaryService.uploadFile(avatar);
      avatarUrl = uploaded.url;
    }

    const data: Parameters<PrismaService['user']['update']>[0]['data'] = {
      ...(dto.email != null && { email: dto.email }),
      ...(dto.fullName != null && { fullName: dto.fullName }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(dto.birthOfDate !== undefined && {
        dateOfBirth: dto.birthOfDate ? new Date(dto.birthOfDate) : null,
      }),
    };

    const updated = await this.prisma.user.update({ where: { id }, data });
    const { password: _pw2, ...result } = updated;
    return result;
  }

  async remove(id: number): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User #${id} không tồn tại`);
    }

    await this.prisma.user.delete({ where: { id } });
  }

  async updatePassword(
    id: number,
    dto: UpdatePasswordDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User #${id} không tồn tại`);
    }

    const comparePassword: (data: string, encrypted: string) => Promise<boolean> = (
      bcrypt as { compare: (data: string, encrypted: string) => Promise<boolean> }
    ).compare;

    const isMatch = await comparePassword(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu cũ không đúng');
    }

    const hashedPassword = await hashPassword(dto.newPassword, SALT_ROUNDS);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    const { password: _pw, ...result } = updated;

    return result;
  }

  async updateStatus(
    id: number,
    dto: UpdateStatusDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User #${id} không tồn tại`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
    });

    const { password: _pw, ...result } = updated;

    return result;
  }

  async updateTokens(
    id: number,
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        accessToken,
        refreshToken,
      },
    });
  }

  async clearTokens(id: number): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        accessToken: null,
        refreshToken: null,
      },
    });
  }
}
