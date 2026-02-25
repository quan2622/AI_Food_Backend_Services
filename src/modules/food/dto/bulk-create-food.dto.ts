import { IsArray, ValidateNested, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateFoodDto } from './create-food.dto.js';

export class BulkCreateFoodDto {
  @IsArray({ message: 'items phải là mảng' })
  @ArrayNotEmpty({ message: 'items không được rỗng' })
  @ValidateNested({ each: true })
  @Type(() => CreateFoodDto)
  items: CreateFoodDto[];
}
