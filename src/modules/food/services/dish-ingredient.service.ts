import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FoodType } from '../../../generated/prisma/enums.js';
import { CreateDishIngredientDto } from '../dto/dish-ingredient/create-dish-ingredient.dto.js';
import { UpdateDishIngredientDto } from '../dto/dish-ingredient/update-dish-ingredient.dto.js';

@Injectable()
export class DishIngredientService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateDishType(foodId: number) {
    const food = await this.prisma.food.findUnique({ where: { id: foodId } });
    if (!food) {
      throw new NotFoundException(`Food #${foodId} không tồn tại`);
    }
    if (food.foodType !== FoodType.DISH) {
      throw new BadRequestException('Food phải có foodType = DISH');
    }
  }

  async findByDish(dishId: number) {
    await this.validateDishType(dishId);
    return this.prisma.foodIngredient.findMany({
      where: { foodId: dishId },
      include: {
        ingredient: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addIngredient(dishId: number, dto: CreateDishIngredientDto) {
    await this.validateDishType(dishId);

    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: dto.ingredientId },
    });
    if (!ingredient) {
      throw new NotFoundException(`Nguyên liệu #${dto.ingredientId} không tồn tại`);
    }

    return this.prisma.foodIngredient.create({
      data: {
        foodId: dishId,
        ingredientId: dto.ingredientId,
        quantityGrams: dto.quantityGrams,
      },
    });
  }

  async updateIngredient(id: number, dto: UpdateDishIngredientDto) {
    const existing = await this.prisma.foodIngredient.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`FoodIngredient #${id} không tồn tại`);
    }

    return this.prisma.foodIngredient.update({
      where: { id },
      data: {
        ...(dto.quantityGrams != null && { quantityGrams: dto.quantityGrams }),
      },
    });
  }

  async removeIngredient(id: number) {
    const existing = await this.prisma.foodIngredient.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`FoodIngredient #${id} không tồn tại`);
    }

    await this.prisma.foodIngredient.delete({ where: { id } });
  }
}
