import {
  IsString,
  IsNotEmpty,
  IsDateString,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';

export class CreateMealDto {
  @IsInt()
  @Min(1)
  dailyLogId: number;

  @IsString()
  @IsNotEmpty({ message: 'Loại bữa ăn không được để trống' })
  @MaxLength(100)
  mealType: string;

  @IsDateString({}, { message: 'mealDateTime không hợp lệ' })
  mealDateTime: string;
}
