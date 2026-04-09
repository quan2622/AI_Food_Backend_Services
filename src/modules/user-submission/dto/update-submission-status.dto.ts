import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { SubmissionStatus } from '../../../generated/prisma/enums';

export class UpdateSubmissionStatusDto {
  @IsEnum(SubmissionStatus, {
    message: 'Status phải là PENDING, APPROVED hoặc REJECTED',
  })
  @IsNotEmpty({ message: 'Status không được để trống' })
  status: SubmissionStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Admin note tối đa 1000 ký tự' })
  adminNote?: string;
}
