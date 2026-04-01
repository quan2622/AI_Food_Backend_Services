import { IsInt, Min, IsEnum, IsNotEmpty } from 'class-validator';
import { MealType } from '../../../generated/prisma/enums';

export class CreateMealDto {
  @IsInt()
  @Min(1)
  dailyLogId: number;

  @IsEnum(MealType, { message: 'Loại bữa ăn không hợp lệ' })
  @IsNotEmpty({ message: 'Loại bữa ăn không được để trống' })
  mealType: MealType;
}
