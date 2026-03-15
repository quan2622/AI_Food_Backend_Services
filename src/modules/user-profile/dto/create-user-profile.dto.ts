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
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { SeverityType } from '../../../generated/prisma/client.js';

export class AllergyInputDto {
  @IsInt({ message: 'allergenId phải là số nguyên' })
  @Min(1, { message: 'allergenId không hợp lệ' })
  allergenId: number;
  @IsIn(['MILD', 'MODERATE', 'SEVERE'], {
    message: 'Mức độ phải là MILD, MODERATE hoặc SEVERE',
  })
  severity: SeverityType;

  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi' })
  note?: string;
}

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
  @ValidateNested({ each: true })
  @Type(() => AllergyInputDto)
  allergies?: AllergyInputDto[];

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
