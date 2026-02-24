import { Module } from '@nestjs/common';
import { AllcodeService } from './allcode.service';
import { AllcodeController } from './allcode.controller';

@Module({
  controllers: [AllcodeController],
  providers: [AllcodeService],
})
export class AllcodeModule {}
