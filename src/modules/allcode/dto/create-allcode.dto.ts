import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateAllcodeDto {
  @IsString()
  @IsNotEmpty({ message: 'keyMap không được để trống' })
  @MaxLength(100)
  keyMap: string;

  @IsString()
  @IsNotEmpty({ message: 'type không được để trống' })
  @MaxLength(100)
  type: string;

  @IsString()
  @IsNotEmpty({ message: 'value không được để trống' })
  @MaxLength(255)
  value: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
