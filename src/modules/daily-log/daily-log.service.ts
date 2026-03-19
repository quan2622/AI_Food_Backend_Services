import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusType } from '../../generated/prisma/enums';

@Injectable()
export class DailyLogService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Private helpers ──────────────────────────────────────────────────────

  /** Chuẩn hoá Date về đầu ngày local (trùng khớp với lúc gieo hạt Seed) */
  private toDateOnly(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
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
              include: { food: { select: { foodName: true, imageUrl: true } } }
            }
          }
        }
      }
    });

    if (existing) return this.formatDailyLogWithTotals(existing);

    const newLog = await this.prisma.dailyLog.create({
      data: {
        userId,
        logDate,
        status: StatusType.BELOW,
      },
      include: {
        meals: {
          include: {
            mealItems: { include: { food: true } }
          }
        }
      }
    });

    return this.formatDailyLogWithTotals(newLog);
  }

  /** Helper tính tổng dinh dưỡng để trả về kèm JSON */
  private formatDailyLogWithTotals(log: any) {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    if (log.meals) {
      log.meals.forEach(meal => {
        meal.mealItems.forEach(item => {
          totals.calories += item.calories || 0;
          totals.protein += item.protein || 0;
          totals.carbs += item.carbs || 0;
          totals.fat += item.fat || 0;
          totals.fiber += item.fiber || 0;
        });
      });
    }
    return {
      ...log,
      totals
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
    const today = this.toDateOnly(new Date());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    return this.prisma.dailyLog.findMany({
      where: {
        userId,
        logDate: { gte: sevenDaysAgo, lte: today },
      },
      orderBy: { logDate: 'asc' },
    });
  }
}
