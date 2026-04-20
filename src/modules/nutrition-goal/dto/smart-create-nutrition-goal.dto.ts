import { GoalType } from '@/generated/prisma/enums';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class SmartCreateNutritionGoalDto {
  @IsEnum(GoalType, { message: 'Loại mục tiêu không hợp lệ' })
  @IsNotEmpty({ message: 'Loại mục tiêu không được để trống' })
  goalType: GoalType;

  @IsNumber({}, { message: 'Cân nặng mục tiêu không hợp lệ' })
  @Min(20, { message: 'Cân nặng mục tiêu phải lớn hơn 20kg' })
  @IsOptional()
  targetWeight?: number;

  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  @IsNotEmpty({ message: 'Ngày kết thúc không được để trống' })
  endDate: string;
}
