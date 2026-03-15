import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { UnitType } from '../../../../generated/prisma/enums.js';

export class CreateNutritionComponentDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên chỉ số không được để trống' })
  @MaxLength(255)
  name: string;

  @IsEnum(UnitType, { message: 'Đơn vị không hợp lệ' })
  @IsNotEmpty({ message: 'Đơn vị không được để trống' })
  unit: UnitType;
}

