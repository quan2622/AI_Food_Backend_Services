import { PartialType } from '@nestjs/mapped-types';
import { CreateAllcodeDto } from './create-allcode.dto.js';

export class UpdateAllcodeDto extends PartialType(CreateAllcodeDto) {}
