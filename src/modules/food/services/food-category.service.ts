import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateFoodCategoryDto } from '../dto/food/create-food-category.dto.js';
import { UpdateFoodCategoryDto } from '../dto/food/update-food-category.dto.js';

@Injectable()
export class FoodCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.foodCategory.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { name: 'asc' },
    });
  }

  findRoots() {
    return this.prisma.foodCategory.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
    });
  }

  findChildren(parentId: number) {
    return this.prisma.foodCategory.findMany({
      where: { parentId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.foodCategory.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!category) {
      throw new NotFoundException(`FoodCategory #${id} không tồn tại`);
    }

    return category;
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

