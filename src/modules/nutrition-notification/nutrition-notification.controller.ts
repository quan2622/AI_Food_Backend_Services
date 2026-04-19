import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NutritionNotificationService } from './nutrition-notification.service';
import { User } from 'src/common/decorators';

@Controller('nutrition-notifications')
export class NutritionNotificationController {
  constructor(
    private readonly notificationService: NutritionNotificationService,
  ) {}

  /**
   * Lấy thông báo gợi ý dinh dưỡng hiện tại cho user.
   * Không lưu DB — chỉ tính toán realtime dựa trên daily intake vs target.
   */
  @Get('today')
  @HttpCode(HttpStatus.OK)
  getTodayNotification(@User() user: { id: number }) {
    return this.notificationService.generateTodayNotification(user.id);
  }
}
