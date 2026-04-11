import { SeverityType } from '../../../generated/prisma/enums.js';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateUserAllergyDto {
  @IsInt({ message: 'userId phải là số nguyên' })
  @Min(1, { message: 'userId không hợp lệ' })
  userId: number;

  @IsInt({ message: 'allergenId phải là số nguyên' })
  @Min(1, { message: 'allergenId không hợp lệ' })
  allergenId: number;

  @IsIn(['SEV_LOW', 'SEV_MEDIUM', 'SEV_HIGH', 'SEV_LIFE_THREATENING'], { message: 'severity không hợp lệ' })
  severity: SeverityType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
