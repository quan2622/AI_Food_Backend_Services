import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusType } from '../../generated/prisma/enums';

@Injectable()
export class DailyLogService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Private helpers ──────────────────────────────────────────────────────

  /** Chuẩn hoá Date về đầu ngày UTC (chỉ giữ phần date) */
  private toDateOnly(date: Date): Date {
    return new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
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
    });
    if (existing) return existing;

    return this.prisma.dailyLog.create({
      data: {
        userId,
        logDate,
        status: StatusType.BELOW,
      },
    });
  }

  // ─── Public API (Controller endpoints) ───────────────────────────────────

  /** Lấy hoặc tạo DailyLog cho ngày hôm nay của user */
  async getOrCreateToday(userId: number) {
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
