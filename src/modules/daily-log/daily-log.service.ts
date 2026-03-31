import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusType } from '../../generated/prisma/enums';

@Injectable()
export class DailyLogService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Private helpers ──────────────────────────────────────────────────────

  /** Chuẩn hoá Date về đầu ngày UTC (consistent với database) */
  private toDateOnly(date: Date): Date {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    return d;
  }

  // ─── Internal API ─────────────────────────────────────────────────────────

  /**
   * Lấy DailyLog của user cho một ngày.
   * Nếu chưa tồn tại, tạo mới với status mặc định BELOW.
   */
  async getOrCreateForDate(userId: number, date: Date) {
    const logDate = this.toDateOnly(date);

    const existing = await this.prisma.dailyLog.findUnique({
      where: { userId_logDate: { userId, logDate } },
      include: {
        meals: {
          include: {
            mealItems: {
              include: { food: { select: { foodName: true, imageUrl: true } } },
            },
          },
        },
      },
    });

    const nutritionGoal = await this.getActiveNutritionGoal(userId, logDate);

    if (existing) {
      return this.formatDailyLogWithTotals(existing, nutritionGoal);
    }

    const newLog = await this.prisma.dailyLog.create({
      data: {
        userId,
        logDate,
        status: StatusType.STATUS_BELOW,
      },
      include: {
        meals: {
          include: {
            mealItems: { include: { food: true } },
          },
        },
      },
    });

    return this.formatDailyLogWithTotals(newLog, nutritionGoal);
  }

  /** Lấy nutrition goal đang active cho ngày cụ thể */
  private async getActiveNutritionGoal(userId: number, date: Date) {
    const goal = await this.prisma.nutritionGoal.findFirst({
      where: {
        userId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
      orderBy: { startDate: 'desc' },
    });
    return goal;
  }

  /** Helper tính tổng dinh dưỡng để trả về kèm JSON */
  private formatDailyLogWithTotals(log: any, nutritionGoal: any = null) {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

    // Tính totalCalories cho mỗi meal và totals cho cả ngày
    const mealsWithTotals = log.meals
      ? log.meals.map((meal) => {
          let mealTotalCalories = 0;

          if (meal.mealItems) {
            meal.mealItems.forEach((item) => {
              const quantity = item.quantity || 1;
              // Tính calories: protein*4 + carbs*4 + fat*9 + fiber*2
              const itemCalories =
                ((item.protein || 0) * 4 +
                  (item.carbs || 0) * 4 +
                  (item.fat || 0) * 9 +
                  (item.fiber || 0) * 2) *
                quantity;

              mealTotalCalories += itemCalories;

              // Cộng vào totals cả ngày
              totals.calories += itemCalories;
              totals.protein += (item.protein || 0) * quantity;
              totals.carbs += (item.carbs || 0) * quantity;
              totals.fat += (item.fat || 0) * quantity;
              totals.fiber += (item.fiber || 0) * quantity;
            });
          }

          return {
            ...meal,
            totalCalories: Math.round(mealTotalCalories * 100) / 100,
          };
        })
      : [];

    return {
      ...log,
      meals: mealsWithTotals,
      totals: {
        calories: Math.round(totals.calories * 100) / 100,
        protein: Math.round(totals.protein * 100) / 100,
        carbs: Math.round(totals.carbs * 100) / 100,
        fat: Math.round(totals.fat * 100) / 100,
        fiber: Math.round(totals.fiber * 100) / 100,
      },
      nutritionGoal,
    };
  }

  // ─── Public API (Controller endpoints) ───────────────────────────────────

  /** Lấy hoặc tạo DailyLog cho ngày hôm nay của user */
  async getOrCreateToday(userId: number) {
    return this.getOrCreateForDate(userId, new Date());
  }

  /** Lấy tất cả DailyLog của user (sắp xếp mới nhất trước) */
  findAllByUserId(userId: number) {
    return this.prisma.dailyLog.findMany({
      where: { userId },
      orderBy: { logDate: 'desc' },
    });
  }

  /** Lấy DailyLog của user theo ngày cụ thể (YYYY-MM-DD) */
  async findByDate(userId: number, date: string) {
    const targetDate = new Date(date);
    const startDate = new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
      ),
    );
    const endDate = new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const log = await this.prisma.dailyLog.findUnique({
      where: { userId_logDate: { userId, logDate: startDate } },
    });
    if (!log)
      throw new NotFoundException(`Không tìm thấy DailyLog cho ngày ${date}`);
    return log;
  }

  /** [Admin] Lấy tất cả DailyLog (mọi user) */
  findAll() {
    return this.prisma.dailyLog.findMany({
      orderBy: { logDate: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  /** [Admin] Lấy một DailyLog theo id */
  async findOne(id: number) {
    const log = await this.prisma.dailyLog.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!log) throw new NotFoundException(`DailyLog #${id} không tồn tại`);
    return log;
  }

  /** Lấy DailyLog của user theo tuần (7 ngày gần nhất) */
  findWeeklySummary(userId: number) {
    const today = this.toDateOnly(new Date());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

    return this.prisma.dailyLog.findMany({
      where: {
        userId,
        logDate: { gte: sevenDaysAgo, lte: today },
      },
      orderBy: { logDate: 'asc' },
    });
  }
}
