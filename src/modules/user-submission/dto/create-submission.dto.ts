import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsString,
  IsJSON,
  Min,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { SubmissionType, SubmissionCategory } from '@prisma/client';

export class CreateSubmissionDto {
  @IsEnum(SubmissionType, {
    message: 'Type phải là REPORT hoặc CONTRIBUTION',
  })
  @IsNotEmpty({ message: 'Type không được để trống' })
  type: SubmissionType;

  @IsOptional()
  @IsInt({ message: 'targetFoodId phải là số nguyên' })
  @Min(1, { message: 'targetFoodId phải lớn hơn 0' })
  @ValidateIf((o) => o.type === SubmissionType.REPORT)
  targetFoodId?: number;

  @IsEnum(SubmissionCategory, {
    message: 'Category không hợp lệ',
  })
  @IsNotEmpty({ message: 'Category không được để trống' })
  category: SubmissionCategory;

  @IsNotEmpty({ message: 'Payload không được để trống' })
  payload: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Description tối đa 2000 ký tự' })
  description?: string;
}
