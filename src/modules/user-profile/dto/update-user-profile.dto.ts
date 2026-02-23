import { PartialType } from '@nestjs/mapped-types';
import { CreateUserProfileDto } from './create-user-profile.dto.js';

export class UpdateUserProfileDto extends PartialType(CreateUserProfileDto) {}
