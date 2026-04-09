import { Module } from '@nestjs/common';
import { AdminDashboardV2Controller } from './admin-dashboard-v2.controller';
import { AdminDashboardV2Service } from './admin-dashboard-v2.service';

@Module({
  controllers: [AdminDashboardV2Controller],
  providers: [AdminDashboardV2Service],
})
export class AdminDashboardV2Module {}
