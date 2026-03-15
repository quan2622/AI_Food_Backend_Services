import { SeverityType } from '../../../generated/prisma/enums.js';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateUserAllergyDto {
  @IsInt({ message: 'userProfileId phải là số nguyên' })
  @Min(1, { message: 'userProfileId không hợp lệ' })
  userProfileId: number;

  @IsInt({ message: 'allergenId phải là số nguyên' })
  @Min(1, { message: 'allergenId không hợp lệ' })
  allergenId: number;

  @IsIn(['MILD', 'MODERATE', 'SEVERE'], { message: 'severity không hợp lệ' })
  severity: SeverityType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
