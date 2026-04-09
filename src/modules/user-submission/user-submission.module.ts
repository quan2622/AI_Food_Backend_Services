import { Module } from '@nestjs/common';
import { UserSubmissionService } from './user-submission.service';
import { UserSubmissionController } from './user-submission.controller';
import { FoodModule } from '../food/food.module';

@Module({
  imports: [FoodModule],
  controllers: [UserSubmissionController],
  providers: [UserSubmissionService],
  exports: [UserSubmissionService],
})
export class UserSubmissionModule {}
