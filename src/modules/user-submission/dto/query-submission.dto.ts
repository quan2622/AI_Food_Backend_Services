import {
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsString,
} from 'class-validator';
import { SubmissionType, SubmissionCategory, SubmissionStatus } from '../../../generated/prisma/enums';

export class QuerySubmissionDto {
  @IsOptional()
  @IsEnum(SubmissionType)
  type?: SubmissionType;

  @IsOptional()
  @IsEnum(SubmissionCategory)
  category?: SubmissionCategory;

  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  targetFoodId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  current?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsString()
  sort?: string;
}
