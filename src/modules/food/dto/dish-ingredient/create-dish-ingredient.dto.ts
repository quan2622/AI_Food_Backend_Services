import { IsInt, IsNumber, Min } from 'class-validator';

export class CreateDishIngredientDto {
  @IsInt({ message: 'ingredientId phải là số nguyên' })
  @Min(1, { message: 'ingredientId phải lớn hơn 0' })
  ingredientId: number;

  @IsNumber({}, { message: 'quantityGrams không hợp lệ' })
  @Min(0, { message: 'quantityGrams phải lớn hơn hoặc bằng 0' })
  quantityGrams: number;
}

