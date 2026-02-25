import { IsArray, IsInt, ArrayNotEmpty, IsPositive } from 'class-validator';

export class BulkDeleteNutritionGoalDto {
  @IsArray({ message: 'ids phải là mảng' })
  @ArrayNotEmpty({ message: 'ids không được rỗng' })
  @IsInt({ each: true, message: 'Mỗi id phải là số nguyên' })
  @IsPositive({ each: true, message: 'Mỗi id phải là số dương' })
  ids: number[];
}
