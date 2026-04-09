import {
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
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
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetFoodId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  current?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  @IsOptional()
  @IsString()
  sort?: string;
}
