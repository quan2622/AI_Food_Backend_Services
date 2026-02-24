import { PartialType } from '@nestjs/mapped-types';
import { CreateNutritionGoalDto } from './create-nutrition-goal.dto.js';

export class UpdateNutritionGoalDto extends PartialType(
  CreateNutritionGoalDto,
) {}
