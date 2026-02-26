import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Tolerance (calo) để coi là "MET" mục tiêu
const MET_TOLERANCE = 50;

/** Delta dinh dưỡng dùng khi cộng/trừ vào DailyLog */
export interface NutritionDelta {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

@Injectable()
export class DailyLogService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Private helpers ─────────────────────────────────────────────────────────

  /** Tính status dựa trên totalCalories so với targetCalories (±50 calo) */
  private calcStatus(totalCalories: number, targetCalories: number): string {
    if (targetCalories <= 0) return 'BELOW';
    const diff = totalCalories - targetCalories;
    if (Math.abs(diff) <= MET_TOLERANCE) return 'MET';
    return diff > 0 ? 'ABOVE' : 'BELOW';
  }

  /** Chuẩn hoá Date về đầu ngày UTC (chỉ giữ phần date) */
  private toDateOnly(date: Date): Date {
    return new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
  }

  /**
   * Lấy NutritionGoal đang active của user tại một ngày cụ thể.
   * Dùng để copy target khi tạo DailyLog mới.
   */
  private async getActiveGoalTargets(
    userId: number,
    date: Date,
  ): Promise<{
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
  }> {
    // NutritionGoal hiện tại chỉ lưu targetCaloriesPerDay nên protein/carbs = 0
    const goal = await this.prisma.nutritionGoal.findFirst({
      where: {
        userId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      targetCalories: goal?.targetCaloriesPerDay ?? 0,
      targetProtein: 0,
      targetCarbs: 0,
    };
  }

  // ─── Internal API (dùng bởi MealItemService) ─────────────────────────────────

  /**
   * Lấy DailyLog của user cho ngày hôm nay.
   * Nếu chưa tồn tại, tạo mới và copy mục tiêu từ NutritionGoal.
   */
  async getOrCreateForDate(userId: number, date: Date) {
    const logDate = this.toDateOnly(date);

    const existing = await this.prisma.dailyLog.findUnique({
      where: { userId_logDate: { userId, logDate } },
    });
    if (existing) return existing;

    const targets = await this.getActiveGoalTargets(userId, logDate);

    return this.prisma.dailyLog.create({
      data: {
        userId,
        logDate,
        targetCalories: targets.targetCalories,
        targetProtein: targets.targetProtein,
        targetCarbs: targets.targetCarbs,
        status: 'BELOW',
      },
    });
  }

  /**
   * Cộng dồn dinh dưỡng vào DailyLog, cập nhật status.
   * Tự động tạo DailyLog nếu chưa có.
   */
  async addNutrition(userId: number, date: Date, delta: NutritionDelta) {
    const logDate = this.toDateOnly(date);

    // Dùng upsert để đảm bảo DailyLog tồn tại
    const targets = await this.getActiveGoalTargets(userId, logDate);

    const updated = await this.prisma.dailyLog.upsert({
      where: { userId_logDate: { userId, logDate } },
      create: {
        userId,
        logDate,
        totalCalories: delta.calories,
        totalProtein: delta.protein,
        totalCarbs: delta.carbs,
        totalFat: delta.fat,
        targetCalories: targets.targetCalories,
        targetProtein: targets.targetProtein,
        targetCarbs: targets.targetCarbs,
        status: this.calcStatus(delta.calories, targets.targetCalories),
      },
      update: {
        totalCalories: { increment: delta.calories },
        totalProtein: { increment: delta.protein },
        totalCarbs: { increment: delta.carbs },
        totalFat: { increment: delta.fat },
      },
    });

    // Tính lại status sau khi increment (cần giá trị mới nhất)
    const newStatus = this.calcStatus(
      Number(updated.totalCalories),
      Number(updated.targetCalories),
    );
    if (newStatus !== updated.status) {
      return this.prisma.dailyLog.update({
        where: { id: updated.id },
        data: { status: newStatus },
      });
    }
    return updated;
  }

  /**
   * Trừ dinh dưỡng khỏi DailyLog (khi xóa hoặc sửa MealItem).
   * Nếu DailyLog không tồn tại, không làm gì.
   */
  async subtractNutrition(userId: number, date: Date, delta: NutritionDelta) {
    const logDate = this.toDateOnly(date);

    const log = await this.prisma.dailyLog.findUnique({
      where: { userId_logDate: { userId, logDate } },
    });
    if (!log) return;

    const updated = await this.prisma.dailyLog.update({
      where: { id: log.id },
      data: {
        totalCalories: { decrement: delta.calories },
        totalProtein: { decrement: delta.protein },
        totalCarbs: { decrement: delta.carbs },
        totalFat: { decrement: delta.fat },
      },
    });

    const newStatus = this.calcStatus(
      Number(updated.totalCalories),
      Number(updated.targetCalories),
    );
    if (newStatus !== updated.status) {
      return this.prisma.dailyLog.update({
        where: { id: updated.id },
        data: { status: newStatus },
      });
    }
    return updated;
  }

  // ─── Public API (Controller endpoints) ───────────────────────────────────────

  /** Lấy hoặc tạo DailyLog cho ngày hôm nay của user */
  async getOrCreateToday(userId: number) {
    // Lấy giờ hiện tại theo timezone +07:00 (Việt Nam)
    const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);
    return this.getOrCreateForDate(userId, nowVN);
  }

  /** Lấy tất cả DailyLog của user (sắp xếp mới nhất trước) */
  findAllByUserId(userId: number) {
    return this.prisma.dailyLog.findMany({
      where: { userId },
      orderBy: { logDate: 'desc' },
    });
  }

  /** Lấy DailyLog của user theo ngày cụ thể (YYYY-MM-DD) */
  async findByDate(userId: number, dateStr: string) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const logDate = new Date(Date.UTC(year, month - 1, day));

    const log = await this.prisma.dailyLog.findUnique({
      where: { userId_logDate: { userId, logDate } },
    });
    if (!log)
      throw new NotFoundException(
        `Không tìm thấy DailyLog cho ngày ${dateStr}`,
      );
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
    const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);
    const today = this.toDateOnly(nowVN);
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
