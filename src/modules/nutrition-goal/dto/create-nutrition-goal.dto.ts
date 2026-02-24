import {
  IsString,
  IsNumber,
  IsPositive,
  IsDateString,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class CreateNutritionGoalDto {
  @IsString()
  @IsNotEmpty({ message: 'Loại mục tiêu không được để trống' })
  @MaxLength(100)
  goalType: string;

  @IsNumber({}, { message: 'Lượng calo mục tiêu không hợp lệ' })
  @IsPositive({ message: 'Lượng calo mục tiêu phải là số dương' })
  targetCaloriesPerDay: number;

  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startDate: string;

  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  endDate: string;
}
