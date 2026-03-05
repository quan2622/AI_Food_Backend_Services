import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNutritionComponentDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên chỉ số không được để trống' })
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Đơn vị không được để trống' })
  @MaxLength(50)
  unit: string;
}

