import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../guards/admin.guard';
import { AdminDashboardV2Service } from './admin-dashboard-v2.service';

@Controller('admin/dashboard-v2')
@UseGuards(AdminGuard)
export class AdminDashboardV2Controller {
  constructor(private readonly service: AdminDashboardV2Service) {}

  /**
   * Dashboard V2 — tổng hợp 4 nhóm dữ liệu:
   * keyMetrics | trends | analytics | management
   */
  @Get('overview')
  getOverview() {
    return this.service.getOverview();
  }
}
