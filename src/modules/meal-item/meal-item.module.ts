import { Module } from '@nestjs/common';
import { MealItemService } from './meal-item.service';
import { MealItemController } from './meal-item.controller';

@Module({
  controllers: [MealItemController],
  providers: [MealItemService],
  exports: [MealItemService],
})
export class MealItemModule {}
