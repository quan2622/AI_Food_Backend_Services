import { Module } from '@nestjs/common';
import { UserAllergyController } from './user-allergy.controller';
import { UserAllergyService } from './user-allergy.service';

@Module({
  controllers: [UserAllergyController],
  providers: [UserAllergyService]
})
export class UserAllergyModule {}
