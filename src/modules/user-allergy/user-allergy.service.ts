import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateUserAllergyDto } from './dto/create-user-allergy.dto.js';
import type { UpdateUserAllergyDto } from './dto/update-user-allergy.dto.js';

@Injectable()
export class UserAllergyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserAllergyDto) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { id: dto.userProfileId },
    });
    if (!profile) throw new NotFoundException(`UserProfile #${dto.userProfileId} không tồn tại`);

    const allergen = await this.prisma.allergen.findUnique({
      where: { id: dto.allergenId },
    });
    if (!allergen) throw new NotFoundException(`Allergen #${dto.allergenId} không tồn tại`);

    const existing = await this.prisma.userAllergy.findFirst({
      where: {
        userProfileId: dto.userProfileId,
        allergenId: dto.allergenId,
      },
    });
    if (existing) {
      throw new ConflictException('Dị ứng này đã được thêm vào profile của bạn');
    }

    return this.prisma.userAllergy.create({
      data: {
        userProfileId: dto.userProfileId,
        allergenId: dto.allergenId,
        severity: dto.severity,
        note: dto.note,
      },
      include: { allergen: true },
    });
  }

  findAllByUserProfile(userProfileId: number) {
    return this.prisma.userAllergy.findMany({
      where: { userProfileId },
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
