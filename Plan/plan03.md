---
name: verify-nutrition-backend-plan
overview: Đối chiếu plan chỉnh sửa backend NestJS + Prisma cho dự án AI Nutrition Analysis với code hiện tại, xác nhận điểm đúng và chỉ ra chỗ lệch cần điều chỉnh trước khi implement.
todos:
  - id: verify-food-module
    content: 'Đối chiếu module Food (schema + DTO + service) với plan: xác nhận thiếu fiber và dư category string'
    status: completed
  - id: verify-nutrition-goal-module
    content: Xác nhận NutritionGoal chỉ có targetCaloriesPerDay và chưa có macro targets khác
    status: in_progress
  - id: verify-daily-log-module
    content: Kiểm tra DailyLog (schema + service) về target macros và fiber so với plan
    status: pending
  - id: verify-food-image-module
    content: Kiểm tra quan hệ FoodImage hiện tại (Meal vs MealItem) so với plan
    status: pending
  - id: verify-user-profile-module
    content: Kiểm tra User/UserProfile về gender, activityLevel, BMR/TDEE logic so với plan
    status: pending
  - id: verify-meal-item-module
    content: Kiểm tra MealItem + DailyLogService.NutritionDelta về việc chưa track fiber
    status: pending
isProject: false
---

### Xác nhận tổng quan

- **Kết luận chung**: Plan của bạn bám rất sát trạng thái hiện tại của codebase. Các nhận định về thiếu macro target, thiếu fiber, quan hệ FoodImage, và thiếu gender/activityLevel trong UserProfile **đa số là chính xác**.
- **Điểm cần chỉnh lại nhẹ**:
  - `DailyLog` hiện **chỉ có** `targetCalories`, `targetProtein`, `targetCarbs` – **chưa có** cột `targetFat`. Việc thêm `targetFat` là hợp lý nhưng đang ở dạng đề xuất, chưa tồn tại trong schema.
  - Đoạn mô tả "DailyLog có 3 trường `targetProtein`, `targetCarbs`, `targetFat`" nên sửa thành: có 2 trường `targetProtein`, `targetCarbs`, và **sẽ thêm mới** `targetFat`.

### 1. Module Food

- **Trạng thái thực tế**
  - `model Food` có: `protein`, `carbs`, `fat`, `calories` nhưng **không có** `fiber`.
  - Vẫn còn trường `category: String` song song với `categoryId` + relation `foodCategory`.
  - Service/DTO (`CreateFoodDto`, `UpdateFoodDto`, `FoodService`) chỉ xử lý `protein`, `carbs`, `fat`, `calories`, không có `fiber`.
- **So với plan**
  - **Đúng**: Cần **thêm** `fiber` vào `Food` + DTO + service.
  - **Đúng**: `category` String là dư thừa về mặt thiết kế so với `categoryId`/`foodCategory`, cần plan migration nếu bạn muốn bỏ.
- **Gợi ý chi tiết khi implement**
  - Migration 1: thêm `foods.fiber Float @default(0)`.
  - Migration 2: script migrate dữ liệu từ `category` string sang `categoryId` (join với `food_categories.name`), sau đó xóa cột `category` và refactor tất cả chỗ dùng `category` string sang `categoryId`/`foodCategory`.

### 2. Module NutritionGoal

- **Trạng thái thực tế**
  - `NutritionGoal` chỉ có `targetCaloriesPerDay` – **không có** `targetProteinPerDay`, `targetCarbsPerDay`, `targetFatPerDay`.
  - DTO/service cũng chỉ nhận & trả `targetCaloriesPerDay`.
- **So với plan**
  - **Đúng**: Nhận định thiếu macro target là chính xác.
  - **Đúng**: Đề xuất thêm 3 trường macro (`targetProteinPerDay`, `targetCarbsPerDay`, `targetFatPerDay`) + cập nhật DTO/service là hợp lý với nghiệp vụ "so sánh với chỉ tiêu macro".
- **Gợi ý khi implement**
  - Thêm 3 cột `Float @default(0)` trong schema và expose tương ứng trong DTO/service.
  - Đảm bảo `DailyLogService.getActiveGoalTargets()` đọc đầy đủ 4 field sau khi bổ sung.

### 3. Module DailyLog

- **Trạng thái thực tế**
  - `DailyLog` có `totalCalories`, `totalProtein`, `totalCarbs`, `totalFat`, và targets: `targetCalories`, `targetProtein`, `targetCarbs`.
  - Không có `totalFiber`, `targetFiber`, cũng không có `targetFat`.
  - `getActiveGoalTargets()` trả về: `targetCalories` từ goal, còn `targetProtein` và `targetCarbs` bị **hardcode = 0**; không có `targetFat`.
  - `NutritionDelta` chỉ có `calories`, `protein`, `carbs`, `fat` (không có `fiber`).
- **So với plan**
  - **Đúng**: Phần nhận định "target macro không hoạt động vì hardcode = 0" là đúng.
  - **Đúng**: Cần sửa `getActiveGoalTargets()` để đọc từ các field mới trên `NutritionGoal` (sau khi bổ sung) và truyền đầy đủ khi tạo `DailyLog`.
  - **Đúng**: Thiếu `totalFiber` và `targetFiber` nếu bạn muốn cảnh báo thiếu chất xơ.
  - **Cần chỉnh wording**: DailyLog hiện **chưa có** `targetFat`; đây là field bạn **đề xuất thêm**, không phải đang tồn tại.
