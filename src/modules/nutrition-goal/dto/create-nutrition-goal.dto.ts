import {
  IsDateString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { GoalType } from '../../../generated/prisma/enums.js';

export class CreateNutritionGoalDto {
  @IsEnum(GoalType, { message: 'Loại mục tiêu không hợp lệ' })
  @IsNotEmpty({ message: 'Loại mục tiêu không được để trống' })
  goalType: GoalType;

  @IsNumber({}, { message: 'Lượng calo mục tiêu không hợp lệ' })
  @IsNotEmpty({ message: 'Lượng calo mục tiêu không được để trống' })
  targetCaloriesPerDay: number;

  @IsNumber({}, { message: 'Mục tiêu protein không hợp lệ' })
  @IsNotEmpty({ message: 'Mục tiêu protein không được để trống' })
  targetProtein: number;

  @IsNumber({}, { message: 'Mục tiêu carbs không hợp lệ' })
  @IsNotEmpty({ message: 'Mục tiêu carbs không được để trống' })
  targetCarbs: number;

  @IsNumber({}, { message: 'Mục tiêu fat không hợp lệ' })
  @IsNotEmpty({ message: 'Mục tiêu fat không được để trống' })
  targetFat: number;

  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startDay: string;

  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  endDate: string;
}
