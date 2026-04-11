import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum SourceType {
  SRC_USDA = 'SRC_USDA',
  SRC_MANUAL = 'SRC_MANUAL',
  SRC_CALC = 'SRC_CALC',
}

export class NutritionValueInputDto {
  @Type(() => Number)
  @IsNumber()
  nutrientId: number;

  @Type(() => Number)
  @IsNumber()
  value: number;
}

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  ingredientName: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  /** Nguồn dữ liệu dinh dưỡng: SRC_USDA | SRC_MANUAL | SRC_CALC */
  @IsOptional()
  @IsEnum(SourceType)
  source?: SourceType;

  /** Thông số dinh dưỡng per 100g (tùy chọn) */
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

