import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class CreateUserProfileDto {
  @IsInt({ message: 'Tuổi phải là số nguyên' })
  @Min(1, { message: 'Tuổi tối thiểu là 1' })
  @Max(100, { message: 'Tuổi tối đa là 100' })
  age: number;

  @IsNumber({}, { message: 'Chiều cao không hợp lệ' })
  @IsPositive({ message: 'Chiều cao phải là số dương' })
  height: number;

  @IsNumber({}, { message: 'Cân nặng không hợp lệ' })
  @IsPositive({ message: 'Cân nặng phải là số dương' })
  weight: number;

  @IsOptional()
  @IsIn(['MALE', 'FEMALE', 'OTHER'], {
    message: 'gender phải là MALE, FEMALE hoặc OTHER',
  })
  gender?: string;

  @IsOptional()
  @IsIn(
    [
      'SEDENTARY',
      'LIGHTLY_ACTIVE',
      'MODERATELY_ACTIVE',
      'VERY_ACTIVE',
      'SUPER_ACTIVE',
    ],
    {
      message:
        'activityLevel phải là SEDENTARY, LIGHTLY_ACTIVE, MODERATELY_ACTIVE, VERY_ACTIVE hoặc SUPER_ACTIVE',
  })
  activityLevel?: string;
}
