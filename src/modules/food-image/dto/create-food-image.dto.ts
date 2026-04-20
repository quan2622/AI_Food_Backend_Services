import { IsInt, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateFoodImageDto {
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt({ message: 'mealItemId phải là số nguyên' })
  @IsPositive({ message: 'mealItemId phải là số dương' })
  mealItemId: number;
}
