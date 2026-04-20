import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import aqp from 'api-query-params';
import type { AqpQuery } from 'api-query-params';
import { PrismaService } from '../../prisma/prisma.service';
import {
  GoalType,
  MealType,
  NutritionGoalStatus,
  StatusType,
} from '../../generated/prisma/enums';
import {
  AllCodeLookupService,
  type AllCodeInfo,
} from '../../common/services/allcode-lookup.service';
import {
  prismaSortFromAqp,
  stripAdminPaginationFilter,
} from '../../common/utils/admin-pagination.util';

type MealGroupRow = {
  mealType: string;
  mealTypeInfo: {
    keyMap: string;
    value: string;
    description: string | null;
    type: string;
  } | null;
  meals: any[];
};

/** Thứ tự hiển thị buổi: sáng → trưa → tối → snack; loại khác xếp sau. */
const MEAL_TYPE_DISPLAY_ORDER: readonly string[] = [
  MealType.MEAL_BREAKFAST,
  MealType.MEAL_LUNCH,
  MealType.MEAL_DINNER,
  MealType.MEAL_SNACK,
];

@Injectable()
export class DailyLogService {
  private readonly logger = new Logger(DailyLogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly allCodeLookup: AllCodeLookupService,
  ) {}

  // ─── Private helpers ──────────────────────────────────────────────────────

  /** Cùng công thức với formatDailyLogSimple: P×4 + netCarbs×4 + F×9, nhân quantity. */
  private computeMealTotalCaloriesFromItems(
    mealItems:
      | {
          quantity?: number | null;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          fiber?: number | null;
        }[]
      | undefined
      | null,
  ): number {
    if (!mealItems?.length) return 0;
    let sum = 0;
    for (const item of mealItems) {
      const quantity = item.quantity || 1;
      const netCarbs = (Number(item.carbs) || 0) - (Number(item.fiber) || 0);
      const itemCalories =
        ((Number(item.protein) || 0) * 4 + netCarbs * 4 + (Number(item.fat) || 0) * 9) *
        quantity;
      sum += itemCalories;
    }
    return Math.round(sum * 100) / 100;
  }

  private orderMealTypesPresent(present: Set<string>): string[] {
    return [
      ...MEAL_TYPE_DISPLAY_ORDER.filter((t) => present.has(t)),
      ...[...present]
        .filter((t) => !MEAL_TYPE_DISPLAY_ORDER.includes(t))
        .sort(),
    ];
  }

  /**
   * Gom meal theo buổi cho admin pagination: mỗi nhóm có totalCalories (tổng buổi),
   * từng meal có totalCalories.
   */
  private buildAdminMealCalorieGroups(
    meals: {
      id: number;
      mealType: string;
      mealDateTime: Date;
      totalCalories: number;
    }[],
    mealTypeInfoMap: Map<string, AllCodeInfo>,
  ): {
    mealType: string;
    mealTypeInfo: AllCodeInfo | null;
    totalCalories: number;
    meals: { id: number; mealDateTime: Date; totalCalories: number }[];
  }[] {
    if (!meals.length) return [];

    const sorted = [...meals].sort(
      (a, b) =>
        new Date(a.mealDateTime).getTime() -
        new Date(b.mealDateTime).getTime(),
    );

    const byType = new Map<string, typeof meals>();
    for (const m of sorted) {
      if (!byType.has(m.mealType)) byType.set(m.mealType, []);
      byType.get(m.mealType)!.push(m);
    }

    const orderedTypes = this.orderMealTypesPresent(new Set(byType.keys()));

    return orderedTypes.map((mealType) => {
      const groupMeals = byType.get(mealType) ?? [];
      const groupTotal = Math.round(
        groupMeals.reduce((s, m) => s + m.totalCalories, 0) * 100,
      ) / 100;
      return {
        mealType,
        mealTypeInfo: mealTypeInfoMap.get(mealType) ?? null,
        totalCalories: groupTotal,
        meals: groupMeals.map((m) => ({
          id: m.id,
          mealDateTime: m.mealDateTime,
          totalCalories: m.totalCalories,
        })),
      };
    });
  }

