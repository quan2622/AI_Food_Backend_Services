import { IsIn, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsString, MaxLength, Min, IsEnum } from 'class-validator';
import { SourceType, UnitType } from '../../../../generated/prisma/enums.js';

export class CreateFoodNutritionDto {
  @IsNumber({}, { message: 'servingSize không hợp lệ' })
  @Min(0, { message: 'servingSize phải lớn hơn hoặc bằng 0' })
  servingSize: number;

  @IsEnum(UnitType, { message: 'servingUnit không hợp lệ' })
  @IsNotEmpty({ message: 'servingUnit không được để trống' })
  servingUnit: UnitType;

  @IsIn(['USDA', 'MANUAL', 'CALCULATED'], { message: 'source không hợp lệ, phải là USDA | MANUAL | CALCULATED' })
  source: SourceType;

  @IsOptional()
  @IsBoolean({ message: 'isCalculated không hợp lệ' })
  isCalculated?: boolean;
}
