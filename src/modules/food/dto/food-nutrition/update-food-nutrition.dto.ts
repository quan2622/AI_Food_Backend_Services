import { PartialType } from '@nestjs/mapped-types';
import { CreateFoodNutritionDto } from './create-food-nutrition.dto.js';

export class UpdateFoodNutritionDto extends PartialType(CreateFoodNutritionDto) {}

