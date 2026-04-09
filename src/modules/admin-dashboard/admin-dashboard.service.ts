import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NutritionGoalStatus } from '../../generated/prisma/enums';

const MS_DAY = 86_400_000;

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function addUtcDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * MS_DAY);
}

/** % thay đổi so với kỳ trước; null nếu kỳ trước = 0 và kỳ này = 0 */
function percentChange(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 10_000) / 100;
}

export type DashboardAlert = {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  type: string;
  title: string;
  detail?: string;
  count?: number;
};

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── 1. KPI ───────────────────────────────────────────────────────────────

  async getKpiOverview() {
    const now = new Date();
    const todayStart = startOfUtcDay(now);
    const yesterdayStart = addUtcDays(todayStart, -1);
    /** Cửa sổ 7 ngày trượt (bao gồm “hôm nay” tới thời điểm hiện tại) */
    const rolling7Start = new Date(now.getTime() - 7 * MS_DAY);
    const rolling14Start = new Date(now.getTime() - 14 * MS_DAY);

    const [
      totalUsers,
      activeToday,
      activeYesterday,
      mealsLast7,
      mealsPrev7,
      newLast7,
      newPrev7,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isAdmin: false } }),
      this.countDistinctUsersWithMealOnDay(todayStart, addUtcDays(todayStart, 1)),
      this.countDistinctUsersWithMealOnDay(
        yesterdayStart,
        todayStart,
      ),
      this.prisma.meal.count({
        where: {
          mealDateTime: { gte: rolling7Start, lte: now },
          dailyLog: { user: { isAdmin: false } },
        },
      }),
      this.prisma.meal.count({
        where: {
          mealDateTime: { gte: rolling14Start, lt: rolling7Start },
          dailyLog: { user: { isAdmin: false } },
        },
      }),
      this.prisma.user.count({
        where: {
          isAdmin: false,
          createdAt: { gte: rolling7Start, lte: now },
        },
      }),
      this.prisma.user.count({
        where: {
          isAdmin: false,
          createdAt: { gte: rolling14Start, lt: rolling7Start },
        },
      }),
    ]);

    return {
      asOf: now.toISOString(),
      totalUsers,
      activeUsersToday: activeToday,
      activeUsersYesterday: activeYesterday,
      activeUsersChangePercent: percentChange(activeToday, activeYesterday),
      mealsLoggedLast7Days: mealsLast7,
      mealsLoggedPrevious7Days: mealsPrev7,
      mealsChangePercent: percentChange(mealsLast7, mealsPrev7),
      newUsersLast7Days: newLast7,
      newUsersPrevious7Days: newPrev7,
      newUsersChangePercent: percentChange(newLast7, newPrev7),
    };
  }

  private async countDistinctUsersWithMealOnDay(
    from: Date,
    to: Date,
  ): Promise<number> {
    const rows = await this.prisma.meal.findMany({
      where: {
        mealDateTime: { gte: from, lt: to },
        dailyLog: { user: { isAdmin: false } },
      },
      select: {
        dailyLogId: true,
        dailyLog: { select: { userId: true } },
      },
      distinct: ['dailyLogId'],
    });
    const userIds = new Set(rows.map((r) => r.dailyLog.userId));
    return userIds.size;
  }

  // ─── 2. Activity + alerts ────────────────────────────────────────────────

  async getActivityAndAlerts(days = 14) {
    const now = new Date();
    const todayStart = startOfUtcDay(now);
    const seriesStart = addUtcDays(todayStart, -days);

    const meals = await this.prisma.meal.findMany({
      where: {
        mealDateTime: { gte: seriesStart, lt: addUtcDays(todayStart, 1) },
        dailyLog: { user: { isAdmin: false } },
      },
      select: {
        mealDateTime: true,
        dailyLog: { select: { userId: true } },
      },
    });

    const byDay = new Map<string, Set<number>>();
    for (let i = 0; i < days; i++) {
      const d = addUtcDays(seriesStart, i);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, new Set());
    }
    for (const m of meals) {
      const d = startOfUtcDay(m.mealDateTime);
      const key = d.toISOString().slice(0, 10);
      if (!byDay.has(key)) byDay.set(key, new Set());
      byDay.get(key)!.add(m.dailyLog.userId);
    }

    const series = [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, set]) => ({
        date,
        activeUsers: set.size,
      }));

    const alerts = await this.buildAlerts();

    return {
      asOf: now.toISOString(),
      series,
      alerts,
    };
  }

  private async buildAlerts(): Promise<DashboardAlert[]> {
    const out: DashboardAlert[] = [];

    const missingNut = await this.prisma.food.count({
      where: { nutritionProfile: null },
    });
    if (missingNut > 0) {
      out.push({
        id: 'food-missing-nutrition',
        severity: missingNut > 50 ? 'warning' : 'info',
        type: 'FOOD_MISSING_NUTRITION',
        title: 'Món ăn chưa có hồ sơ dinh dưỡng',
        detail:
          'Cần bổ sung FoodNutritionProfile để tính toán và hiển thị đúng.',
        count: missingNut,
      });
    }

    const lastJob = await this.prisma.aITrainingJob.findFirst({
      where: { finishedAt: { not: null } },
      orderBy: { finishedAt: 'desc' },
      include: { deployedModel: { select: { version: true } } },
    });
    if (lastJob) {
      out.push({
        id: `ai-job-${lastJob.id}`,
        severity: 'info',
        type: 'AI_TRAINING_SUCCESS',
        title: 'Huấn luyện mô hình gần nhất',
        detail: `Model ${lastJob.deployedModel?.version ?? lastJob.modelName} — hoàn tất ${lastJob.finishedAt?.toISOString() ?? ''}`,
      });
    }

    out.push({
      id: 'user-food-reports-placeholder',
      severity: 'info',
      type: 'FEATURE_ROADMAP',
      title: 'Báo cáo sai món từ người dùng',
      detail:
        'Chưa có bảng ticket báo cáo; có thể mở rộng sau để hiển thị tại đây.',
    });

    return out;
  }

  // ─── 3. Platform nutrition ─────────────────────────────────────────────

  async getNutritionPlatformSummary() {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 7 * MS_DAY);

    const [macroAgg, distinctDays, goals] = await Promise.all([
      this.prisma.mealItem.aggregate({
        where: {
          meal: {
            mealDateTime: { gte: windowStart, lte: now },
            dailyLog: { user: { isAdmin: false } },
          },
        },
        _sum: {
          calories: true,
          protein: true,
          carbs: true,
          fat: true,
          fiber: true,
        },
      }),
      this.prisma.$queryRaw<{ n: bigint }[]>`
        SELECT COUNT(*)::bigint AS n
        FROM (
          SELECT DISTINCT dl."userId", (m."mealDateTime" AT TIME ZONE 'UTC')::date AS d
          FROM meals m
          INNER JOIN daily_logs dl ON m."dailyLogId" = dl.id
          INNER JOIN users u ON dl."userId" = u.id
          WHERE u."isAdmin" = false
            AND m."mealDateTime" >= ${windowStart}
            AND m."mealDateTime" <= ${now}
        ) t
      `,
      this.prisma.nutritionGoal.findMany({
        where: {
          user: { isAdmin: false },
          status: NutritionGoalStatus.NUTR_GOAL_ONGOING,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        select: {
          targetCalories: true,
          targetProtein: true,
          targetCarbs: true,
          targetFat: true,
          targetFiber: true,
        },
      }),
    ]);

    const dayCount = Math.max(1, Number(distinctDays[0]?.n ?? 0n));
    const gCount = Math.max(1, goals.length);

    const sum = macroAgg._sum;
    const actualDailyAvg = {
      calories: round2(Number(sum.calories ?? 0) / dayCount),
      protein: round2(Number(sum.protein ?? 0) / dayCount),
      carbs: round2(Number(sum.carbs ?? 0) / dayCount),
      fat: round2(Number(sum.fat ?? 0) / dayCount),
      fiber: round2(Number(sum.fiber ?? 0) / dayCount),
    };

    const recommendedAvg = {
      calories: round2(
        goals.reduce((s, g) => s + g.targetCalories, 0) / gCount,
      ),
      protein: round2(goals.reduce((s, g) => s + g.targetProtein, 0) / gCount),
      carbs: round2(goals.reduce((s, g) => s + g.targetCarbs, 0) / gCount),
      fat: round2(goals.reduce((s, g) => s + g.targetFat, 0) / gCount),
      fiber: round2(goals.reduce((s, g) => s + g.targetFiber, 0) / gCount),
    };

    const metrics = (
      ['calories', 'protein', 'carbs', 'fat', 'fiber'] as const
    ).map((key) => ({
      key,
      labelKey: key,
      actualDailyAverage: actualDailyAvg[key],
      recommendedAverage: recommendedAvg[key],
      percentOfRecommended: ratioPercent(
        actualDailyAvg[key],
        recommendedAvg[key],
      ),
    }));

    return {
      asOf: now.toISOString(),
      period: {
        from: windowStart.toISOString(),
        to: now.toISOString(),
        note: 'Cửa sổ 7 ngày trượt. Trung bình thực tế = tổng macro từ meal items / số cặp (user, ngày UTC) có ghi nhận bữa. Khuyến nghị = trung bình target từ mục tiêu dinh dưỡng đang ongoing.',
      },
      distinctUserDaysWithMeals: Number(distinctDays[0]?.n ?? 0n),
      ongoingGoalsSampleSize: goals.length,
      metrics,
    };
  }

  // ─── 4. Top foods + goals ────────────────────────────────────────────────

  async getFoodsAndGoals(topFoodsLimit = 10) {
    const now = new Date();
    const todayStart = startOfUtcDay(now);
    const last30Start = addUtcDays(todayStart, -30);

    const grouped = await this.prisma.mealItem.groupBy({
      by: ['foodId'],
      where: {
        meal: {
          mealDateTime: { gte: last30Start, lt: addUtcDays(todayStart, 1) },
          dailyLog: { user: { isAdmin: false } },
        },
      },
      _count: { _all: true },
      orderBy: { _count: { foodId: 'desc' } },
      take: topFoodsLimit,
    });

    const foodIds = grouped.map((g) => g.foodId);
    const foods = await this.prisma.food.findMany({
      where: { id: { in: foodIds } },
      select: { id: true, foodName: true, imageUrl: true },
    });
    const foodMap = new Map(foods.map((f) => [f.id, f]));

    const topFoods = grouped.map((g) => ({
      foodId: g.foodId,
      mealItemCount: g._count._all,
      food: foodMap.get(g.foodId) ?? { id: g.foodId, foodName: null },
    }));

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

    const goalTypeBreakdown = goalDist.map((r) => ({
      goalType: r.goalType,
      count: r._count._all,
      percentOfTotal:
        totalGoals > 0
          ? Math.round((r._count._all / totalGoals) * 10_000) / 100
          : 0,
    }));

    return {
      asOf: now.toISOString(),
      topFoodsWindowDays: 30,
      topFoods,
      goalTypeBreakdown,
      ongoingGoalsTotal: totalGoals,
    };
  }

  // ─── 5. New users + content queue ────────────────────────────────────────

  async getUsersAndContent(newUserLimit = 10, contentSample = 8) {
    const now = new Date();

    const [newUsers, missingNutTotal, missingNutSample] = await Promise.all([
      this.prisma.user.findMany({
        where: { isAdmin: false },
        orderBy: { createdAt: 'desc' },
        take: newUserLimit,
        select: {
          id: true,
          email: true,
          fullName: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.food.count({ where: { nutritionProfile: null } }),
      this.prisma.food.findMany({
        where: { nutritionProfile: null },
        orderBy: { createdAt: 'desc' },
        take: contentSample,
        select: { id: true, foodName: true, createdAt: true },
      }),
    ]);

    return {
      asOf: now.toISOString(),
      newUsersNote:
        'accountActive lấy từ users.status (true = tài khoản đang bật). Cờ xác minh email riêng chưa có trong schema.',
      newUsers: newUsers.map((u) => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        accountActive: u.status,
        createdAt: u.createdAt,
      })),
      contentQueue: {
        foodsMissingNutritionProfile: {
          total: missingNutTotal,
          sample: missingNutSample,
        },
        reportedFoods: {
          total: 0,
          items: [] as unknown[],
          note:
            'Chưa có entity báo cáo món; bổ sung sau để hiển thị hàng đợi kiểm duyệt.',
        },
      },
    };
  }

  // ─── Overview (all groups) ───────────────────────────────────────────────

  async getOverview() {
    const [kpi, activity, nutrition, foodsGoals, usersContent] =
      await Promise.all([
        this.getKpiOverview(),
        this.getActivityAndAlerts(14),
        this.getNutritionPlatformSummary(),
        this.getFoodsAndGoals(10),
        this.getUsersAndContent(10, 8),
      ]);

    return {
      EC: 0,
      EM: 'Admin dashboard overview',
      asOf: new Date().toISOString(),
      kpi,
      activityAndAlerts: activity,
      nutritionPlatform: nutrition,
      foodsAndGoals: foodsGoals,
      usersAndContent: usersContent,
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function ratioPercent(actual: number, recommended: number): number | null {
  if (recommended <= 0) return null;
  return Math.round((actual / recommended) * 10_000) / 100;
}
