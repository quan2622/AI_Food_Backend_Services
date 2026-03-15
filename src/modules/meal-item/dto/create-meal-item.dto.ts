import { IsNumber, IsPositive, IsInt, Min, IsOptional } from 'class-validator';

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

  @IsOptional()
  @IsNumber({}, { message: 'calories không hợp lệ' })
  @Min(0)
  calories?: number;

  @IsOptional()
  @IsNumber({}, { message: 'protein không hợp lệ' })
  @Min(0)
  protein?: number;

  @IsOptional()
  @IsNumber({}, { message: 'carbs không hợp lệ' })
  @Min(0)
  carbs?: number;

  @IsOptional()
  @IsNumber({}, { message: 'fat không hợp lệ' })
  @Min(0)
  fat?: number;

  @IsOptional()
  @IsNumber({}, { message: 'fiber không hợp lệ' })
  @Min(0)
  fiber?: number;
}
