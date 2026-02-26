import { IsNumber, IsPositive, IsInt, Min } from 'class-validator';

export class CreateMealItemDto {
  @IsInt({ message: 'foodId phải là số nguyên' })
  @IsPositive({ message: 'foodId phải là số dương' })
  foodId: number;

  @IsInt({ message: 'mealId phải là số nguyên' })
  @IsPositive({ message: 'mealId phải là số dương' })
  mealId: number;

  @IsNumber({}, { message: 'quantity không hợp lệ' })
  @Min(0.1, { message: 'quantity phải lớn hơn 0' })
  quantity: number; // gram
}
