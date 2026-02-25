import { IsArray, ValidateNested, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAllcodeDto } from './create-allcode.dto.js';

export class BulkCreateAllcodeDto {
  @IsArray({ message: 'items phải là mảng' })
  @ArrayNotEmpty({ message: 'items không được rỗng' })
  @ValidateNested({ each: true })
  @Type(() => CreateAllcodeDto)
  items: CreateAllcodeDto[];
}
