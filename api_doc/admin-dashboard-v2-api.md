# Admin API — Dashboard V2 Overview

Module: `AdminDashboardV2Module`  
Controller prefix: `admin/dashboard-v2`  
Guard: `AdminGuard` — JWT phải có `isAdmin: true`

---

## Endpoint

```
GET /api/v1/admin/dashboard-v2/overview
```

### Headers

| Tên | Giá trị |
|-----|---------|
| `Authorization` | `Bearer <access_token>` |

### Response `200 OK`

```json
{
  "metadata": {
    "statusCode": 200,
    "message": "Success",
    "EC": 0,
    "timestamp": "2026-04-10T07:00:00.000Z",
    "path": "/api/v1/admin/dashboard-v2/overview"
  },
  "data": {
    "keyMetrics": {
      "totalUsers": {
        "value": 14285,
        "trendPercent": 4.2,
        "trendLabel": "so với tháng trước"
      },
      "newUsersToday": {
        "value": 38,
        "trendPercent": 12.0,
        "trendLabel": "so với hôm qua"
      },
      "totalFoods": {
        "value": 2410,
        "newContributions": 45,
        "trendLabel": "lượt đóng góp đang chờ duyệt"
      },
      "totalMealLogs": {
        "value": 68904,
        "trendPercent": 8.3,
        "trendLabel": "Độ tương tác tháng này"
      }
    },
    "trends": {
      "activeUsersLast30Days": [
        { "date": "11/03", "users": 120 },
        { "date": "12/03", "users": 135 },
        "// ... đủ 30 phần tử, days with 0 users vẫn có mặt"
      ]
    },
    "analytics": {
      "userGoalsBreakdown": [
        { "name": "Giảm cân",              "goalType": "GOAL_LOSS",     "count": 450, "percentage": 45.0 },
        { "name": "Tăng cơ",               "goalType": "GOAL_GAIN",     "count": 300, "percentage": 30.0 },
        { "name": "Duy trì",               "goalType": "GOAL_MAINTAIN", "count": 200, "percentage": 20.0 },
        { "name": "Ăn kiêng nghiêm ngặt",  "goalType": "GOAL_STRICT",   "count":  50, "percentage":  5.0 }
      ],
      "topFoods": [
        {
          "rank": 1,
          "foodId": 12,
          "name": "Phở bò",
          "calories": 523,
          "logCount": 4210,
          "trendPercent": 12.0
        },
        "// ... Top 5 món (30 ngày gần nhất)"
      ]
    },
    "management": {
      "totalAlerts": 7,
      "alerts": [
        {
          "id": "submission-42",
          "type": "pending",
          "text": "Đóng góp thông tin món \"Gà ủ muối\" đang chờ duyệt.",
          "timeAgo": "15 phút trước",
          "createdAt": "2026-04-10T06:45:00.000Z"
        },
        {
          "id": "submission-38",
          "type": "report",
          "text": "Báo cáo về món \"Bún bò Huế\" đang chờ xử lý.",
          "timeAgo": "2 giờ trước",
          "createdAt": "2026-04-10T05:00:00.000Z"
        },
        {
          "id": "missing-nutrition-7",
          "type": "missing",
          "text": "Món \"Xôi xéo\" chưa có hồ sơ dinh dưỡng.",
          "timeAgo": "1 ngày trước",
          "createdAt": "2026-04-09T07:00:00.000Z"
        }
      ]
    }
  }
}
```

---

## Chi tiết từng nhóm dữ liệu

### `keyMetrics`

| Field | Nguồn dữ liệu | Ghi chú |
|-------|---------------|---------|
| `totalUsers.value` | `COUNT(users WHERE isAdmin=false)` | Tổng user (loại admin) |
| `totalUsers.trendPercent` | User đăng ký tháng này vs tháng trước | `null` nếu cả 2 kỳ = 0 |
| `newUsersToday.value` | User `createdAt` trong ngày UTC hiện tại | |
| `newUsersToday.trendPercent` | Hôm nay vs hôm qua | `null` nếu cả 2 = 0 |
| `totalFoods.value` | `COUNT(foods)` | Tổng số món trong DB |
| `totalFoods.newContributions` | `COUNT(user_submissions WHERE status=PENDING)` | Tổng đóng góp/báo cáo chờ duyệt |
| `totalMealLogs.value` | `COUNT(meal_items)` trong tháng hiện tại | Đo độ tương tác |
| `totalMealLogs.trendPercent` | Tháng này vs tháng trước | |

### `trends.activeUsersLast30Days`

- **30 phần tử** cố định, từ `D-29` đến `D` (hôm nay, UTC).
- Mỗi phần tử: `date` (định dạng `DD/MM`) và `users` (số distinct user có ít nhất 1 bữa ăn).
- Ngày không có activity trả về `users: 0` — đảm bảo biểu đồ không bị gãy.

### `analytics.userGoalsBreakdown`

- Chỉ tính `NutritionGoal` có `status = NUTR_GOAL_ONGOING` và còn trong khoảng `startDate – endDate`.
- `percentage` tính tròn đến 1 chữ số thập phân, tổng có thể lệch nhẹ do làm tròn.
- Được sắp xếp giảm dần theo `count`.

### `analytics.topFoods`

- Top 5 món được ghi nhận nhiều nhất trong **30 ngày gần nhất** (tính theo `meal_items`).
- `calories`: giá trị per-100g lấy từ `FoodNutritionProfile -> FoodNutritionValue` với nutrient tên chứa `calories/energy/kcal/năng lượng`. Trả về `null` nếu chưa có hồ sơ dinh dưỡng.
- `trendPercent`: so sánh `logCount` kỳ này (30 ngày) vs kỳ trước (30 ngày trước đó). `null` nếu không có dữ liệu kỳ trước.

### `management.alerts`

Tổng hợp tối đa **10 thông báo** gần nhất (sắp xếp theo `createdAt` mới nhất):

| `type` | Nguồn | Gợi ý icon/màu |
|--------|-------|----------------|
| `"pending"` | `UserSubmission` type=`CONTRIBUTION`, status=`PENDING` | 🕐 màu vàng |
| `"report"` | `UserSubmission` type=`REPORT`, status=`PENDING` | ⚠️ màu cam |
| `"missing"` | `Food` chưa có `FoodNutritionProfile` | ❗ màu đỏ |

- `timeAgo`: chuỗi tiếng Việt tính server-side (vd: `"15 phút trước"`, `"2 giờ trước"`).
- `createdAt`: ISO timestamp để frontend tự format nếu cần.

---

## Lỗi có thể trả về

| HTTP | Trường hợp |
|------|-----------|
| `401 Unauthorized` | Thiếu hoặc JWT hết hạn |
| `403 Forbidden` | JWT hợp lệ nhưng `isAdmin = false` |

---

*Cập nhật: tháng 4/2026*
