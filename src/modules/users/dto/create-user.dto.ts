import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  @MaxLength(100)
  password: string;

  @IsString()
  @MinLength(1, { message: 'Họ tên không được để trống' })
  @MaxLength(255)
  fullName: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  genderCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsDateString()
  birthOfDate?: string;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}
