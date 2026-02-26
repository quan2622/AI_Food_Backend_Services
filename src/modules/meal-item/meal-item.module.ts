import { Module } from '@nestjs/common';
import { MealItemService } from './meal-item.service';
import { MealItemController } from './meal-item.controller';
import { DailyLogModule } from '../daily-log/daily-log.module';

@Module({
  imports: [DailyLogModule],
  controllers: [MealItemController],
  providers: [MealItemService],
  exports: [MealItemService],
})
export class MealItemModule {}
