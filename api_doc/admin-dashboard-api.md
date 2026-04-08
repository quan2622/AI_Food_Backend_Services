# Admin API — Dashboard tổng quan

API phục vụ **màn dashboard** quản trị: KPI, biểu đồ hoạt động, cảnh báo, dinh dưỡng cộng đồng, top món, phân bổ mục tiêu, user mới và hàng đợi nội dung.

**Tiền tố:** `/api/v1` — xem [README.md](./README.md).

**Base path:** `/admin/dashboard`

**Bảo vệ:** toàn bộ route dùng **`AdminGuard`** (JWT + `isAdmin: true`). Vẫn chịu **`JwtAuthGuard`** toàn cục — cần đăng nhập.

---

## Mục lục

1. [Tổng hợp một lần (`overview`)](#1-tổng-hợp-một-lần-overview)
2. [Nhóm 1 — KPI](#2-nhóm-1--kpi)
3. [Nhóm 2 — Hoạt động + cảnh báo](#3-nhóm-2--hoạt-động--cảnh-báo)
4. [Nhóm 3 — Dinh dưỡng nền tảng](#4-nhóm-3--dinh-dưỡng-nền-tảng)
5. [Nhóm 4 — Top món & mục tiêu](#5-nhóm-4--top-món--mục-tiêu)
6. [Nhóm 5 — User mới & nội dung](#6-nhóm-5--user-mới--nội-dung)
7. [Giới hạn dữ liệu & mở rộng](#7-giới-hạn-dữ-liệu--mở-rộng)

---

## 1. Tổng hợp một lần (`overview`)

```
GET /admin/dashboard/overview
```

Trả về **cả 5 nhóm** trong một JSON (tiện cho trang chủ dashboard).

**Response (khung logic):**

| Khóa | Mô tả |
|------|--------|
| `EC` | `0` |
| `EM` | Thông báo thành công |
| `asOf` | ISO timestamp |
| `kpi` | Giống [§2](#2-nhóm-1--kpi) |
| `activityAndAlerts` | Giống [§3](#3-nhóm-2--hoạt-động--cảnh-báo) |
| `nutritionPlatform` | Giống [§4](#4-nhóm-3--dinh-dưỡng-nền-tảng) |
| `foodsAndGoals` | Giống [§5](#5-nhóm-4--top-món--mục-tiêu) |
| `usersAndContent` | Giống [§6](#6-nhóm-5--user-mới--nội-dung) |

---

## 2. Nhóm 1 — KPI

```
GET /admin/dashboard/kpi
```

**Ý nghĩa nghiệp vụ:** tổng user (không tính admin), user có ghi nhận bữa **trong ngày UTC hôm nay / hôm qua**, số **bữa ăn (meal)** trong **7 ngày trượt** so với **7 ngày trượt trước đó**, user mới đăng ký cùng hai cửa sổ đó.

**Response (các field chính):**

| Field | Mô tả |
|-------|--------|
| `asOf` | Thời điểm tính toán |
| `totalUsers` | Số user `isAdmin === false` |
| `activeUsersToday` | Số user (không admin) có ít nhất một meal trong ngày UTC hiện tại |
| `activeUsersYesterday` | Tương tự cho ngày UTC hôm qua |
| `activeUsersChangePercent` | `%` thay đổi today vs yesterday (`null` nếu không xác định) |
| `mealsLoggedLast7Days` | Số bản ghi `Meal` trong [now−7d, now] |
| `mealsLoggedPrevious7Days` | Số `Meal` trong [now−14d, now−7d) |
| `mealsChangePercent` | `%` so với kỳ trước |
| `newUsersLast7Days` | User mới (`createdAt` trong [now−7d, now]) |
| `newUsersPrevious7Days` | User mới trong kỳ trước |
| `newUsersChangePercent` | `%` so với kỳ trước |

---

## 3. Nhóm 2 — Hoạt động + cảnh báo

```
GET /admin/dashboard/activity?days=14
```

| Query | Mặc định | Giới hạn |
|-------|----------|----------|
| `days` | `14` | 1–90 |

**`series`:** mỗi phần tử `{ date: "YYYY-MM-DD", activeUsers }` — số user **không admin** có ít nhất một meal trong ngày UTC đó (trong khoảng `days` ngày kể từ đầu ngày UTC hiện tại lùi về).

**`alerts`:** mảng object gợi ý xử lý (động theo DB):

| `type` (ví dụ) | Nội dung |
|----------------|----------|
| `FOOD_MISSING_NUTRITION` | Số `Food` chưa có `FoodNutritionProfile` |
| `AI_TRAINING_SUCCESS` | Job huấn luyện AI gần nhất đã `finishedAt` (nếu có) |
| `FEATURE_ROADMAP` | Ghi chú: báo cáo sai món từ user — **chưa có bảng** trong schema hiện tại |

Mỗi alert: `id`, `severity` (`info` \| `warning` \| `critical`), `title`, `detail?`, `count?`.

---

## 4. Nhóm 3 — Dinh dưỡng nền tảng

```
GET /admin/dashboard/nutrition-platform
```

**Cửa sổ:** 7 ngày trượt `[now−7d, now]`, chỉ meal của user **không admin**.

**Công thức tóm tắt:**

- **Thực tế (trung bình / “user-ngày” có bữa):** tổng `calories` / `protein` / … từ `MealItem` chia cho số cặp **DISTINCT (`userId`, ngày UTC)** có ít nhất một meal trong cửa sổ.
- **Khuyến nghị:** trung bình `targetCalories` / `targetProtein` / … của các `NutritionGoal` **ongoing** (`NUTR_GOAL_ONGOING`, `startDate ≤ now ≤ endDate`, user không admin).

**`metrics`:** mảng `{ key, labelKey, actualDailyAverage, recommendedAverage, percentOfRecommended }` cho `calories`, `protein`, `carbs`, `fat`, `fiber`.

**Field bổ trợ:** `distinctUserDaysWithMeals`, `ongoingGoalsSampleSize`, `period.from` / `period.to` / `period.note`.

---

## 5. Nhóm 4 — Top món & mục tiêu

```
GET /admin/dashboard/foods-goals?top=10
```

| Query | Mặc định | Giới hạn |
|-------|----------|----------|
| `top` | `10` | 1–50 |

**`topFoods`:** trong **30 ngày trượt** (`now−30d` → `now`), nhóm `MealItem` theo `foodId`, sắp theo số lần xuất hiện; kèm `food.foodName`, `imageUrl`.

**`goalTypeBreakdown`:** `groupBy` `NutritionGoal.goalType` với user không admin, goal **ongoing** (`startDate ≤ now ≤ endDate`, status `NUTR_GOAL_ONGOING`). Mỗi dòng: `goalType`, `count`, `percentOfTotal`.

**`ongoingGoalsTotal`:** tổng số goal trong phân nhóm trên.

---

## 6. Nhóm 5 — User mới & nội dung

```
GET /admin/dashboard/users-content?newUsers=10&sample=8
```

| Query | Mặc định | Giới hạn |
|-------|----------|----------|
| `newUsers` | `10` | 1–50 |
| `sample` | `8` | 1–30 |

**`newUsers`:** danh sách user mới nhất (`isAdmin === false`), `id`, `email`, `fullName`, `accountActive` (lấy từ `users.status`), `createdAt`.

**`newUsersNote`:** giải thích `accountActive`; schema **chưa có** cờ xác minh email riêng.

**`contentQueue`:**

- `foodsMissingNutritionProfile`: `total` + `sample` (món chưa có profile dinh dưỡng).
- `reportedFoods`: hiện `total: 0`, `items: []` + `note` — **chưa có** entity báo cáo món trong DB.

---

## 7. Giới hạn dữ liệu & mở rộng

- Mọi thống kê user **loại trừ** `isAdmin === true`.
- **Báo cáo sai dữ liệu món / ticket kiểm duyệt:** cần bổ sung model (ví dụ bảng report) rồi mở rộng `buildAlerts()` và `contentQueue.reportedFoods`.
- Response có thể được bọc thêm `metadata` / `data` bởi interceptor toàn cục — xem [README.md](./README.md).

---

*Document version: 1.0*  
*Last updated: April 2026*
