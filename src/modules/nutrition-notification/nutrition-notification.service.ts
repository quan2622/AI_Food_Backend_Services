import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DailyLogService } from '../daily-log/daily-log.service';

// ─── Notification Templates ─────────────────────────────────────────────────

/** Thời điểm trong ngày */
type TimeOfDay = 'morning' | 'midday' | 'afternoon' | 'evening';

/** Trạng thái dinh dưỡng tổng thể */
type NutritionStatus = 'no_meals' | 'low' | 'moderate' | 'on_track' | 'over';

interface NutrientDeficiency {
  name: string;          // tên vi chất: calories, protein, carbs, fat, fiber
  label: string;         // tên hiển thị tiếng Việt
  current: number;
  target: number;
  remaining: number;
  percentAchieved: number;
}

interface NotificationTemplate {
  mainMessage: string;
  subMessage: string;
}

/**
 * Template tĩnh — dùng làm fallback khi Gemini API không khả dụng.
 * Kết quả luôn nhất quán và có thể kiểm soát nội dung.
 */
const TEMPLATES: Record<TimeOfDay, Record<NutritionStatus, (ctx: TemplateContext) => NotificationTemplate>> = {
  morning: {
    no_meals: (_ctx) => ({
      mainMessage: 'Bạn chưa ghi nhận bữa sáng hôm nay',
      subMessage: 'Hãy bắt đầu ngày mới với một bữa sáng giàu protein và chất xơ để duy trì năng lượng.',
    }),
    low: (ctx) => ({
      mainMessage: `Bạn mới nạp ${ctx.caloriesPercent}% lượng calories mục tiêu`,
      subMessage: `Hãy bổ sung thêm ${ctx.topDeficiencies} trong bữa trưa để cân bằng dinh dưỡng.`,
    }),
    moderate: (ctx) => ({
      mainMessage: `Buổi sáng tốt! Đã đạt ${ctx.caloriesPercent}% mục tiêu calories`,
      subMessage: `Tiếp tục duy trì, chú ý bổ sung ${ctx.topDeficiencies} trong các bữa tiếp theo.`,
    }),
    on_track: (_ctx) => ({
      mainMessage: 'Buổi sáng tuyệt vời! Dinh dưỡng đang đúng hướng',
      subMessage: 'Giữ nhịp ăn uống cân bằng trong ngày nhé.',
    }),
    over: (ctx) => ({
      mainMessage: `Lưu ý: Đã vượt ${ctx.overPercent}% mục tiêu calories chỉ trong buổi sáng`,
      subMessage: 'Hãy điều chỉnh khẩu phần bữa trưa và tối nhẹ nhàng hơn.',
    }),
  },
  midday: {
    no_meals: (_ctx) => ({
      mainMessage: 'Đã gần trưa mà bạn chưa ghi nhận bữa ăn nào',
      subMessage: 'Bỏ bữa lâu dài ảnh hưởng trao đổi chất. Hãy ăn một bữa cân bằng sớm nhé.',
    }),
    low: (ctx) => ({
      mainMessage: `Mới đạt ${ctx.caloriesPercent}% mục tiêu — cần bổ sung nhiều hơn`,
      subMessage: `Ưu tiên bổ sung ${ctx.topDeficiencies} trong bữa trưa.`,
    }),
    moderate: (ctx) => ({
      mainMessage: `Đã đạt ${ctx.caloriesPercent}% mục tiêu calories — tiến độ tốt`,
      subMessage: `Chú ý thêm ${ctx.topDeficiencies} cho bữa tối để hoàn thành mục tiêu.`,
    }),
    on_track: (_ctx) => ({
      mainMessage: 'Tuyệt vời! Dinh dưỡng đang cân bằng tốt',
      subMessage: 'Bữa tối nên giữ nhẹ nhàng để duy trì trạng thái này.',
    }),
    over: (ctx) => ({
      mainMessage: `Đã vượt mục tiêu calories ${ctx.overPercent}%`,
      subMessage: 'Bữa tối nên ăn nhẹ, ưu tiên rau xanh và protein nạc.',
    }),
  },
  afternoon: {
    no_meals: (_ctx) => ({
      mainMessage: 'Chiều rồi mà bạn chưa ghi nhận bữa ăn nào trong ngày',
      subMessage: 'Hãy ăn một bữa đầy đủ dinh dưỡng ngay bây giờ để bù đắp.',
    }),
    low: (ctx) => ({
      mainMessage: `Chỉ mới đạt ${ctx.caloriesPercent}% mục tiêu — còn thiếu khá nhiều`,
      subMessage: `Cần bổ sung ${ctx.topDeficiencies}. Một bữa phụ giàu dinh dưỡng sẽ rất hữu ích.`,
    }),
    moderate: (ctx) => ({
      mainMessage: `Đã đạt ${ctx.caloriesPercent}% — gần hoàn thành mục tiêu`,
      subMessage: `Bữa tối bổ sung thêm ${ctx.topDeficiencies} để đạt 100%.`,
    }),
    on_track: (_ctx) => ({
      mainMessage: 'Dinh dưỡng hôm nay đang rất tốt!',
      subMessage: 'Bữa tối giữ nhẹ và cân bằng là hoàn hảo.',
    }),
    over: (ctx) => ({
      mainMessage: `Đã vượt mục tiêu ${ctx.overPercent}% — hãy chú ý`,
      subMessage: 'Bữa tối nên ăn ít, tập trung vào rau xanh. Cân nhắc đi bộ nhẹ sau ăn.',
    }),
  },
  evening: {
    no_meals: (_ctx) => ({
      mainMessage: 'Gần hết ngày mà chưa có bữa ăn nào được ghi nhận',
      subMessage: 'Nếu bạn đã ăn, hãy ghi lại. Nếu chưa, một bữa tối nhẹ nhàng vẫn tốt hơn bỏ bữa.',
    }),
    low: (ctx) => ({
      mainMessage: `Cuối ngày chỉ đạt ${ctx.caloriesPercent}% mục tiêu — thiếu hụt dinh dưỡng`,
      subMessage: `Vẫn thiếu ${ctx.topDeficiencies}. Hãy ăn bữa tối đầy đủ để bù lại.`,
    }),
    moderate: (ctx) => ({
      mainMessage: `Đạt ${ctx.caloriesPercent}% mục tiêu — gần hoàn thành`,
      subMessage: `Một bữa phụ nhẹ bổ sung ${ctx.topDeficiencies} sẽ giúp đạt mục tiêu.`,
    }),
    on_track: (_ctx) => ({
      mainMessage: 'Hoàn thành mục tiêu dinh dưỡng hôm nay — xuất sắc!',
      subMessage: 'Hãy nghỉ ngơi tốt để cơ thể hấp thu dinh dưỡng hiệu quả.',
    }),
    over: (ctx) => ({
      mainMessage: `Hôm nay đã vượt mục tiêu calories ${ctx.overPercent}%`,
      subMessage: 'Không sao, ngày mai điều chỉnh lại. Tránh ăn thêm trước khi ngủ.',
    }),
  },
};

