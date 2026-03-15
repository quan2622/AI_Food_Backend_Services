import { IsIn, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { SourceType } from '../../../../generated/prisma/enums.js';

export class CreateFoodNutritionDto {
  @IsNumber({}, { message: 'servingSize không hợp lệ' })
  @Min(0, { message: 'servingSize phải lớn hơn hoặc bằng 0' })
  servingSize: number;

  @IsString()
  @IsNotEmpty({ message: 'servingUnit không được để trống' })
  @MaxLength(50)
  servingUnit: string;

  @IsIn(['USDA', 'MANUAL', 'CALCULATED'], { message: 'source không hợp lệ, phải là USDA | MANUAL | CALCULATED' })
  source: SourceType;

  @IsOptional()
  @IsBoolean({ message: 'isCalculated không hợp lệ' })
  isCalculated?: boolean;
}
