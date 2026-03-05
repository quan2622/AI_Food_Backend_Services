import { PartialType } from '@nestjs/mapped-types';
import { CreateFoodCategoryDto } from './create-food-category.dto.js';

export class UpdateFoodCategoryDto extends PartialType(CreateFoodCategoryDto) {}

