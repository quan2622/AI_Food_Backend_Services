import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import type { User } from '../../generated/prisma/client.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';
import type { UpdatePasswordDto } from './dto/update-password.dto.js';
import type { UpdateStatusDto } from './dto/update-status.dto.js';

const SALT_ROUNDS = 10;

const hashPassword: (data: string, saltRounds: number) => Promise<string> = (
  bcrypt as { hash: (data: string, saltRounds: number) => Promise<string> }
).hash;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
        genderCode: dto.genderCode,
        avatarUrl: dto.avatarUrl,
        birthOfDate: dto.birthOfDate ? new Date(dto.birthOfDate) : undefined,
        isAdmin: dto.isAdmin ?? false,
      },
    });

    const { password: _pw, ...result } = user;
    return result;
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
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
      ...(dto.genderCode !== undefined && { genderCode: dto.genderCode }),
      ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      ...(dto.birthOfDate !== undefined && {
        birthOfDate: dto.birthOfDate ? new Date(dto.birthOfDate) : null,
      }),
      ...(dto.isAdmin !== undefined && { isAdmin: dto.isAdmin }),
    };

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    const { password: _pw, ...result } = updated;

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
}
