import { IsArray, IsInt, ArrayNotEmpty, IsPositive } from 'class-validator';

export class BulkDeleteAllCodeDto {
  @IsArray({ message: 'ids must be an array' })
  @ArrayNotEmpty({ message: 'ids must not be empty' })
  @IsInt({ each: true, message: 'Each id must be an integer' })
  @IsPositive({ each: true, message: 'Each id must be a positive number' })
  ids: number[];
}
