import { IsString, IsNotEmpty, IsDateString, MaxLength } from 'class-validator';

export class CreateMealDto {
  @IsString()
  @IsNotEmpty({ message: 'Loại bữa ăn không được để trống' })
  @MaxLength(100)
  mealType: string;

  @IsDateString({}, { message: 'mealDateTime không hợp lệ' })
  mealDateTime: string;
}
