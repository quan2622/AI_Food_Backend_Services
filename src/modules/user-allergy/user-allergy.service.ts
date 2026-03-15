import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateUserAllergyDto } from './dto/create-user-allergy.dto.js';
import type { UpdateUserAllergyDto } from './dto/update-user-allergy.dto.js';

@Injectable()
export class UserAllergyService {
  constructor(private readonly prisma: PrismaService) {}

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
