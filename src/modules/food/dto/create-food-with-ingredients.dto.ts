import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const FOOD_INGREDIENT_UNITS = [
  'UNIT_G',
  'UNIT_KG',
  'UNIT_MG',
  'UNIT_OZ',
  'UNIT_LB',
] as const;

export type FoodIngredientUnit = (typeof FOOD_INGREDIENT_UNITS)[number];

export class CreateFoodIngredientInputDto {
  @Type(() => Number)
  @IsInt({ message: 'ingredientId phải là số nguyên' })
  @Min(1, { message: 'ingredientId phải lớn hơn 0' })
  ingredientId: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'quantity không hợp lệ' })
  @Min(0, { message: 'quantity phải lớn hơn hoặc bằng 0' })
  quantity: number;

  @IsIn(FOOD_INGREDIENT_UNITS, {
    message: `unit phải thuộc: ${FOOD_INGREDIENT_UNITS.join(', ')}`,
  })
  unit: FoodIngredientUnit;
}

export class CreateFoodWithIngredientsDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên món ăn không được để trống' })
  @MaxLength(255)
  foodName: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoryId phải là số nguyên' })
  @Min(1, { message: 'categoryId phải lớn hơn 0' })
  categoryId?: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'defaultServingGrams phải là số' })
  @Min(0, { message: 'defaultServingGrams không được âm' })
  defaultServingGrams: number;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray({ message: 'ingredients phải là mảng' })
  @ValidateNested({ each: true })
  @Type(() => CreateFoodIngredientInputDto)
  ingredients: CreateFoodIngredientInputDto[];
}
