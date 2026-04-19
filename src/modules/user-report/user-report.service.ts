import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TrendOption } from './dto/nutrition-trend.dto';
import { TrendType, NutritionMetric } from './dto/nutrition-metric-trend.dto';

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MealTimeData extends NutritionData {
  mealId: number;
  mealType: string;
  mealTypeLabel: string;
  mealDateTime: string;
}

export interface DayData extends NutritionData {
  date: string;
  label: string;
}

export interface MonthData extends NutritionData {
  month: string;
  label: string;
  trend: NutritionData | null;
}

export interface YearData extends NutritionData {
  month: string;
  label: string;
  trend: NutritionData | null;
}

export interface MetricTrendDataPoint {
  label: string;
  date: string;
  value: number;
}

export interface MetricTrendResult {
  type: TrendType;
  metric: NutritionMetric;
  range: {
    start: string;
    end: string;
  };
  data: MetricTrendDataPoint[];
  summary?: {
    average: number;
    trend: number;
    trendDirection: 'up' | 'down' | 'stable';
  };
}

@Injectable()
export class UserReportService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Private helpers ──────────────────────────────────────────────────────

  private toDateOnly(date: Date): Date {
    return new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatMonth(date: Date): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  private getSundayOfWeek(date: Date): Date {
    const monday = this.getMondayOfWeek(date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday;
  }

  private getDayLabel(date: Date): string {
    const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return dayLabels[date.getDay()];
  }

  private getWeekLabel(weekIndex: number, totalWeeks: number): string {
    return `Tuần ${totalWeeks - weekIndex}`;
  }

  private getMonthLabel(date: Date): string {
    return `Tháng ${date.getMonth() + 1}`;
  }

  private calculateNutritionFromMealItems(mealItems: any[]): NutritionData {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

    for (const item of mealItems) {
      const quantity = item.quantity || 1;
      const netCarbs = (item.carbs || 0) - (item.fiber || 0);
      const itemCalories =
        ((item.protein || 0) * 4 + netCarbs * 4 + (item.fat || 0) * 9) *
        quantity;

      totals.calories += itemCalories;
      totals.protein += (item.protein || 0) * quantity;
      totals.carbs += netCarbs * quantity;
      totals.fat += (item.fat || 0) * quantity;
      totals.fiber += (item.fiber || 0) * quantity;
    }

    return {
      calories: Math.round(totals.calories * 100) / 100,
      protein: Math.round(totals.protein * 100) / 100,
      carbs: Math.round(totals.carbs * 100) / 100,
      fat: Math.round(totals.fat * 100) / 100,
      fiber: Math.round(totals.fiber * 100) / 100,
    };
  }

  private calculateAverage(
    nutritionData: NutritionData[],
    daysWithData: number,
  ): NutritionData {
    if (daysWithData === 0) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    }

    const totals = nutritionData.reduce(
      (acc, curr) => ({
        calories: acc.calories + curr.calories,
        protein: acc.protein + curr.protein,
        carbs: acc.carbs + curr.carbs,
        fat: acc.fat + curr.fat,
        fiber: acc.fiber + curr.fiber,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );

    return {
      calories: Math.round((totals.calories / daysWithData) * 100) / 100,
      protein: Math.round((totals.protein / daysWithData) * 100) / 100,
      carbs: Math.round((totals.carbs / daysWithData) * 100) / 100,
      fat: Math.round((totals.fat / daysWithData) * 100) / 100,
      fiber: Math.round((totals.fiber / daysWithData) * 100) / 100,
    };
  }

  private calculateTrend(
    current: NutritionData,
    previous: NutritionData | null,
  ): NutritionData | null {
    if (!previous) return null;

    return {
      calories: Math.round((current.calories - previous.calories) * 100) / 100,
      protein: Math.round((current.protein - previous.protein) * 100) / 100,
      carbs: Math.round((current.carbs - previous.carbs) * 100) / 100,
      fat: Math.round((current.fat - previous.fat) * 100) / 100,
      fiber: Math.round((current.fiber - previous.fiber) * 100) / 100,
    };
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  async getNutritionTrend(
    userId: number,
    option: TrendOption,
  ): Promise<MealTimeData[] | DayData[] | MonthData[] | YearData[]> {
    switch (option) {
      case TrendOption.DAY:
        return this.getDailyTrend(userId);
      case TrendOption.WEEK:
        return this.getWeeklyTrend(userId);
      case TrendOption.MONTH:
        return this.getMonthlyTrend(userId);
      case TrendOption.YEAR:
        return this.getYearlyTrend(userId);
      default:
        return [];
    }
  }

  private static readonly MEAL_TYPE_LABELS: Record<string, string> = {
    MEAL_BREAKFAST: 'Bữa sáng',
    MEAL_LUNCH: 'Bữa trưa',
    MEAL_DINNER: 'Bữa tối',
    MEAL_SNACK: 'Bữa phụ',
  };

  private async getDailyTrend(userId: number): Promise<MealTimeData[]> {
    const today = this.toDateOnly(new Date());

    const dailyLog = await this.prisma.dailyLog.findFirst({
      where: { userId, logDate: today },
      include: {
        meals: {
          include: { mealItems: true },
          orderBy: { mealDateTime: 'asc' },
        },
      },
    });

    if (!dailyLog) return [];

    return dailyLog.meals.map((meal) => {
      const nutrition = this.calculateNutritionFromMealItems(meal.mealItems);
      return {
        mealId: meal.id,
        mealType: meal.mealType,
        mealTypeLabel:
          UserReportService.MEAL_TYPE_LABELS[meal.mealType] ?? meal.mealType,
        mealDateTime: meal.mealDateTime.toISOString(),
        ...nutrition,
      };
    });
  }

  private async getWeeklyTrend(userId: number): Promise<DayData[]> {
    const today = this.toDateOnly(new Date());
    const monday = this.getMondayOfWeek(new Date(today));

    const dailyLogs = await this.prisma.dailyLog.findMany({
      where: {
        userId,
        logDate: { gte: monday, lte: today },
      },
      include: {
        meals: {
          include: { mealItems: true },
        },
      },
      orderBy: { logDate: 'asc' },
    });

    // Build a map date → nutrition
    const logsByDate = new Map<string, (typeof dailyLogs)[0]>();
    for (const log of dailyLogs) {
      logsByDate.set(this.formatDate(log.logDate), log);
    }

    const result: DayData[] = [];
    const todayDayIndex = today.getDay(); // 0=Sun, 1=Mon…
    const daysFromMonday = todayDayIndex === 0 ? 6 : todayDayIndex - 1;

    for (let i = 0; i <= daysFromMonday; i++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + i);
      const dateStr = this.formatDate(currentDate);
      const log = logsByDate.get(dateStr);

      let nutrition: NutritionData = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      };
      if (log) {
        const allMealItems = log.meals.flatMap((m) => m.mealItems);
        nutrition = this.calculateNutritionFromMealItems(allMealItems);
      }

      result.push({
        date: dateStr,
        label: this.getDayLabel(currentDate),
        ...nutrition,
      });
    }

    return result;
  }

  private async getMonthlyTrend(userId: number): Promise<DayData[]> {
    const today = this.toDateOnly(new Date());
    const monthStart = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
    );

    const dailyLogs = await this.prisma.dailyLog.findMany({
      where: {
        userId,
        logDate: { gte: monthStart, lte: today },
      },
      include: {
        meals: { include: { mealItems: true } },
      },
      orderBy: { logDate: 'asc' },
    });

    const logsByDate = new Map<string, (typeof dailyLogs)[0]>();
    for (const log of dailyLogs) {
      logsByDate.set(this.formatDate(log.logDate), log);
    }

    const result: DayData[] = [];
    const currentDay = today.getUTCDate();

    for (let day = 1; day <= currentDay; day++) {
      const currentDate = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), day),
      );
      const dateStr = this.formatDate(currentDate);
      const log = logsByDate.get(dateStr);

      let nutrition: NutritionData = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      };
      if (log) {
        const allMealItems = log.meals.flatMap((m) => m.mealItems);
        nutrition = this.calculateNutritionFromMealItems(allMealItems);
      }

      result.push({
        date: dateStr,
        label: String(day).padStart(2, '0'),
        ...nutrition,
      });
    }

    return result;
  }

  private async getYearlyTrend(userId: number): Promise<YearData[]> {
    const today = this.toDateOnly(new Date());
    const currentMonth = today.getUTCMonth(); // 0-11
    const result: YearData[] = [];

    for (let i = 0; i <= currentMonth; i++) {
      const monthStart = new Date(Date.UTC(today.getUTCFullYear(), i, 1));
      const monthEnd =
        i === currentMonth
          ? today
          : new Date(Date.UTC(today.getUTCFullYear(), i + 1, 0));

      const dailyLogs = await this.prisma.dailyLog.findMany({
        where: {
          userId,
          logDate: { gte: monthStart, lte: monthEnd },
        },
        include: {
          meals: { include: { mealItems: true } },
        },
      });

      const nutritionData: NutritionData[] = [];
      let daysWithData = 0;

      for (const log of dailyLogs) {
        const allMealItems = log.meals.flatMap((m) => m.mealItems);
        if (allMealItems.length > 0) {
          nutritionData.push(this.calculateNutritionFromMealItems(allMealItems));
          daysWithData++;
        }
      }

      const avg = this.calculateAverage(nutritionData, daysWithData);
      result.push({
        month: this.formatMonth(monthStart),
        label: this.getMonthLabel(monthStart),
        ...avg,
        trend: null,
      });
    }

    // Calculate trend
    for (let i = 1; i < result.length; i++) {
      const prev: NutritionData = {
        calories: result[i - 1].calories,
        protein: result[i - 1].protein,
        carbs: result[i - 1].carbs,
        fat: result[i - 1].fat,
        fiber: result[i - 1].fiber,
      };
      const curr: NutritionData = {
        calories: result[i].calories,
        protein: result[i].protein,
        carbs: result[i].carbs,
        fat: result[i].fat,
        fiber: result[i].fiber,
      };
      result[i].trend = this.calculateTrend(curr, prev);
    }

    return result;
  }

  // ─── Public API: Metric Trend ─────────────────────────────────────────────

  async getMetricTrend(
    userId: number,
    type: TrendType,
    metric: NutritionMetric,
  ): Promise<MetricTrendResult> {
    switch (type) {
      case TrendType.DAY:
        return this.getDailyMetricTrend(userId, metric);
      case TrendType.WEEK:
        return this.getWeeklyMetricTrend(userId, metric);
      case TrendType.MONTH:
        return this.getMonthlyMetricTrend(userId, metric);
      case TrendType.YEAR:
        return this.getYearlyMetricTrend(userId, metric);
      default:
        return {
          type,
          metric,
          range: { start: '', end: '' },
          data: [],
        };
    }
  }

  private async getDailyMetricTrend(
    userId: number,
    metric: NutritionMetric,
  ): Promise<MetricTrendResult> {
    const today = this.toDateOnly(new Date());

    const dailyLog = await this.prisma.dailyLog.findFirst({
      where: { userId, logDate: today },
      include: {
        meals: {
          include: { mealItems: true },
          orderBy: { mealDateTime: 'asc' },
        },
      },
    });

    const data: MetricTrendDataPoint[] = [];

    if (dailyLog) {
      for (const meal of dailyLog.meals) {
        const nutrition = this.calculateNutritionFromMealItems(meal.mealItems);
        data.push({
          label:
            UserReportService.MEAL_TYPE_LABELS[meal.mealType] ?? meal.mealType,
          date: meal.mealDateTime.toISOString(),
          value: Math.round(nutrition[metric] * 100) / 100,
        });
      }
    }

    const summary = this.calculateMetricSummary(data);

    return {
      type: TrendType.DAY,
      metric,
      range: {
        start: this.formatDate(today),
        end: this.formatDate(today),
      },
      data,
      summary,
    };
  }

  private async getWeeklyMetricTrend(
    userId: number,
    metric: NutritionMetric,
  ): Promise<MetricTrendResult> {
    const today = this.toDateOnly(new Date());
    const monday = this.getMondayOfWeek(new Date(today));

    // Get all daily logs for the week
    const dailyLogs = await this.prisma.dailyLog.findMany({
      where: {
        userId,
        logDate: { gte: monday, lte: today },
      },
      include: {
        meals: {
          include: {
            mealItems: true,
          },
        },
      },
      orderBy: { logDate: 'asc' },
    });

    // Create a map of existing logs by date
    const logsByDate = new Map<string, (typeof dailyLogs)[0]>();
    for (const log of dailyLogs) {
      logsByDate.set(this.formatDate(log.logDate), log);
    }

    // Generate data for each day from Monday to today
    const data: MetricTrendDataPoint[] = [];
    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    // Calculate days from Monday to today (0 = Monday, 6 = Sunday)
    const todayDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    const daysFromMonday = todayDayIndex === 0 ? 6 : todayDayIndex - 1;

    for (let i = 0; i <= daysFromMonday; i++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + i);

      // Stop if we've passed today
      if (currentDate > today) break;

      const dateStr = this.formatDate(currentDate);
      const dayIndex = currentDate.getDay();
      const label = dayLabels[dayIndex === 0 ? 6 : dayIndex - 1];

      const log = logsByDate.get(dateStr);
      let value = 0;

      if (log) {
        const allMealItems = log.meals.flatMap((meal) => meal.mealItems);
        const nutrition = this.calculateNutritionFromMealItems(allMealItems);
        value = nutrition[metric];
      }

      data.push({
        label,
        date: dateStr,
        value: Math.round(value * 100) / 100,
      });
    }

    // Calculate summary
    const summary = this.calculateMetricSummary(data);

    return {
      type: TrendType.WEEK,
      metric,
      range: {
        start: this.formatDate(monday),
        end: this.formatDate(today),
      },
      data,
      summary,
    };
  }

  private async getMonthlyMetricTrend(
    userId: number,
    metric: NutritionMetric,
  ): Promise<MetricTrendResult> {
    const today = this.toDateOnly(new Date());
    const monthStart = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
    );

    // Get all daily logs for the month
    const dailyLogs = await this.prisma.dailyLog.findMany({
      where: {
        userId,
        logDate: { gte: monthStart, lte: today },
      },
      include: {
        meals: {
          include: {
            mealItems: true,
          },
        },
      },
      orderBy: { logDate: 'asc' },
    });

    // Create a map of existing logs by date
    const logsByDate = new Map<string, (typeof dailyLogs)[0]>();
    for (const log of dailyLogs) {
      logsByDate.set(this.formatDate(log.logDate), log);
    }

    // Generate data for each day from 1st to today
    const data: MetricTrendDataPoint[] = [];
    const currentDay = today.getDate();

    for (let day = 1; day <= currentDay; day++) {
      const currentDate = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), day),
      );
      const dateStr = this.formatDate(currentDate);
      const label = String(day).padStart(2, '0');

      const log = logsByDate.get(dateStr);
      let value = 0;

      if (log) {
        const allMealItems = log.meals.flatMap((meal) => meal.mealItems);
        const nutrition = this.calculateNutritionFromMealItems(allMealItems);
        value = nutrition[metric];
      }

      data.push({
        label,
        date: dateStr,
        value: Math.round(value * 100) / 100,
      });
    }

    // Calculate summary
    const summary = this.calculateMetricSummary(data);

    return {
      type: TrendType.MONTH,
      metric,
      range: {
        start: this.formatDate(monthStart),
        end: this.formatDate(today),
      },
      data,
      summary,
    };
  }

  private async getYearlyMetricTrend(
    userId: number,
    metric: NutritionMetric,
  ): Promise<MetricTrendResult> {
    const today = this.toDateOnly(new Date());
    const yearStart = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
    const currentMonth = today.getUTCMonth(); // 0-11

    const data: MetricTrendDataPoint[] = [];

    for (let i = 0; i <= currentMonth; i++) {
      const monthStart = new Date(Date.UTC(today.getUTCFullYear(), i, 1));
      const monthEnd =
        i === currentMonth
          ? today
          : new Date(Date.UTC(today.getUTCFullYear(), i + 1, 0));

      const dailyLogs = await this.prisma.dailyLog.findMany({
        where: {
          userId,
          logDate: { gte: monthStart, lte: monthEnd },
        },
        include: {
          meals: { include: { mealItems: true } },
        },
      });

      const nutritionData: NutritionData[] = [];
      let daysWithData = 0;

      for (const log of dailyLogs) {
        const allMealItems = log.meals.flatMap((m) => m.mealItems);
        if (allMealItems.length > 0) {
          nutritionData.push(this.calculateNutritionFromMealItems(allMealItems));
          daysWithData++;
        }
      }

      const avg = this.calculateAverage(nutritionData, daysWithData);

      data.push({
        label: this.getMonthLabel(monthStart),
        date: this.formatMonth(monthStart),
        value: Math.round(avg[metric] * 100) / 100,
      });
    }

    const summary = this.calculateMetricSummary(data);

    return {
      type: TrendType.YEAR,
      metric,
      range: {
        start: this.formatDate(yearStart),
        end: this.formatDate(today),
      },
      data,
      summary,
    };
  }

  private calculateMetricSummary(data: MetricTrendDataPoint[]): {
    average: number;
    trend: number;
    trendDirection: 'up' | 'down' | 'stable';
  } {
    if (data.length === 0) {
      return { average: 0, trend: 0, trendDirection: 'stable' };
    }

    // Calculate average
    const total = data.reduce((sum, point) => sum + point.value, 0);
    const average = Math.round((total / data.length) * 100) / 100;

    // Calculate trend (last day vs previous day)
    let trend = 0;
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';

    if (data.length >= 2) {
      const lastValue = data[data.length - 1].value;
      const prevValue = data[data.length - 2].value;
      trend = Math.round((lastValue - prevValue) * 100) / 100;

      if (trend > 0) trendDirection = 'up';
      else if (trend < 0) trendDirection = 'down';
      else trendDirection = 'stable';
    }

    return { average, trend, trendDirection };
  }
}
