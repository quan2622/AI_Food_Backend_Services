import { IsEnum, IsOptional, IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AITrainingJobStatus } from '../../../generated/prisma/enums';

export class QueryTrainingJobDto {
  @IsOptional()
  @IsEnum(AITrainingJobStatus)
  status?: AITrainingJobStatus;

  @IsOptional()
  @IsString()
  modelName?: string;

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
}
