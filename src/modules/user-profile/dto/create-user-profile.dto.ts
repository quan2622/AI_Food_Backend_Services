import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsArray,
  IsIn,
  IsString,
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
  @IsArray({ message: 'Danh sách dị ứng phải là mảng' })
  @IsString({ each: true, message: 'Mỗi dị ứng phải là chuỗi' })
  allergies?: string[];

  @IsOptional()
  @IsIn(['MALE', 'FEMALE', 'OTHER'], {
    message: 'gender phải là MALE, FEMALE hoặc OTHER',
  })
  gender?: string;

  @IsOptional()
  @IsIn(['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'], {
    message:
      'activityLevel phải là SEDENTARY, LIGHT, MODERATE, ACTIVE hoặc VERY_ACTIVE',
  })
  activityLevel?: string;
}
