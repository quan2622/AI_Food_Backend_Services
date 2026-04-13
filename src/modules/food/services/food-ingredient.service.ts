import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDishIngredientDto } from '../dto/dish-ingredient/create-dish-ingredient.dto.js';
import { UpdateDishIngredientDto } from '../dto/dish-ingredient/update-dish-ingredient.dto.js';
import { type FoodIngredientUnit } from '../dto/dish-ingredient/create-dish-ingredient.dto.js';

@Injectable()
export class FoodIngredientService {
  private static readonly UNIT_TO_GRAMS: Record<FoodIngredientUnit, number> = {
    UNIT_G: 1,
    UNIT_KG: 1000,
    UNIT_MG: 0.001,
    UNIT_OZ: 28.349523125,
    UNIT_LB: 453.59237,
  };

  constructor(private readonly prisma: PrismaService) {}

  private toGrams(quantity: number, unit: FoodIngredientUnit): number {
    const factor = FoodIngredientService.UNIT_TO_GRAMS[unit];
    return Math.round(quantity * factor * 1000) / 1000;
  }

  private normalizeQuantityGrams(
    dto: Pick<CreateDishIngredientDto, 'quantity' | 'unit' | 'quantityGrams'>,
  ): number {
    if (dto.quantityGrams != null) {
      return dto.quantityGrams;
    }

    if (dto.quantity != null && dto.unit) {
      return this.toGrams(dto.quantity, dto.unit);
    }

    throw new BadRequestException(
      'Cần truyền quantityGrams hoặc cặp quantity + unit',
    );
  }

  async findByDish(dishId: number) {
    return this.prisma.foodIngredient.findMany({
      where: { foodId: dishId },
      include: {
        ingredient: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addIngredient(dishId: number, dto: CreateDishIngredientDto) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: dto.ingredientId },
    });
    if (!ingredient) {
      throw new NotFoundException(
        `Nguyên liệu #${dto.ingredientId} không tồn tại`,
      );
    }

    return this.prisma.foodIngredient.create({
      data: {
        foodId: dishId,
        ingredientId: dto.ingredientId,
        quantityGrams: this.normalizeQuantityGrams(dto),
      },
    });
  }

  async updateIngredient(id: number, dto: UpdateDishIngredientDto) {
    const existing = await this.prisma.foodIngredient.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`FoodIngredient #${id} không tồn tại`);
    }

    return this.prisma.foodIngredient.update({
      where: { id },
      data: {
        ...((dto.quantityGrams != null ||
          (dto.quantity != null && dto.unit != null)) && {
          quantityGrams: this.normalizeQuantityGrams(dto),
        }),
      },
    });
  }

  async removeIngredient(id: number) {
    const existing = await this.prisma.foodIngredient.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`FoodIngredient #${id} không tồn tại`);
    }

    await this.prisma.foodIngredient.delete({ where: { id } });
  }
}

