import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { DailyLogService } from './daily-log.service';
import { User } from 'src/common/decorators';
import { AdminGuard } from 'src/guards/admin.guard';

@Controller('daily-logs')
export class DailyLogController {
  constructor(private readonly dailyLogService: DailyLogService) {}

  /** Lấy hoặc tạo DailyLog cho ngày hôm nay */
  @Get('today')
  @HttpCode(HttpStatus.OK)
  getToday(@User() user: { id: number }) {
    return this.dailyLogService.getOrCreateToday(user.id);
  }

  /** Lấy tóm tắt 7 ngày gần nhất */
  @Get('weekly')
  getWeekly(@User() user: { id: number }) {
    return this.dailyLogService.findWeeklySummary(user.id);
  }

  /** Lấy tất cả DailyLog của user hiện tại */
  @Get()
  findMyLogs(@User() user: { id: number }) {
    return this.dailyLogService.findAllByUserId(user.id);
  }

  /** [Admin] Lấy tất cả DailyLog */
  @UseGuards(AdminGuard)
  @Get('all')
  findAll() {
    return this.dailyLogService.findAll();
  }

  /** [Admin] Lấy một DailyLog theo ID */
  @UseGuards(AdminGuard)
  @Get('id/:id')
  findOne(@Param('id') id: string) {
    return this.dailyLogService.findOne(+id);
  }

  /** Lấy DailyLog theo ngày (format: YYYY-MM-DD) */
  @Get(':date')
  findByDate(@User() user: { id: number }, @Param('date') date: string) {
    return this.dailyLogService.findByDate(user.id, date);
  }
}
