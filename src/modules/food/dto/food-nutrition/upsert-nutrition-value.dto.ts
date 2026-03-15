import { IsArray, IsInt, IsNumber, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class NutritionValueItemDto {
  @IsInt({ message: 'nutrientId phải là số nguyên' })
  @Min(1, { message: 'nutrientId phải lớn hơn 0' })
  nutrientId: number;

  @IsNumber({}, { message: 'value không hợp lệ' })
  value: number;
}

export class UpsertNutritionValueDto {
  @IsArray({ message: 'values phải là mảng' })
  @ValidateNested({ each: true })
  @Type(() => NutritionValueItemDto)
  values: NutritionValueItemDto[];
}