  /**
   * Gom các meal theo mealType (buổi), trong mỗi nhóm giữ thứ tự mealDateTime.
   */
  private async buildMealGroups(
    meals: any[] | undefined,
  ): Promise<MealGroupRow[]> {
    if (!meals?.length) {
      return [];
    }

    const sorted = [...meals].sort(
      (a, b) =>
        new Date(a.mealDateTime).getTime() -
        new Date(b.mealDateTime).getTime(),
    );

    const byType = new Map<string, any[]>();
    for (const m of sorted) {
      const key = m.mealType;
      if (!byType.has(key)) byType.set(key, []);
      byType.get(key)!.push(m);
    }

    const orderedTypes = this.orderMealTypesPresent(new Set(byType.keys()));

    const infoMap = await this.allCodeLookup.mapByKeyMaps(orderedTypes);

    return orderedTypes.map((mealType) => ({
      mealType,
      mealTypeInfo: infoMap.get(mealType) ?? null,
      meals: byType.get(mealType) ?? [],
    }));
  }

  /** Thêm `mealGroups` vào payload đã có `meals` (flat). */
  private async finalizeDailyLogResponse<T extends { meals?: any[] }>(
    payload: T,
  ): Promise<T & { mealGroups: MealGroupRow[] }> {
    const mealGroups = await this.buildMealGroups(payload.meals);
    return { ...payload, mealGroups };
  }

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
          orderBy: { mealDateTime: 'asc' },
          include: {
            mealItems: {
              include: {
                food: { select: { foodName: true, imageUrl: true } },
                foodImages: {
                  select: {
                    id: true,
                    imageUrl: true,
                    fileName: true,
                    uploadedAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const nutritionGoal =
      (await this.getActiveNutritionGoal(userId, logDate)) ??
      (await this.buildMaintenanceNutritionGoal(userId, logDate));

    if (existing) {
      const base = this.formatDailyLogWithTotals(existing, nutritionGoal);
      return this.finalizeDailyLogResponse(base);
    }

    const newLog = await this.prisma.dailyLog.upsert({
      where: { userId_logDate: { userId, logDate } },
      create: {
        userId,
        logDate,
        status: StatusType.STATUS_BELOW,
      },
      update: {},
      include: {
        meals: {
          orderBy: { mealDateTime: 'asc' },
          include: {
            mealItems: {
              include: {
                food: true,
                foodImages: {
                  select: {
                    id: true,
                    imageUrl: true,
                    fileName: true,
                    uploadedAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const base = this.formatDailyLogWithTotals(newLog, nutritionGoal);
    return this.finalizeDailyLogResponse(base);
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

  private async buildMaintenanceNutritionGoal(userId: number, date: Date) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    const weight = profile?.weight ?? 70;
    const bmr = profile?.bmr ?? 0;
    const tdee =
      profile?.tdee && profile.tdee > 0
        ? profile.tdee
        : bmr && bmr > 0
        ? bmr * 1.2
        : weight * 30;

    const targetCalories = Math.round(tdee);
    const targetProtein = Math.round(weight * 1.2 * 10) / 10;
    const targetFat = Math.round(((targetCalories * 0.25) / 9) * 10) / 10;
    const targetFiber = Math.max(
      Math.round((targetCalories / 1000) * 14),
      25,
    );
    const targetCarbs = Math.max(
      Math.round(((targetCalories - targetProtein * 4 - targetFat * 9) / 4) * 10) / 10,
      0,
    );

    return {
      id: 0,
      goalType: GoalType.GOAL_MAINTAIN,
      status: NutritionGoalStatus.NUTR_GOAL_ONGOING,
      targetWeight: null,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFat,
      targetFiber,
      startDate: date,
      endDate: date,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
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
              const netCarbs = (item.carbs || 0) - (item.fiber || 0);
              // Công thức: Protein×4 + NetCarbs×4 + Fat×9
              const itemCalories =
                ((item.protein || 0) * 4 + netCarbs * 4 + (item.fat || 0) * 9) *
                quantity;

              mealTotalCalories += itemCalories;

              // Cộng vào totals cả ngày
              totals.calories += itemCalories;
              totals.protein += (item.protein || 0) * quantity;
              totals.carbs += netCarbs * quantity;
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

  /** Lấy DailyLog của user theo ngày cụ thể (YYYY-MM-DD) với đầy đủ meals, mealItems, food và foodImages */
  async findByDate(userId: number, date: string) {
    const targetDate = new Date(date);
    const logDate = new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
      ),
    );

    const log = await this.prisma.dailyLog.findUnique({
      where: { userId_logDate: { userId, logDate } },
      include: {
        meals: {
          orderBy: { mealDateTime: 'asc' },
          include: {
            mealItems: {
              include: {
                food: {
                  select: {
                    foodName: true,
                    imageUrl: true,
                  },
                },
                foodImages: {
                  select: {
                    id: true,
                    imageUrl: true,
                    fileName: true,
                    uploadedAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException(`Không tìm thấy DailyLog cho ngày ${date}`);
    }

    const simple = this.formatDailyLogSimple(log);
    return this.finalizeDailyLogResponse(simple);
  }

  /** Format DailyLog không bao gồm totals và nutritionGoal */
  private formatDailyLogSimple(log: any) {
    const mealsWithTotals = log.meals
      ? log.meals.map((meal) => ({
          ...meal,
          totalCalories: this.computeMealTotalCaloriesFromItems(meal.mealItems),
        }))
      : [];

    return {
      ...log,
      meals: mealsWithTotals,
    };
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

  /** [Admin] Phân trang + lọc (aqp); gắn statusInfo từ AllCode theo keyMap `status`. */
  async findAllAdmin(page: number, limit: number, queryString: string) {
    try {
      const parsed = aqp(queryString) as AqpQuery;
      const { filter } = parsed;
      const { sort: aqpSort } = parsed;

      stripAdminPaginationFilter(filter as Record<string, unknown>);
      const sort = prismaSortFromAqp(aqpSort, { updatedAt: 'desc' });

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;

      /** Chỉ daily log của user thường (không lấy user admin). */
      const where = {
        AND: [filter, { user: { isAdmin: false } }],
      };

      const totalItems = await this.prisma.dailyLog.count({ where });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const rows = await this.prisma.dailyLog.findMany({
        where,
        orderBy: sort,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          meals: {
            orderBy: { mealDateTime: 'asc' },
            select: {
              id: true,
              mealType: true,
              mealDateTime: true,
              mealItems: {
                select: {
                  quantity: true,
                  protein: true,
                  carbs: true,
                  fat: true,
                  fiber: true,
                },
              },
            },
          },
        },
        skip: offset,
        take: defaultLimit,
      });

      const statusMap = await this.allCodeLookup.mapByKeyMaps(
        rows.map((r) => r.status),
      );

      const allMealTypes = new Set<string>();
      for (const r of rows) {
        for (const m of r.meals) {
          allMealTypes.add(m.mealType);
        }
      }
      const mealTypeInfoMap = await this.allCodeLookup.mapByKeyMaps(allMealTypes);

      const result = rows.map((r) => {
        const mealsCal = (r.meals ?? []).map((m) => ({
          id: m.id,
          mealType: m.mealType,
          mealDateTime: m.mealDateTime,
          totalCalories: this.computeMealTotalCaloriesFromItems(m.mealItems),
        }));
        const dayTotalCalories = Math.round(
          mealsCal.reduce((s, m) => s + m.totalCalories, 0) * 100,
        ) / 100;
        const mealGroups = this.buildAdminMealCalorieGroups(
          mealsCal,
          mealTypeInfoMap,
        );
        const { meals: _omitMeals, ...rest } = r;
        void _omitMeals;
        return {
          ...rest,
          dayTotalCalories,
          mealGroups,
          statusInfo: statusMap.get(r.status) ?? null,
        };
      });

      this.logger.log(
        `daily-logs/admin paginate: current=${page} pageSize=${defaultLimit} total(non-admin users only)=${totalItems} rows=${result.length}`,
      );

      return {
        EC: 0,
        EM: 'Get daily logs with query paginate success (admin)',
        meta: {
          current: page,
          pageSize: limit,
          pages: totalPages,
          total: totalItems,
        },
        result,
      };
    } catch (error) {
      console.error(
        'Error in daily log service get paginate (admin):',
        (error as Error).message,
      );
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in daily log service get paginate',
      });
    }
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

  /**
   * [Admin] Lấy DailyLog theo dailyLogId, bắt buộc khớp userId (chủ sở hữu).
   * Trả về meals → mealItems → food và totalCalories mỗi bữa, kèm statusInfo.
   */
  async findOneForUserAdmin(userId: number, dailyLogId: number) {
    const log = await this.prisma.dailyLog.findUnique({
      where: { id: dailyLogId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        meals: {
          orderBy: { mealDateTime: 'asc' },
          include: {
            mealItems: {
              include: {
                food: {
                  select: { foodName: true, imageUrl: true },
                },
              },
            },
          },
        },
      },
    });
    if (!log) {
      throw new NotFoundException(`DailyLog #${dailyLogId} không tồn tại`);
    }
    if (log.userId !== userId) {
      throw new ForbiddenException(
        'DailyLog này không thuộc user đã chỉ định',
      );
    }

    const statusMap = await this.allCodeLookup.mapByKeyMaps([log.status]);
    const formatted = this.formatDailyLogSimple(log);
    const withGroups = await this.finalizeDailyLogResponse(formatted);
    return {
      ...withGroups,
      statusInfo: statusMap.get(log.status) ?? null,
    };
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
