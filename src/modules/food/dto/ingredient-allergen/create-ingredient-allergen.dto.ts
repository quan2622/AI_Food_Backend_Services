import { IsInt, Min } from 'class-validator';

export class CreateIngredientAllergenDto {
  @IsInt({ message: 'ingredientId phải là số nguyên' })
  @Min(1, { message: 'ingredientId không hợp lệ' })
  ingredientId: number;

  @IsInt({ message: 'allergenId phải là số nguyên' })
  @Min(1, { message: 'allergenId không hợp lệ' })
  allergenId: number;
}
