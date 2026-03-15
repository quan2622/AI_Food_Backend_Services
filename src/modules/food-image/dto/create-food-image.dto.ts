import { IsInt, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateFoodImageDto {
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt({ message: 'mealId phải là số nguyên' })
  @IsPositive({ message: 'mealId phải là số dương' })
  mealId: number;
}
