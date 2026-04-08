import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../guards/admin.guard';
import { AdminDashboardService } from './admin-dashboard.service';

function parseOptionalInt(
  v: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (v === undefined || v === '') return fallback;
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n) || n < min || n > max) return fallback;
  return n;
}

@Controller('admin/dashboard')
@UseGuards(AdminGuard)
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  /** Nhóm 1 — KPI tổng quan + % so với kỳ trước (nơi áp dụng được) */
  @Get('kpi')
  getKpi() {
    return this.dashboard.getKpiOverview();
  }

  /** Nhóm 2 — Chuỗi ngày người hoạt động + danh sách cảnh báo */
  @Get('activity')
  getActivity(@Query('days') days?: string) {
    const n = parseOptionalInt(days, 14, 1, 90);
    return this.dashboard.getActivityAndAlerts(n);
  }

  /** Nhóm 3 — Trung bình dinh dưỡng thực tế vs mục tiêu (7 ngày) */
  @Get('nutrition-platform')
  getNutritionPlatform() {
    return this.dashboard.getNutritionPlatformSummary();
  }

  /** Nhóm 4 — Top món ăn (30 ngày) + phân bổ goalType (mục tiêu ongoing) */
  @Get('foods-goals')
  getFoodsAndGoals(@Query('top') top?: string) {
    const limit = parseOptionalInt(top, 10, 1, 50);
    return this.dashboard.getFoodsAndGoals(limit);
  }

  /** Nhóm 5 — User mới đăng ký + hàng đợi nội dung (món thiếu dinh dưỡng, …) */
  @Get('users-content')
  getUsersAndContent(
    @Query('newUsers') newUsers?: string,
    @Query('sample') sample?: string,
  ) {
    const nu = parseOptionalInt(newUsers, 10, 1, 50);
    const sm = parseOptionalInt(sample, 8, 1, 30);
    return this.dashboard.getUsersAndContent(nu, sm);
  }

  /** Tổng hợp cả 5 nhóm (một response) */
  @Get('overview')
  getOverview() {
    return this.dashboard.getOverview();
  }
}
