import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateMealItemDto } from './dto/create-meal-item.dto.js';
import type { UpdateMealItemDto } from './dto/update-meal-item.dto.js';

// Export để controller có thể dùng
export interface NutritionPer100g {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

// Internal interface cho việc tính toán
interface NutritionValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

@Injectable()
export class MealItemService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Format nutrition values từ FoodNutritionProfile thành object dễ đọc
   */
  private formatNutritionPer100g(
    values: Array<{ value: number; nutrient: { name: string } }>,
  ): NutritionPer100g {
    const result: NutritionPer100g = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    };

    for (const value of values) {
      const nutrientName = value.nutrient.name.toLowerCase();
      if (nutrientName.includes('calorie') || nutrientName === 'calories') {
        result.calories = value.value;
      } else if (nutrientName === 'protein') {
        result.protein = value.value;
      } else if (nutrientName === 'carbs' || nutrientName === 'carbohydrates') {
        result.carbs = value.value;
      } else if (nutrientName === 'fat') {
        result.fat = value.value;
      } else if (nutrientName === 'fiber') {
        result.fiber = value.value;
      }
    }

    return result;
  }

  /**
   * Lấy giá trị dinh dưỡng từ FoodNutritionProfile và tính toán theo grams
   * Giá trị trong profile là per 100g, nên cần nhân với grams/100
   */
  private async calculateNutritionFromFood(
    foodId: number,
    grams: number,
  ): Promise<NutritionValues> {
    const nutritionProfile = await this.prisma.foodNutritionProfile.findUnique({
      where: { foodId },
      include: {
        values: {
          include: { nutrient: true },
        },
      },
    });

    const result: NutritionValues = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    };

    if (!nutritionProfile) {
      return result;
    }

    // Tính tỷ lệ: grams (gram) / 100
    const ratio = grams / 100;

    for (const value of nutritionProfile.values) {
      const nutrientName = value.nutrient.name.toLowerCase();
      const nutrientValue = value.value * ratio;

      if (nutrientName.includes('calorie') || nutrientName === 'calories') {
        result.calories = nutrientValue;
      } else if (nutrientName === 'protein') {
        result.protein = nutrientValue;
      } else if (nutrientName === 'carbs' || nutrientName === 'carbohydrates') {
        result.carbs = nutrientValue;
      } else if (nutrientName === 'fat') {
        result.fat = nutrientValue;
      } else if (nutrientName === 'fiber') {
        result.fiber = nutrientValue;
      }
    }

    return result;
  }

  async create(userId: number, dto: CreateMealItemDto) {
    // Kiểm tra meal tồn tại + ownership qua dailyLog
    const meal = await this.prisma.meal.findUnique({
      where: { id: dto.mealId },
      include: { dailyLog: { select: { userId: true } } },
    });
    if (!meal) throw new NotFoundException(`Meal #${dto.mealId} không tồn tại`);
    if (meal.dailyLog.userId !== userId)
      throw new ForbiddenException(
        'Bạn không có quyền thêm item vào bữa ăn này',
      );

    // Kiểm tra food tồn tại và lấy defaultServingGrams
    const food = await this.prisma.food.findUnique({
      where: { id: dto.foodId },
      select: { id: true, defaultServingGrams: true },
    });
    if (!food) throw new NotFoundException(`Food #${dto.foodId} không tồn tại`);

    // Tính grams: ưu tiên grams từ DTO, nếu không có thì tính từ quantity * defaultServingGrams
    let grams: number;
    if (dto.grams != null) {
      grams = dto.grams;
    } else if (food.defaultServingGrams != null) {
      grams = dto.quantity * food.defaultServingGrams;
    } else {
      // Fallback: nếu không có defaultServingGrams, dùng quantity như là gram
      grams = dto.quantity;
    }

    // Tính dinh dưỡng từ FoodNutritionProfile nếu không được cung cấp trong DTO
    let nutrition: NutritionValues;
    if (
      dto.calories == null ||
      dto.protein == null ||
      dto.carbs == null ||
      dto.fat == null ||
      dto.fiber == null
    ) {
      nutrition = await this.calculateNutritionFromFood(dto.foodId, grams);
    }

    const mealItem = await this.prisma.mealItem.create({
      data: {
        foodId: dto.foodId,
        mealId: dto.mealId,
        quantity: dto.quantity,
        grams: grams,
        calories: dto.calories ?? nutrition!.calories,
        protein: dto.protein ?? nutrition!.protein,
        carbs: dto.carbs ?? nutrition!.carbs,
        fat: dto.fat ?? nutrition!.fat,
        fiber: dto.fiber ?? nutrition!.fiber,
      },
      include: {
        food: {
          select: {
            id: true,
            foodName: true,
            imageUrl: true,
            defaultServingGrams: true,
            foodCategory: { select: { name: true } },
            nutritionProfile: {
              include: {
                values: {
                  include: { nutrient: true },
                },
              },
            },
          },
        },
      },
    });

    // Format response với nutritionPer100g
    return {
      ...mealItem,
      food: mealItem.food
        ? {
            ...mealItem.food,
            nutritionPer100g: mealItem.food.nutritionProfile
              ? this.formatNutritionPer100g(
                  mealItem.food.nutritionProfile.values,
                )
              : null,
            nutritionProfile: undefined, // Remove raw nutritionProfile from response
          }
        : undefined,
    };
  }

  async findAllByMealId(mealId: number) {
    const meal = await this.prisma.meal.findUnique({ where: { id: mealId } });
    if (!meal) throw new NotFoundException(`Meal #${mealId} không tồn tại`);

    const mealItems = await this.prisma.mealItem.findMany({
      where: { mealId },
      include: {
        food: {
          select: {
            id: true,
            foodName: true,
            imageUrl: true,
            defaultServingGrams: true,
            foodCategory: { select: { name: true } },
            nutritionProfile: {
              include: {
                values: {
                  include: { nutrient: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Format response với nutritionPer100g
    return mealItems.map((item) => ({
      ...item,
      food: item.food
        ? {
            ...item.food,
            nutritionPer100g: item.food.nutritionProfile
              ? this.formatNutritionPer100g(item.food.nutritionProfile.values)
              : null,
            nutritionProfile: undefined,
          }
        : undefined,
    }));
  }

  async findOne(id: number) {
    const item = await this.prisma.mealItem.findUnique({
      where: { id },
      include: {
        food: {
          select: {
            id: true,
            foodName: true,
            imageUrl: true,
            defaultServingGrams: true,
            foodCategory: { select: { name: true } },
            nutritionProfile: {
              include: {
                values: {
                  include: { nutrient: true },
                },
              },
            },
          },
        },
        meal: {
          select: {
            id: true,
            mealType: true,
            mealDateTime: true,
            dailyLogId: true,
          },
        },
      },
    });
    if (!item) throw new NotFoundException(`MealItem #${id} không tồn tại`);

    // Format response với nutritionPer100g
    return {
      ...item,
      food: item.food
        ? {
            ...item.food,
            nutritionPer100g: item.food.nutritionProfile
              ? this.formatNutritionPer100g(item.food.nutritionProfile.values)
              : null,
            nutritionProfile: undefined,
          }
        : undefined,
    };
  }

  async update(id: number, userId: number, dto: UpdateMealItemDto) {
    const item = await this.prisma.mealItem.findUnique({
      where: { id },
      include: {
        meal: {
          include: { dailyLog: { select: { userId: true } } },
        },
        food: {
          select: { id: true, defaultServingGrams: true },
        },
      },
    });
    if (!item) throw new NotFoundException(`MealItem #${id} không tồn tại`);
    if (item.meal.dailyLog.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền cập nhật item này');

    // Tính grams mới: ưu tiên grams từ DTO, sau đó quantity * defaultServingGrams, fallback giữ nguyên
    let newGrams: number;
    if (dto.grams != null) {
      newGrams = dto.grams;
    } else if (dto.quantity != null && item.food?.defaultServingGrams != null) {
      newGrams = dto.quantity * item.food.defaultServingGrams;
    } else if (dto.quantity != null) {
      newGrams = dto.quantity;
    } else {
      newGrams = item.grams;
    }

    // Nếu cập nhật grams hoặc quantity mà không cung cấp dinh dưỡng, tự động tính lại
    let nutrition: NutritionValues | undefined;
    if (
      (dto.grams != null || dto.quantity != null) &&
      (dto.calories == null ||
        dto.protein == null ||
        dto.carbs == null ||
        dto.fat == null ||
        dto.fiber == null)
    ) {
      nutrition = await this.calculateNutritionFromFood(item.foodId, newGrams);
    }

    const updatedItem = await this.prisma.mealItem.update({
      where: { id },
      data: {
        ...(dto.quantity != null && { quantity: dto.quantity }),
        ...{ grams: newGrams },
        ...(dto.calories != null
          ? { calories: dto.calories }
          : nutrition && { calories: nutrition.calories }),
        ...(dto.protein != null
          ? { protein: dto.protein }
          : nutrition && { protein: nutrition.protein }),
        ...(dto.carbs != null
          ? { carbs: dto.carbs }
          : nutrition && { carbs: nutrition.carbs }),
        ...(dto.fat != null
          ? { fat: dto.fat }
          : nutrition && { fat: nutrition.fat }),
        ...(dto.fiber != null
          ? { fiber: dto.fiber }
          : nutrition && { fiber: nutrition.fiber }),
      },
      include: {
        food: {
          select: {
            id: true,
            foodName: true,
            imageUrl: true,
            defaultServingGrams: true,
            foodCategory: { select: { name: true } },
            nutritionProfile: {
              include: {
                values: {
                  include: { nutrient: true },
                },
              },
            },
          },
        },
      },
    });

    // Format response với nutritionPer100g
    return {
      ...updatedItem,
      food: updatedItem.food
        ? {
            ...updatedItem.food,
            nutritionPer100g: updatedItem.food.nutritionProfile
              ? this.formatNutritionPer100g(
                  updatedItem.food.nutritionProfile.values,
                )
              : null,
            nutritionProfile: undefined,
          }
        : undefined,
    };
  }

  async remove(id: number, userId: number): Promise<void> {
    const item = await this.prisma.mealItem.findUnique({
      where: { id },
      include: {
        meal: {
          include: { dailyLog: { select: { userId: true } } },
        },
      },
    });
    if (!item) throw new NotFoundException(`MealItem #${id} không tồn tại`);
    if (item.meal.dailyLog.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền xóa item này');

    await this.prisma.mealItem.delete({ where: { id } });
  }
}
