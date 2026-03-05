import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateFoodNutritionDto {
  @IsNumber({}, { message: 'servingSize không hợp lệ' })
  @Min(0, { message: 'servingSize phải lớn hơn hoặc bằng 0' })
  servingSize: number;

  @IsString()
  @IsNotEmpty({ message: 'servingUnit không được để trống' })
  @MaxLength(50)
  servingUnit: string;

  @IsString()
  @IsNotEmpty({ message: 'source không được để trống' })
  @MaxLength(50)
  source: string;

  @IsOptional()
  @IsBoolean({ message: 'isCalculated không hợp lệ' })
  isCalculated?: boolean;
}

