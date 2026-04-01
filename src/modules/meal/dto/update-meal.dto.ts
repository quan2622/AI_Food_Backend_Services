import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsOptional } from 'class-validator';
import { CreateMealDto } from './create-meal.dto.js';

export class UpdateMealDto extends PartialType(CreateMealDto) {
  @IsOptional()
  @IsDateString({}, { message: 'mealDateTime không hợp lệ' })
  mealDateTime?: string;
}
