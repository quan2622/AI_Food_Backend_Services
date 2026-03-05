import { Module } from '@nestjs/common';
import { FoodService } from './services/food.service';
import { FoodController } from './controllers/food.controller';
import { FoodCategoryService } from './services/food-category.service';
import { FoodNutritionService } from './services/food-nutrition.service';
import { DishIngredientService } from './services/dish-ingredient.service';
import { FoodCategoryController } from './controllers/food-category.controller';
import { FoodNutritionController } from './controllers/food-nutrition.controller';
import { DishIngredientController } from './controllers/dish-ingredient.controller';

@Module({
  controllers: [
    FoodController,
    FoodCategoryController,
    FoodNutritionController,
    DishIngredientController,
  ],
  providers: [
    FoodService,
    FoodCategoryService,
    FoodNutritionService,
    DishIngredientService,
  ],
  exports: [FoodService, FoodNutritionService],
})
export class FoodModule {}
