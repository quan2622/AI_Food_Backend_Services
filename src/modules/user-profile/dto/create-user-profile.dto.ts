import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsIn,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import type { UserProfile } from '../../../generated/prisma/client.js';

export class CreateUserProfileDto {
  @IsOptional()
  @IsInt({ message: 'Tuổi phải là số nguyên' })
  @Min(1, { message: 'Tuổi tối thiểu là 1' })
  @Max(100, { message: 'Tuổi tối đa là 100' })
  age?: number;

  @IsOptional()
  @IsDateString({}, { message: 'birthOfDate phải là định dạng ngày hợp lệ' })
  birthOfDate?: string;

  @IsNumber({}, { message: 'Chiều cao không hợp lệ' })
  @IsPositive({ message: 'Chiều cao phải là số dương' })
  height: number;

  @IsNumber({}, { message: 'Cân nặng không hợp lệ' })
  @IsPositive({ message: 'Cân nặng phải là số dương' })
  weight: number;

  @IsOptional()
  @IsIn(['MALE', 'FEMALE', 'UNDEFINED'], {
    message: 'gender phải là MALE, FEMALE hoặc UNDEFINED',
  })
  gender?: UserProfile['gender'];

  @IsOptional()
  @IsIn(
    [
      'ACT_SEDENTARY',
      'ACT_LIGHT',
      'ACT_MODERATE',
      'ACT_VERY',
      'ACT_SUPER',
    ],
    {
      message:
        'activityLevel phải là ACT_SEDENTARY, ACT_LIGHT, ACT_MODERATE, ACT_VERY hoặc ACT_SUPER',
  })
  activityLevel?: string;
}
