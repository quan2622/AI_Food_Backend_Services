import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NutritionNotificationService } from './nutrition-notification.service';
import { NutritionNotificationController } from './nutrition-notification.controller';
import { DailyLogModule } from '../daily-log/daily-log.module';

@Module({
  imports: [ConfigModule, DailyLogModule],
  controllers: [NutritionNotificationController],
  providers: [NutritionNotificationService],
})
export class NutritionNotificationModule {}
