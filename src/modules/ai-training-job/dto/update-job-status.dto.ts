import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  IsObject,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AITrainingJobStatus } from '../../../generated/prisma/enums';

export class UpdateJobStatusDto {
  @IsOptional()
  @IsEnum(AITrainingJobStatus, { message: 'status không hợp lệ' })
  status?: AITrainingJobStatus;

  @IsOptional()
  @IsString()
  logText?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsObject()
  metrics?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  outputModelPath?: string;

  @IsOptional()
  @IsString()
  datasetPath?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  numClasses?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classNames?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  trainSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  valSize?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  testSize?: number;

  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @IsOptional()
  @IsDateString()
  finishedAt?: string;
}
