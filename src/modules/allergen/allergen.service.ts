import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
