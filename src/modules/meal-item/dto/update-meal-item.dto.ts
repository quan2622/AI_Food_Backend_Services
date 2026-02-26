import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateMealItemDto } from './create-meal-item.dto.js';

export class UpdateMealItemDto extends PartialType(
  OmitType(CreateMealItemDto, ['foodId', 'mealId'] as const),
) {}
