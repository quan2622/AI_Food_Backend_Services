import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserProfileDto } from './create-user-profile.dto.js';

export class UpdateUserProfileDto extends PartialType(CreateUserProfileDto) {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Họ tên không được để trống' })
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @IsOptional()
  @IsDateString()
  birthOfDate?: string;
}
