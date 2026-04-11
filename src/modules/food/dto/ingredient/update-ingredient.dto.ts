import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { NutritionValueInputDto, SourceType } from './create-ingredient.dto.js';

export class UpdateIngredientDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ingredientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  /** Nguồn dữ liệu dinh dưỡng: SRC_USDA | SRC_MANUAL | SRC_CALC */
  @IsOptional()
  @IsEnum(SourceType)
  source?: SourceType;

  /** Cập nhật thông số dinh dưỡng per 100g */
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return value; }
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NutritionValueInputDto)
  nutritionValues?: NutritionValueInputDto[];
}
