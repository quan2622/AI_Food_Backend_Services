import { Module } from '@nestjs/common';
import { NutritionGoalService } from './nutrition-goal.service';
import { NutritionGoalController } from './nutrition-goal.controller';

@Module({
  controllers: [NutritionGoalController],
  providers: [NutritionGoalService],
})
export class NutritionGoalModule {}
