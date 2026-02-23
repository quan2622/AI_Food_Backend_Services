import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsArray,
  IsString,
  Min,
  Max,
} from 'class-validator';

export class CreateUserProfileDto {
  @IsInt({ message: 'userId phải là số nguyên' })
  @IsPositive({ message: 'userId phải là số dương' })
  userId: number;

  @IsInt({ message: 'Tuổi phải là số nguyên' })
  @Min(1, { message: 'Tuổi tối thiểu là 1' })
  @Max(150, { message: 'Tuổi tối đa là 150' })
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
}
