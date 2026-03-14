import {
  IsString,
  IsDateString,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { GoalType } from '../../../generated/prisma/enums.js';

export class CreateNutritionGoalDto {
  @IsEnum(GoalType, { message: 'Loại mục tiêu không hợp lệ' })
  @IsNotEmpty({ message: 'Loại mục tiêu không được để trống' })
  goalType: GoalType;

  @IsString({ message: 'Lượng calo mục tiêu không hợp lệ' })
  @IsNotEmpty({ message: 'Lượng calo mục tiêu không được để trống' })
  targetCaloriesPerDay: string;

  @IsString({ message: 'Mục tiêu protein không hợp lệ' })
  @IsNotEmpty({ message: 'Mục tiêu protein không được để trống' })
  targetProtein: string;

  @IsString({ message: 'Mục tiêu carbs không hợp lệ' })
  @IsNotEmpty({ message: 'Mục tiêu carbs không được để trống' })
  targetCarbs: string;

  @IsString({ message: 'Mục tiêu fat không hợp lệ' })
  @IsNotEmpty({ message: 'Mục tiêu fat không được để trống' })
  targetFat: string;

  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startDay: string;

  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  endDate: string;
}
