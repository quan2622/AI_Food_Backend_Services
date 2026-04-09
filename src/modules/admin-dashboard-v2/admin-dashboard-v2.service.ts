import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  NutritionGoalStatus,
  SubmissionStatus,
  SubmissionType,
} from '../../generated/prisma/enums';

const MS_DAY = 86_400_000;

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function addUtcDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * MS_DAY);
}

/** % thay đổi giữa 2 kỳ. null nếu cả 2 đều = 0 */
function percentChange(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 10_000) / 100;
}

/** "15 phút trước", "2 giờ trước", ... */
function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ngày trước`;
  return `${Math.floor(diffDays / 30)} tháng trước`;
}

/** "01/04" */
function formatDayMonth(d: Date): string {
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

const GOAL_LABEL_MAP: Record<string, string> = {
  GOAL_LOSS: 'Giảm cân',
  GOAL_GAIN: 'Tăng cơ',
  GOAL_MAINTAIN: 'Duy trì',
  GOAL_STRICT: 'Ăn kiêng nghiêm ngặt',
};

@Injectable()
export class AdminDashboardV2Service {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [keyMetrics, trends, analytics, management] = await Promise.all([
      this.buildKeyMetrics(),
      this.buildTrends(),
      this.buildAnalytics(),
      this.buildManagement(),
    ]);

    return { keyMetrics, trends, analytics, management };
  }

  // ─── Key Metrics ──────────────────────────────────────────────────────────

  private async buildKeyMetrics() {
    const now = new Date();
    const todayStart = startOfUtcDay(now);
    const yesterdayStart = addUtcDays(todayStart, -1);

    const thisMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const lastMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );

    const [
      totalUsers,
      usersThisMonth,
      usersLastMonth,
      newUsersToday,
      newUsersYesterday,
      totalFoods,
      newContributions,
      mealLogsThisMonth,
      mealLogsLastMonth,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isAdmin: false } }),
      this.prisma.user.count({
        where: { isAdmin: false, createdAt: { gte: thisMonthStart } },
      }),
      this.prisma.user.count({
        where: {
          isAdmin: false,
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),
      this.prisma.user.count({
        where: {
          isAdmin: false,
          createdAt: { gte: todayStart, lt: addUtcDays(todayStart, 1) },
        },
      }),
      this.prisma.user.count({
        where: {
          isAdmin: false,
          createdAt: { gte: yesterdayStart, lt: todayStart },
        },
      }),
      this.prisma.food.count(),
      this.prisma.userSubmission.count({
        where: { status: SubmissionStatus.PENDING },
      }),
      this.prisma.mealItem.count({
        where: {
          meal: {
            mealDateTime: { gte: thisMonthStart },
            dailyLog: { user: { isAdmin: false } },
          },
        },
      }),
      this.prisma.mealItem.count({
        where: {
          meal: {
            mealDateTime: { gte: lastMonthStart, lt: thisMonthStart },
            dailyLog: { user: { isAdmin: false } },
          },
        },
      }),
    ]);

    return {
      totalUsers: {
        value: totalUsers,
        trendPercent: percentChange(usersThisMonth, usersLastMonth),
        trendLabel: 'so với tháng trước',
      },
      newUsersToday: {
        value: newUsersToday,
        trendPercent: percentChange(newUsersToday, newUsersYesterday),
        trendLabel: 'so với hôm qua',
      },
      totalFoods: {
        value: totalFoods,
        newContributions,
        trendLabel: 'lượt đóng góp đang chờ duyệt',
      },
      totalMealLogs: {
        value: mealLogsThisMonth,
        trendPercent: percentChange(mealLogsThisMonth, mealLogsLastMonth),
        trendLabel: 'Độ tương tác tháng này',
      },
    };
  }

  // ─── Trends ───────────────────────────────────────────────────────────────

  private async buildTrends() {
    const now = new Date();
    const todayStart = startOfUtcDay(now);
    const rangeStart = addUtcDays(todayStart, -29); // 30 ngày kể cả hôm nay

    const meals = await this.prisma.meal.findMany({
      where: {
        mealDateTime: { gte: rangeStart, lt: addUtcDays(todayStart, 1) },
        dailyLog: { user: { isAdmin: false } },
      },
      select: {
        mealDateTime: true,
        dailyLog: { select: { userId: true } },
      },
    });

    // Khởi tạo map 30 ngày với Set rỗng
    const byDay = new Map<string, Set<number>>();
    for (let i = 0; i < 30; i++) {
      const key = addUtcDays(rangeStart, i).toISOString().slice(0, 10);
      byDay.set(key, new Set());
    }

    for (const m of meals) {
      const key = startOfUtcDay(m.mealDateTime).toISOString().slice(0, 10);
      byDay.get(key)?.add(m.dailyLog.userId);
    }

    const activeUsersLast30Days = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, userSet]) => ({
        date: formatDayMonth(new Date(dateStr + 'T00:00:00Z')),
        users: userSet.size,
      }));

    return { activeUsersLast30Days };
  }

  // ─── Analytics ────────────────────────────────────────────────────────────

  private async buildAnalytics() {
    const now = new Date();
    const todayStart = startOfUtcDay(now);
    const last30Start = addUtcDays(todayStart, -30);
    const prev30Start = addUtcDays(todayStart, -60);

    // Phân bổ mục tiêu dinh dưỡng đang ongoing
    const goalDist = await this.prisma.nutritionGoal.groupBy({
      by: ['goalType'],
      where: {
        user: { isAdmin: false },
        status: NutritionGoalStatus.NUTR_GOAL_ONGOING,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      _count: { _all: true },
    });

    const totalGoals = goalDist.reduce((s, r) => s + r._count._all, 0);
    const userGoalsBreakdown = goalDist
      .sort((a, b) => b._count._all - a._count._all)
      .map((r) => ({
        name: GOAL_LABEL_MAP[r.goalType] ?? r.goalType,
        goalType: r.goalType,
        count: r._count._all,
        percentage:
          totalGoals > 0
            ? Math.round((r._count._all / totalGoals) * 1000) / 10
            : 0,
      }));

    // Top 5 món ăn 30 ngày gần nhất
    const topLast30 = await this.prisma.mealItem.groupBy({
      by: ['foodId'],
      where: {
        meal: {
          mealDateTime: { gte: last30Start, lt: addUtcDays(todayStart, 1) },
          dailyLog: { user: { isAdmin: false } },
        },
      },
      _count: { _all: true },
      orderBy: { _count: { foodId: 'desc' } },
      take: 5,
    });

    const foodIds = topLast30.map((g) => g.foodId);

    // 30 ngày trước đó (để tính trendPercent)
    const topPrev30 = await this.prisma.mealItem.groupBy({
      by: ['foodId'],
      where: {
        foodId: { in: foodIds },
        meal: {
          mealDateTime: { gte: prev30Start, lt: last30Start },
          dailyLog: { user: { isAdmin: false } },
        },
      },
      _count: { _all: true },
    });
    const prevCountMap = new Map(
      topPrev30.map((g) => [g.foodId, g._count._all]),
    );

    // Chi tiết food + calo
    const foods = await this.prisma.food.findMany({
      where: { id: { in: foodIds } },
      select: {
        id: true,
        foodName: true,
        nutritionProfile: {
          select: {
            values: {
              select: {
                value: true,
                nutrient: { select: { name: true, unit: true } },
              },
            },
          },
        },
      },
    });
    const foodMap = new Map(foods.map((f) => [f.id, f]));

    const topFoods = topLast30.map((g, idx) => {
      const food = foodMap.get(g.foodId);
      const prevCount = prevCountMap.get(g.foodId) ?? 0;

      // Tìm nutrient calories/năng lượng (per 100g)
      const calorieEntry = food?.nutritionProfile?.values.find((v) => {
        const name = v.nutrient.name.toLowerCase();
        return (
          name.includes('calori') ||
          name.includes('năng lượng') ||
          name.includes('energy') ||
          name.includes('kcal')
        );
      });

      return {
        rank: idx + 1,
        foodId: g.foodId,
        name: food?.foodName ?? '(Không rõ)',
        calories: calorieEntry != null ? Math.round(calorieEntry.value) : null,
        logCount: g._count._all,
        trendPercent: percentChange(g._count._all, prevCount),
      };
    });

    return { userGoalsBreakdown, topFoods };
  }

  // ─── Management alerts ────────────────────────────────────────────────────

  private async buildManagement() {
    const [pendingSubmissions, missingNutrition] = await Promise.all([
      this.prisma.userSubmission.findMany({
        where: { status: SubmissionStatus.PENDING },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          category: true,
          description: true,
          createdAt: true,
          targetFood: { select: { foodName: true } },
        },
      }),
      this.prisma.food.findMany({
        where: { nutritionProfile: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, foodName: true, createdAt: true },
      }),
    ]);

    const alerts: Array<{
      id: string;
      type: 'pending' | 'report' | 'missing';
      text: string;
      timeAgo: string;
      createdAt: string;
    }> = [];

    for (const s of pendingSubmissions) {
      const isReport = s.type === SubmissionType.REPORT;
      const foodName = s.targetFood?.foodName;

      let text: string;
      if (isReport) {
        text = foodName
          ? `Báo cáo về món "${foodName}" đang chờ xử lý.`
          : 'Có báo cáo mới đang chờ xử lý.';
      } else {
        text = foodName
          ? `Đóng góp thông tin món "${foodName}" đang chờ duyệt.`
          : 'Có đóng góp mới đang chờ duyệt.';
      }

      alerts.push({
        id: `submission-${s.id}`,
        type: isReport ? 'report' : 'pending',
        text,
        timeAgo: timeAgo(s.createdAt),
        createdAt: s.createdAt.toISOString(),
      });
    }

    for (const food of missingNutrition) {
      alerts.push({
        id: `missing-nutrition-${food.id}`,
        type: 'missing',
        text: `Món "${food.foodName ?? '(Không rõ)'}" chưa có hồ sơ dinh dưỡng.`,
        timeAgo: timeAgo(food.createdAt),
        createdAt: food.createdAt.toISOString(),
      });
    }

    // Sắp xếp mới nhất lên đầu
    alerts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      totalAlerts: alerts.length,
      alerts: alerts.slice(0, 10),
    };
  }
}