- **Gợi ý khi implement**
  - Migration: thêm `totalFiber` và `targetFiber` (và nếu muốn thêm luôn `targetFat`).
  - Mở rộng `NutritionDelta` với `fiber` và update toàn bộ call-site trong `MealItemService`.

### 4. Module FoodImage

- **Trạng thái thực tế**
  - `FoodImage` đang `mealId Int` → `Meal` (và `Meal` có `foodImages FoodImage[]`).
  - Service/controller chỉ làm việc với `mealId` (ví dụ route kiểu `/food-images/meal/:mealId`).
- **So với plan**
  - **Đúng**: Nhận định rằng ảnh gắn với `Meal` thay vì `MealItem` là chính xác, và điều này không khớp với nghiệp vụ "ảnh gắn với một món cụ thể".
  - Đề xuất chuyển quan hệ sang `MealItem` (`mealItemId`) + đổi route sang `/meal-items/:mealItemId/images` là **phù hợp**.
- **Gợi ý khi implement**
  - Migration: thêm `mealItemId`, backfill hoặc truncate dữ liệu test, rồi bỏ `mealId`.
  - Cập nhật schema: remove relation `Meal.foodImages`, thêm `MealItem.foodImages`.
  - Refactor `FoodImageService`/controller để nhận và validate `mealItemId` (qua `mealItem.meal.dailyLog.userId`).

### 5. Module UserProfile (và User)

- **Trạng thái thực tế**
  - `UserProfile` có `age`, `height`, `weight`, `bmi`, `bmr`, `tdee`, nhưng **không có** `gender` hay `activityLevel`.
  - `User` có `genderCode` nhưng không được dùng trong `UserProfileService`.
  - Tính `BMR` đang dùng công thức Mifflin–St Jeor **mặc định cho nam**; `TDEE` luôn nhân hệ số **1.55** (giả sử hoạt động trung bình), không hề tuỳ theo profile.
- **So với plan**
  - **Đúng**: Nhận định thiếu `gender` và `activityLevel` trong `UserProfile` và thiếu logic dùng 2 field đó trong tính BMR/TDEE là chính xác.
  - Đề xuất thêm `gender` (`MALE`/`FEMALE`/`OTHER`) và `activityLevel` (`SEDENTARY`/`LIGHT`/`MODERATE`/`ACTIVE`/`VERY_ACTIVE`) là hợp lý.
- **Gợi ý khi implement**
  - Cân nhắc đồng bộ giữa `User.genderCode` và `UserProfile.gender` (chọn 1 nơi làm nguồn chính).
  - Cập nhật `UserProfileService` để:
    - BMR: dùng công thức nam/nữ tương ứng gender.
    - TDEE: nhân với factor theo `activityLevel` như bảng bạn ghi.

### 6. Module MealItem

- **Trạng thái thực tế**
  - `MealItem` có `quantity`, `calories`, `protein`, `carbs`, `fat` – **không có** `fiber`.
  - `MealItemService` khi create/update/remove đều tính & propagate `calories/protein/carbs/fat` sang `Meal` và `DailyLog` thông qua `NutritionDelta`.
- **So với plan**
  - **Đúng**: Nhận định rằng cần thêm tracking `fiber` vào `MealItem` và vào delta (daily log) là chính xác.
- **Gợi ý khi implement**
  - Thêm cột `fiber` vào `MealItem`.
  - Khi tạo/cập nhật, lấy `food.fiber` × `quantity` để tính fiber của item.
  - Gọi `dailyLogService.addNutrition` / `subtractNutrition` với thêm field `fiber`.

### 7. Thứ tự thực hiện

- **Đánh giá**: Thứ tự 8 bước bạn đề xuất là **hợp lý**, vì:
  - Thêm field mới ít ảnh hưởng (fiber, macro target, gender/activityLevel) trước khi thay đổi quan hệ phức tạp như `FoodImage`.
  - Đảm bảo các service phụ thuộc (DailyLog, MealItem) chỉ được chỉnh sau khi schema đã có field cần thiết.
- **Tinh chỉnh nhỏ**:
  - Gom các thay đổi schema có liên hệ chặt chẽ vào một số migration có tên rõ (ví dụ 1 migration cho `food` + `meal_item` fiber, 1 migration cho `nutrition_goal` + `daily_log` target macros) để dễ rollback.

### 8. Quan hệ đã đúng

- Các quan hệ bạn liệt kê là **phù hợp với schema hiện tại**: `User–UserProfile`, `User–NutritionGoal`, `User–DailyLog`, `DailyLog–Meal`, `Meal–MealItem`, `MealItem–Food`, `Food–FoodCategory`, `Food–FoodNutrition–FoodNutritionValue`, `DishIngredient`… đều đang được define đúng và không mâu thuẫn với plan.
- Không phát hiện mâu thuẫn lớn giữa phần "NHỮNG PHẦN ĐÃ ĐÚNG" trong tài liệu của bạn và schema/service thực tế.
