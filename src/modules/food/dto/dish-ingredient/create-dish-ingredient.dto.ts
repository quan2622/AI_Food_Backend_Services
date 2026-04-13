import { IsIn, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export const FOOD_INGREDIENT_UNITS = [
  'UNIT_G',
  'UNIT_KG',
  'UNIT_MG',
  'UNIT_OZ',
  'UNIT_LB',
] as const;

export type FoodIngredientUnit = (typeof FOOD_INGREDIENT_UNITS)[number];

export class CreateDishIngredientDto {
  @IsInt({ message: 'ingredientId phải là số nguyên' })
  @Min(1, { message: 'ingredientId phải lớn hơn 0' })
  ingredientId: number;

  @IsOptional()
  @IsNumber({}, { message: 'quantity không hợp lệ' })
  @Min(0, { message: 'quantity phải lớn hơn hoặc bằng 0' })
  quantity?: number;

  @IsOptional()
  @IsIn(FOOD_INGREDIENT_UNITS, {
    message: `unit phải thuộc: ${FOOD_INGREDIENT_UNITS.join(', ')}`,
  })
  unit?: FoodIngredientUnit;

  @IsOptional()
  @IsNumber({}, { message: 'quantityGrams không hợp lệ' })
  @Min(0, { message: 'quantityGrams phải lớn hơn hoặc bằng 0' })
  quantityGrams?: number;
}

