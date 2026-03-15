import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAllergenDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên allergen không được để trống' })
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