interface TemplateContext {
  caloriesPercent: number;
  overPercent: number;
  topDeficiencies: string; // e.g. "protein và chất xơ"
}

// ─── Service ─────────────────────────────────────────────────────────────────

/** Cache entry cho Gemini response — hết hạn theo timeOfDay để tự refresh khi sang khung giờ mới */
interface GeminiCacheEntry {
  notification: NotificationTemplate;
  timeOfDay: TimeOfDay;
  dateKey: string; // YYYY-MM-DD
  expiresAt: number; // epoch ms
}

/** Cache TTL theo khung giờ (ms) */
const GEMINI_CACHE_TTL_MS = 30 * 60 * 1000; // 30 phút

@Injectable()
export class NutritionNotificationService {
  private readonly logger = new Logger(NutritionNotificationService.name);
  private genAI: GoogleGenerativeAI | null = null;
  /** In-memory cache: key = `${userId}:${dateKey}:${timeOfDay}` */
  private readonly geminiCache = new Map<string, GeminiCacheEntry>();

  constructor(
    private readonly configService: ConfigService,
    private readonly dailyLogService: DailyLogService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn(
        'GEMINI_API_KEY chưa được cấu hình — sẽ sử dụng template tĩnh cho thông báo.',
      );
    }
  }

  // ─── Public ─────────────────────────────────────────────────────────────

  async generateTodayNotification(userId: number) {
    // 1. Lấy daily log hôm nay (có totals + nutritionGoal)
    const dailyData = await this.dailyLogService.getOrCreateForDate(
      userId,
      new Date(),
    );

    const totals = (dailyData as any).totals as {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
    };

    const goal = (dailyData as any).nutritionGoal as {
      targetCalories: number;
      targetProtein: number;
      targetCarbs: number;
      targetFat: number;
      targetFiber: number;
      goalType: string;
    } | null;

    if (!goal) {
      return {
        EC: 0,
        EM: 'Nutrition notification generated',
        result: {
          mainMessage: 'Chưa có mục tiêu dinh dưỡng',
          subMessage: 'Hãy thiết lập mục tiêu dinh dưỡng để nhận gợi ý cá nhân hóa.',
          totals,
          nutritionGoal: null,
          deficiencies: [],
          status: 'no_goal' as const,
          timeOfDay: this.getTimeOfDay(),
          generatedAt: new Date().toISOString(),
        },
      };
    }

    // 2. Tính toán thiếu hụt
    const deficiencies = this.computeDeficiencies(totals, goal);
    const timeOfDay = this.getTimeOfDay();
    const status = this.computeNutritionStatus(totals, goal);
    const templateCtx = this.buildTemplateContext(totals, goal, deficiencies);

    // 3. Tạo thông báo template (luôn có sẵn)
    const templateNotification = TEMPLATES[timeOfDay][status](templateCtx);

    // 4. Thử dùng Gemini để sinh thông báo thông minh hơn
    let notification = templateNotification;
    if (this.genAI) {
      const dateKey = new Date().toISOString().slice(0, 10);
      const cacheKey = `${userId}:${dateKey}:${timeOfDay}`;
      const cached = this.geminiCache.get(cacheKey);

      if (cached && cached.expiresAt > Date.now()) {
        notification = cached.notification;
      } else {
        try {
          notification = await this.generateWithGemini(
            totals,
            goal,
            deficiencies,
            timeOfDay,
            status,
            (dailyData as any).meals ?? [],
          );
          this.geminiCache.set(cacheKey, {
            notification,
            timeOfDay,
            dateKey,
            expiresAt: Date.now() + GEMINI_CACHE_TTL_MS,
          });
        } catch (error) {
          const is429 = (error as any)?.message?.includes('429') || (error as any)?.status === 429;
          if (is429) {
            this.logger.warn(
              'Gemini API rate limit (429) — fallback về template tĩnh.',
            );
          } else {
            this.logger.error(
              `Gemini API lỗi, fallback về template: ${(error as Error).message}`,
            );
          }
          // Giữ templateNotification
        }
      }
    }

    return {
      EC: 0,
      EM: 'Nutrition notification generated',
      result: {
        mainMessage: notification.mainMessage,
        subMessage: notification.subMessage,
        totals,
        nutritionGoal: {
          targetCalories: goal.targetCalories,
          targetProtein: goal.targetProtein,
          targetCarbs: goal.targetCarbs,
          targetFat: goal.targetFat,
          targetFiber: goal.targetFiber,
          goalType: goal.goalType,
        },
        deficiencies: deficiencies.map((d) => ({
          name: d.name,
          label: d.label,
          current: d.current,
          target: d.target,
          remaining: d.remaining,
          percentAchieved: d.percentAchieved,
        })),
        status,
        timeOfDay,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private getTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();
    if (hour < 11) return 'morning';
    if (hour < 14) return 'midday';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  private computeNutritionStatus(
    totals: { calories: number },
    goal: { targetCalories: number },
  ): NutritionStatus {
    if (totals.calories === 0) return 'no_meals';
    const percent = (totals.calories / goal.targetCalories) * 100;
    if (percent > 110) return 'over';
    if (percent >= 85) return 'on_track';
    if (percent >= 50) return 'moderate';
    return 'low';
  }

  private computeDeficiencies(
    totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number },
    goal: { targetCalories: number; targetProtein: number; targetCarbs: number; targetFat: number; targetFiber: number },
  ): NutrientDeficiency[] {
    const nutrients: { name: string; label: string; current: number; target: number }[] = [
      { name: 'calories', label: 'Calories', current: totals.calories, target: goal.targetCalories },
      { name: 'protein', label: 'Protein', current: totals.protein, target: goal.targetProtein },
      { name: 'carbs', label: 'Carbs', current: totals.carbs, target: goal.targetCarbs },
      { name: 'fat', label: 'Chất béo', current: totals.fat, target: goal.targetFat },
      { name: 'fiber', label: 'Chất xơ', current: totals.fiber, target: goal.targetFiber },
    ];

    return nutrients
      .filter((n) => n.target > 0 && n.current < n.target)
      .map((n) => ({
        ...n,
        remaining: Math.round((n.target - n.current) * 10) / 10,
        percentAchieved: Math.round((n.current / n.target) * 1000) / 10,
      }))
      .sort((a, b) => a.percentAchieved - b.percentAchieved);
  }

  private buildTemplateContext(
    totals: { calories: number },
    goal: { targetCalories: number },
    deficiencies: NutrientDeficiency[],
  ): TemplateContext {
    const caloriesPercent = Math.round(
      (totals.calories / goal.targetCalories) * 100,
    );
    const overPercent = Math.max(0, caloriesPercent - 100);

    const topLabels = deficiencies
      .slice(0, 2)
      .map((d) => d.label.toLowerCase());
    const topDeficiencies =
      topLabels.length === 0
        ? 'các chất dinh dưỡng'
        : topLabels.length === 1
          ? topLabels[0]
          : `${topLabels.slice(0, -1).join(', ')} và ${topLabels[topLabels.length - 1]}`;

    return { caloriesPercent, overPercent, topDeficiencies };
  }

  // ─── Gemini AI ─────────────────────────────────────────────────────────────

  private async generateWithGemini(
    totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number },
    goal: { targetCalories: number; targetProtein: number; targetCarbs: number; targetFat: number; targetFiber: number; goalType: string },
    deficiencies: NutrientDeficiency[],
    timeOfDay: TimeOfDay,
    status: NutritionStatus,
    meals: any[],
  ): Promise<NotificationTemplate> {
    const model = this.genAI!.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const timeLabels: Record<TimeOfDay, string> = {
      morning: 'buổi sáng (trước 11h)',
      midday: 'buổi trưa (11h-14h)',
      afternoon: 'buổi chiều (14h-17h)',
      evening: 'buổi tối (sau 17h)',
    };

    const statusLabels: Record<NutritionStatus, string> = {
      no_meals: 'chưa ăn gì',
      low: 'thiếu hụt nhiều',
      moderate: 'đạt một phần',
      on_track: 'đúng mục tiêu',
      over: 'vượt mục tiêu',
    };

    const deficiencyInfo =
      deficiencies.length > 0
        ? deficiencies
            .map(
              (d) =>
                `- ${d.label}: đạt ${d.percentAchieved}% (${d.current}/${d.target}), thiếu ${d.remaining}`,
            )
            .join('\n')
        : 'Không thiếu hụt dinh dưỡng đáng kể.';

    const mealSummary =
      meals.length > 0
        ? meals
            .map((m: any) => {
              const items =
                m.mealItems
                  ?.map((i: any) => i.food?.foodName ?? 'món ăn')
                  .join(', ') ?? '';
              return `${m.mealType}: ${items}`;
            })
            .join('; ')
        : 'Chưa có bữa ăn nào.';

    const prompt = `Bạn là trợ lý dinh dưỡng trong ứng dụng theo dõi sức khỏe ăn uống.
Hãy tạo một thông báo ngắn gọn, thân thiện bằng tiếng Việt.

THÔNG TIN:
- Thời điểm: ${timeLabels[timeOfDay]}
- Trạng thái: ${statusLabels[status]}
- Mục tiêu: ${goal.goalType}
- Calories hiện tại: ${totals.calories}/${goal.targetCalories} kcal
- Protein: ${totals.protein}/${goal.targetProtein}g
- Carbs: ${totals.carbs}/${goal.targetCarbs}g
- Chất béo: ${totals.fat}/${goal.targetFat}g
- Chất xơ: ${totals.fiber}/${goal.targetFiber}g
- Các bữa đã ăn: ${mealSummary}

THIẾU HỤT:
${deficiencyInfo}

YÊU CẦU:
1. Trả về JSON duy nhất với format: {"mainMessage": "...", "subMessage": "..."}
2. mainMessage (tối đa 60 ký tự): Thông báo chính về trạng thái dinh dưỡng hiện tại.
3. subMessage (tối đa 100 ký tự): Gợi ý cụ thể, ngắn gọn về ăn uống hoặc bổ sung.
4. Giọng điệu: thân thiện, khích lệ, không phán xét.
5. CHỈ trả về JSON, không thêm markdown hay text khác.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse JSON từ response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Gemini response không chứa JSON hợp lệ');
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      mainMessage?: string;
      subMessage?: string;
    };

    if (!parsed.mainMessage || !parsed.subMessage) {
      throw new Error('Gemini response thiếu mainMessage hoặc subMessage');
    }

    return {
      mainMessage: String(parsed.mainMessage),
      subMessage: String(parsed.subMessage),
    };
  }
}
