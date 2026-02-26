# DailyLog Module — Implementation Plan

## Mục tiêu

Implement module `DailyLog` — lưu trữ kết quả dinh dưỡng đã được cộng dồn theo từng ngày của mỗi user, tránh query lại toàn bộ Meal/MealItem mỗi lần mở app. Hỗ trợ báo cáo thống kê theo tuần/tháng.

---

## 1. Prisma Schema

**File:** `prisma/schema.prisma`

### Model mới: `DailyLog`

```prisma
model DailyLog {
  id             Int      @id @default(autoincrement())
  logDate        DateTime @db.Date          // Chỉ lưu ngày, không có giờ
  totalCalories  Float    @default(0)
  totalProtein   Float    @default(0)
  totalCarbs     Float    @default(0)
  totalFat       Float    @default(0)
  targetCalories Float    @default(0)
  targetProtein  Float    @default(0)
  targetCarbs    Float    @default(0)
  status         String   @default("BELOW") // BELOW | MET | ABOVE
  userId         Int
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([userId, logDate])
  @@map("daily_logs")
}
```

### Thêm relation vào `User`

```prisma
dailyLogs DailyLog[]
```

### Migration

```bash
npx prisma migrate dev --name add_daily_log_model
npx prisma generate
```

---

## 2. Cấu trúc thư mục

```
src/modules/daily-log/
├── dto/
│   ├── create-daily-log.dto.ts
│   └── update-daily-log.dto.ts
├── daily-log.service.ts
├── daily-log.controller.ts
└── daily-log.module.ts
```

---

## 3. Service: `DailyLogService`

### Interface delta

```typescript
export interface NutritionDelta {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
```

### Logic status

| Điều kiện                             | Status  |
| ------------------------------------- | ------- |
| `totalCalories < targetCalories - 50` | `BELOW` |
| `abs(diff) ≤ 50`                      | `MET`   |
| `totalCalories > targetCalories + 50` | `ABOVE` |

> Tolerance ±50 calo để tránh bị phạt khi chỉ lệch nhỏ.

### Các method chính

| Method                                   | Mô tả                                                      |
| ---------------------------------------- | ---------------------------------------------------------- |
| `getOrCreateForDate(userId, date)`       | Tìm hoặc tạo DailyLog, copy target từ NutritionGoal active |
| `getOrCreateToday(userId)`               | Gọi `getOrCreateForDate` với ngày hôm nay (UTC+7)          |
| `addNutrition(userId, date, delta)`      | Upsert + cộng dồn + cập nhật status                        |
| `subtractNutrition(userId, date, delta)` | Trừ dinh dưỡng + cập nhật status                           |
| `findAllByUserId(userId)`                | Tất cả log của user                                        |
| `findByDate(userId, dateStr)`            | Log theo ngày `YYYY-MM-DD`                                 |
| `findWeeklySummary(userId)`              | 7 ngày gần nhất                                            |
| `findAll()`                              | (Admin) Tất cả log                                         |
| `findOne(id)`                            | (Admin) Log theo id                                        |

### Lấy target từ NutritionGoal

```typescript
// Tìm goal đang active tại ngày logDate
const goal = await prisma.nutritionGoal.findFirst({
  where: {
    userId,
    startDate: { lte: date },
    endDate: { gte: date },
  },
  orderBy: { createdAt: 'desc' },
});
targetCalories = goal?.targetCaloriesPerDay ?? 0;
```

> Ghi chú: Schema `NutritionGoal` hiện chỉ có `targetCaloriesPerDay`.  
> `targetProtein` và `targetCarbs` trong DailyLog được để `0` cho đến khi NutritionGoal được mở rộng.

---

## 4. Controller: `DailyLogController`

**Base route:** `/daily-logs`

| Method | Route     | Guard | Mô tả                        |
| ------ | --------- | ----- | ---------------------------- |
| `GET`  | `/today`  | JWT   | Lấy/tạo log hôm nay          |
| `GET`  | `/weekly` | JWT   | 7 ngày gần nhất              |
| `GET`  | `/`       | JWT   | Tất cả log của user          |
| `GET`  | `/all`    | Admin | Tất cả user                  |
| `GET`  | `/id/:id` | Admin | Log theo ID                  |
| `GET`  | `/:date`  | JWT   | Log theo ngày (`YYYY-MM-DD`) |

---

## 5. Tích hợp với MealItemService

Mỗi khi user thêm/sửa/xóa `MealItem`, `MealItemService` sẽ tự động gọi `DailyLogService`:

| Action            | Gọi method                                          |
| ----------------- | --------------------------------------------------- |
| `create` MealItem | `addNutrition(userId, meal.mealDateTime, delta)`    |
| `update` MealItem | `subtractNutrition(old)` → `addNutrition(new)`      |
| `remove` MealItem | `subtractNutrition(userId, meal.mealDateTime, old)` |

**DI wiring:**

- `DailyLogModule` exports `DailyLogService`
- `MealItemModule` imports `DailyLogModule`

---

## 6. Đăng ký module

**`src/app.module.ts`:**

```typescript
import { DailyLogModule } from './modules/daily-log/daily-log.module';

@Module({
  imports: [
    // ... các module khác
    DailyLogModule,
  ],
})
export class AppModule {}
```

---

## 7. Vòng đời DailyLog trong hệ thống

```
[Ngày mới] ──▶ getOrCreateForDate()
                  ├── Tạo DailyLog mới (total=0, copy targets từ NutritionGoal)
                  └── Trả về record hiện có nếu đã tồn tại

[Ăn sáng] ──▶ MealItemService.create()
                  └── dailyLogService.addNutrition()
                        ├── increment totalCalories, totalProtein, totalCarbs, totalFat
                        └── recalc status (BELOW / MET / ABOVE)

[Xóa item] ──▶ MealItemService.remove()
                  └── dailyLogService.subtractNutrition()
                        ├── decrement totals
                        └── recalc status
```

---

## 8. Verification

```bash
# Biên dịch TypeScript
npx tsc --noEmit          # ✅ 0 errors

# Migration
npx prisma migrate dev    # ✅ Applied

# Prisma Client
npx prisma generate       # ✅ DailyLog model available
```
