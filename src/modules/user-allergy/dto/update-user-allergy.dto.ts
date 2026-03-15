import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserAllergyDto } from './create-user-allergy.dto.js';

export class UpdateUserAllergyDto extends PartialType(
  OmitType(CreateUserAllergyDto, ['userProfileId', 'allergenId'] as const),
) {}
