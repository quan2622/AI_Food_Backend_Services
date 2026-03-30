import { GoalType, NutritionGoalStatus } from '@/generated/prisma/enums';
import {
  IsDateString,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateNutritionGoalDto {
  @IsString({ message: 'Loại mục tiêu không hợp lệ' })
  @IsNotEmpty({ message: 'Loại mục tiêu không được để trống' })
  goalType: GoalType;

  @IsNumber({}, { message: 'Lượng cân nặng mục tiêu không hợp lệ' })
  @IsNotEmpty({ message: 'Lượng cân nặng mục tiêu không được để trống' })
  targetWeight: number;

  @IsNumber({}, { message: 'Lượng calo mục tiêu không hợp lệ' })
  @IsNotEmpty({ message: 'Lượng calo mục tiêu không được để trống' })
  targetCalories: number;

  @IsNumber({}, { message: 'Mục tiêu protein không hợp lệ' })
  @IsNotEmpty({ message: 'Mục tiêu protein không được để trống' })
  targetProtein: number;

  @IsNumber({}, { message: 'Mục tiêu carbs không hợp lệ' })
  @IsNotEmpty({ message: 'Mục tiêu carbs không được để trống' })
  targetCarbs: number;

  @IsNumber({}, { message: 'Mục tiêu fat không hợp lệ' })
  @IsNotEmpty({ message: 'Mục tiêu fat không được để trống' })
  targetFat: number;

  @IsNumber({}, { message: 'Mục tiêu chất xơ không hợp lệ' })
  @IsNotEmpty({ message: 'Mục tiêu chất xơ không được để trống' })
  targetFiber: number;

  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startDay: string;

  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  endDate: string;

  @IsString({ message: 'Trạng thái không hợp lệ' })
  @IsOptional()
  status?: NutritionGoalStatus;
}
