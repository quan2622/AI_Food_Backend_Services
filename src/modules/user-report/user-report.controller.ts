import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserReportService } from './user-report.service';
import { NutritionTrendDto } from './dto/nutrition-trend.dto';
import { NutritionMetricTrendDto } from './dto/nutrition-metric-trend.dto';
import { User } from 'src/common/decorators';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('user-reports')
@UseGuards(JwtAuthGuard)
export class UserReportController {
  constructor(private readonly userReportService: UserReportService) {}

  @Post('nutrition-trend')
  @HttpCode(HttpStatus.OK)
  async getNutritionTrend(
    @User() user: { id: number },
    @Body() dto: NutritionTrendDto,
  ) {
    return this.userReportService.getNutritionTrend(user.id, dto.option);
  }

  @Post('metric-trend')
  @HttpCode(HttpStatus.OK)
  async getMetricTrend(
    @User() user: { id: number },
    @Body() dto: NutritionMetricTrendDto,
  ) {
    return this.userReportService.getMetricTrend(user.id, dto.type, dto.metric);
  }
}
