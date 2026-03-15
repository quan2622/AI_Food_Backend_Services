import { Module } from '@nestjs/common';
import { FoodService } from './services/food.service';
import { FoodController } from './controllers/food.controller';
import { FoodCategoryService } from './services/food-category.service';
import { FoodNutritionService } from './services/food-nutrition.service';
import { FoodIngredientService } from './services/food-ingredient.service';
import { IngredientAllergenService } from './services/ingredient-allergen.service';
import { FoodCategoryController } from './controllers/food-category.controller';
import { FoodNutritionController } from './controllers/food-nutrition.controller';
import { DishIngredientController } from './controllers/dish-ingredient.controller';
import { IngredientAllergenController } from './controllers/ingredient-allergen.controller';

@Module({
  controllers: [
    FoodController,
    FoodCategoryController,
    FoodNutritionController,
    DishIngredientController,
    IngredientAllergenController,
  ],
  providers: [
    FoodService,
    FoodCategoryService,
    FoodNutritionService,
    FoodIngredientService,
    IngredientAllergenService,
  ],
  exports: [FoodService, FoodNutritionService],
})
export class FoodModule {}
