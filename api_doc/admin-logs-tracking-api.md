# Admin API Documentation - Logs & Tracking

Tài liệu API dành cho Admin để quản lý Logs & Tracking: Daily Logs, Workout Logs và Meals.

---

## 📋 Mục lục

1. [Daily Logs](#1-daily-logs)
2. [Workout Logs](#2-workout-logs)
3. [Meals](#3-meals)

---

## 1. Daily Logs

Base URL: `/daily-logs`

Daily Logs là bản ghi tổng hợp hoạt động dinh dưỡng và tập luyện của user trong một ngày.

### 1.1 [Admin] Lấy tất cả Daily Logs

```
GET /daily-logs/all
```

**Mô tả**: Lấy danh sách tất cả daily logs của tất cả users

**⚠️ Yêu cầu**: Admin token

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "logDate": "2024-01-15T00:00:00.000Z",
    "status": "STATUS_BELOW",
    "userId": 1,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "fullName": "Nguyễn Văn A"
    },
    "meals": [
      {
        "id": 1,
        "mealType": "MEAL_BREAKFAST",
        "mealDateTime": "2024-01-15T07:00:00Z"
      }
    ],
    "createdAt": "2024-01-15T00:00:00Z",
    "updatedAt": "2024-01-15T23:59:59Z"
  }
]
```

---

### 1.2 [Admin] Lấy Daily Log theo ID

```
GET /daily-logs/id/:id
```

**Mô tả**: Lấy thông tin chi tiết một daily log theo ID

**⚠️ Yêu cầu**: Admin token

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | string/number | ✅ | ID của daily log |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "logDate": "2024-01-15T00:00:00.000Z",
  "status": "STATUS_BELOW",
  "userId": 1,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A"
  },
  "meals": [
    {
      "id": 1,
      "mealType": "MEAL_BREAKFAST",
      "mealDateTime": "2024-01-15T07:00:00Z",
      "mealItems": [
        {
          "id": 1,
          "food": { "foodName": "Phở bò" },
          "quantity": 1,
          "calories": 450
        }
      ]
    }
  ],
  "createdAt": "2024-01-15T00:00:00Z"
}
```

---

### 1.3 Lấy Daily Logs của User hiện tại

```
GET /daily-logs
```

**Mô tả**: Lấy tất cả daily logs của user đang đăng nhập

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "logDate": "2024-01-15T00:00:00.000Z",
    "status": "STATUS_MET",
    "userId": 1,
    "meals": [ ... ],
    "createdAt": "2024-01-15T00:00:00Z"
  },
  {
    "id": 2,
    "logDate": "2024-01-16T00:00:00.000Z",
    "status": "STATUS_ABOVE",
    "userId": 1,
    "meals": [ ... ],
    "createdAt": "2024-01-16T00:00:00Z"
  }
]
```

---

### 1.4 Lấy Daily Log hôm nay (Get or Create)

```
GET /daily-logs/today
```

**Mô tả**: Lấy daily log của ngày hôm nay. Nếu chưa có, tự động tạo mới.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "id": 5,
  "logDate": "2024-01-20T00:00:00.000Z",
  "status": "STATUS_BELOW",
  "userId": 1,
  "meals": [],
  "createdAt": "2024-01-20T10:30:00Z",
  "message": "Created new daily log for today"
}
```

---

### 1.5 Lấy Daily Log theo ngày cụ thể

```
GET /daily-logs/:date
```

**Mô tả**: Lấy daily log của một ngày cụ thể (format: YYYY-MM-DD)

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| date | string | ✅ | Ngày (YYYY-MM-DD) |

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "id": 3,
  "logDate": "2024-01-10T00:00:00.000Z",
  "status": "STATUS_MET",
  "userId": 1,
  "meals": [
    {
      "id": 5,
      "mealType": "MEAL_LUNCH",
      "mealDateTime": "2024-01-10T12:00:00Z"
    }
  ],
  "createdAt": "2024-01-10T00:00:00Z"
}
```

---

### 1.6 Lấy tóm tắt 7 ngày gần nhất

```
GET /daily-logs/weekly
```

**Mô tả**: Lấy tóm tắt daily logs 7 ngày gần nhất

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "summary": [
    {
      "date": "2024-01-20",
      "status": "STATUS_MET",
      "totalCalories": 2100,
      "totalMeals": 3,
      "workoutDone": true
    },
    {
      "date": "2024-01-19",
      "status": "STATUS_BELOW",
      "totalCalories": 1800,
      "totalMeals": 3,
      "workoutDone": false
    }
  ],
  "averageCalories": 1950,
  "goalAchievementRate": 85.5
}
```

---

## 2. Workout Logs

Base URL: `/workout-logs`

Workout Logs là bản ghi các hoạt động tập luyện của user.

### 2.1 Lấy tất cả Workout Logs của User

```
GET /workout-logs?page=1&limit=10
```

**Mô tả**: Lấy danh sách workout logs của user hiện tại với phân trang

**Query Params**:
| Tên | Kiểu | Mặc định | Mô tả |
|-----|------|----------|-------|
| page | string/number | 1 | Trang hiện tại |
| limit | string/number | 10 | Số item mỗi trang |

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": 1,
      "workoutType": "Running",
      "durationMinute": 30,
      "burnedCalories": 300,
      "startedAt": "2024-01-20T06:00:00Z",
      "endedAt": "2024-01-20T06:30:00Z",
      "source": "Manual",
      "userId": 1,
      "createdAt": "2024-01-20T06:30:00Z"
    },
    {
      "id": 2,
      "workoutType": "Gym",
      "durationMinute": 45,
      "burnedCalories": 250,
      "startedAt": "2024-01-19T17:00:00Z",
      "endedAt": "2024-01-19T17:45:00Z",
      "source": "Manual",
      "userId": 1,
      "createdAt": "2024-01-19T17:45:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### 2.2 Lấy Workout Log theo ngày

```
GET /workout-logs/date/:date
```

**Mô tả**: Lấy workout logs của một ngày cụ thể

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| date | string | ✅ | Ngày (YYYY-MM-DD) |

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "workoutType": "Running",
    "durationMinute": 30,
    "burnedCalories": 300,
    "startedAt": "2024-01-20T06:00:00Z",
    "endedAt": "2024-01-20T06:30:00Z",
    "source": "Manual",
    "userId": 1
  }
]
```

---

### 2.3 Lấy chi tiết 1 Workout Log

```
GET /workout-logs/:id
```

**Mô tả**: Lấy thông tin chi tiết của một workout log

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | string/number | ✅ | ID của workout log |

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "workoutType": "Running",
  "durationMinute": 30,
  "burnedCalories": 300,
  "startedAt": "2024-01-20T06:00:00Z",
  "endedAt": "2024-01-20T06:30:00Z",
  "source": "Manual",
  "userId": 1,
  "createdAt": "2024-01-20T06:30:00Z",
  "updatedAt": "2024-01-20T06:30:00Z"
}
```

---

### 2.4 Tạo Workout Log mới

```
POST /workout-logs
```

**Mô tả**: Tạo bản ghi tập luyện mới

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "workoutType": "Running",         // Bắt buộc - Loại tập luyện (string)
  "durationMinute": 30,               // Tùy chọn - Thời lượng (phút), >= 1
  "burnedCalories": 300,            // Tùy chọn - Calories đốt cháy, >= 0
  "startedAt": "2024-01-20T06:00:00Z", // Bắt buộc - Thời gian bắt đầu (ISO date)
  "endedAt": "2024-01-20T06:30:00Z",   // Tùy chọn - Thời gian kết thúc (ISO date)
  "source": "Manual"                  // Tùy chọn - Nguồn (string)
}
```

**Validation Rules**:
- `workoutType`: Không được để trống
- `durationMinute`: Số nguyên >= 1
- `burnedCalories`: Số >= 0
- `startedAt`: ISO date string, bắt buộc
- `endedAt`: ISO date string, tùy chọn (phải sau startedAt)

**Response** (201 Created):
```json
{
  "id": 3,
  "workoutType": "Running",
  "durationMinute": 30,
  "burnedCalories": 300,
  "startedAt": "2024-01-20T06:00:00Z",
  "endedAt": "2024-01-20T06:30:00Z",
  "source": "Manual",
  "userId": 1,
  "createdAt": "2024-01-20T06:30:00Z"
}
```

---

### 2.5 Cập nhật Workout Log

```
PATCH /workout-logs/:id
```

**Mô tả**: Cập nhật thông tin workout log

⚠️ **Lưu ý**: Chỉ có thể cập nhật workout log của chính mình

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | string/number | ✅ | ID của workout log |

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (tất cả tùy chọn):
```json
{
  "workoutType": "Jogging",
  "durationMinute": 35,
  "burnedCalories": 320,
  "endedAt": "2024-01-20T06:35:00Z"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "workoutType": "Jogging",
  "durationMinute": 35,
  "burnedCalories": 320,
  "startedAt": "2024-01-20T06:00:00Z",
  "endedAt": "2024-01-20T06:35:00Z",
  "userId": 1,
  "updatedAt": "2024-01-20T06:35:00Z"
}
```

---

### 2.6 Xóa Workout Log

```
DELETE /workout-logs/:id
```

**Mô tả**: Xóa một workout log

⚠️ **Lưu ý**: Chỉ có thể xóa workout log của chính mình

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | string/number | ✅ | ID của workout log |

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (204 No Content):
```
(empty body)
```

---

## 3. Meals

Base URL: `/meals`

Meals là các bữa ăn trong một ngày (Daily Log).

### 3.1 [Admin] Lấy tất cả Meals

```
GET /meals/all
```

**Mô tả**: Lấy danh sách tất cả meals của tất cả users

**⚠️ Yêu cầu**: Admin token

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "mealType": "MEAL_BREAKFAST",
    "mealDateTime": "2024-01-20T07:00:00Z",
    "dailyLogId": 5,
    "dailyLog": {
      "id": 5,
      "logDate": "2024-01-20",
      "user": {
        "id": 1,
        "email": "user@example.com"
      }
    },
    "mealItems": [
      {
        "id": 1,
        "food": { "foodName": "Phở bò" },
        "quantity": 1,
        "calories": 450
      }
    ],
    "foodImages": [],
    "createdAt": "2024-01-20T07:00:00Z"
  }
]
```

---

### 3.2 Lấy Meals theo Daily Log

```
GET /meals/daily-log/:dailyLogId
```

**Mô tả**: Lấy tất cả meals thuộc về một daily log cụ thể

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| dailyLogId | number | ✅ | ID của daily log |

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "mealType": "MEAL_BREAKFAST",
    "mealDateTime": "2024-01-20T07:00:00Z",
    "dailyLogId": 5,
    "mealItems": [
      {
        "id": 1,
        "food": { "foodName": "Phở bò" },
        "quantity": 1,
        "grams": 500,
        "calories": 450,
        "protein": 25,
        "carbs": 60,
        "fat": 15
      }
    ],
    "foodImages": [
      {
        "id": 1,
        "imageUrl": "https://...",
        "fileName": "breakfast.jpg"
      }
    ],
    "createdAt": "2024-01-20T07:00:00Z"
  },
  {
    "id": 2,
    "mealType": "MEAL_LUNCH",
    "mealDateTime": "2024-01-20T12:00:00Z",
    "dailyLogId": 5,
    "mealItems": [ ... ],
    "createdAt": "2024-01-20T12:00:00Z"
  }
]
```

---

### 3.3 Lấy chi tiết 1 Meal

```
GET /meals/:id
```

**Mô tả**: Lấy thông tin chi tiết của một meal

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của meal |

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "mealType": "MEAL_BREAKFAST",
  "mealDateTime": "2024-01-20T07:00:00Z",
  "dailyLogId": 5,
  "dailyLog": {
    "id": 5,
    "logDate": "2024-01-20",
    "userId": 1
  },
  "mealItems": [
    {
      "id": 1,
      "food": { "foodName": "Phở bò", "imageUrl": "..." },
      "quantity": 1,
      "grams": 500,
      "calories": 450,
      "protein": 25,
      "carbs": 60,
      "fat": 15,
      "fiber": 5
    }
  ],
  "foodImages": [
    {
      "id": 1,
      "imageUrl": "https://res.cloudinary.com/...",
      "fileName": "pho-bo.jpg",
      "mimeType": "image/jpeg",
      "fileSize": 1234567,
      "uploadedAt": "2024-01-20T07:05:00Z"
    }
  ],
  "createdAt": "2024-01-20T07:00:00Z",
  "updatedAt": "2024-01-20T07:00:00Z"
}
```

---

### 3.4 Tạo Meal mới

```
POST /meals
```

**Mô tả**: Tạo một bữa ăn mới trong daily log

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "dailyLogId": 5,                    // Bắt buộc - ID của daily log, số nguyên > 0
  "mealType": "MEAL_BREAKFAST"        // Bắt buộc - Loại bữa ăn
}
```

**Meal Types** (`mealType`):
| Giá trị | Mô tả |
|---------|-------|
| `MEAL_BREAKFAST` | Bữa sáng |
| `MEAL_LUNCH` | Bữa trưa |
| `MEAL_DINNER` | Bữa tối |
| `MEAL_SNACK` | Bữa phụ/Ăn vặt |

**Validation Rules**:
- `dailyLogId`: Số nguyên dương (> 0)
- `mealType`: Phải là một trong các giá trị enum trên

**Response** (201 Created):
```json
{
  "id": 3,
  "mealType": "MEAL_BREAKFAST",
  "mealDateTime": "2024-01-20T07:00:00.000Z",
  "dailyLogId": 5,
  "mealItems": [],
  "foodImages": [],
  "createdAt": "2024-01-20T07:00:00Z"
}
```

---

### 3.5 Cập nhật Meal

```
PATCH /meals/:id
```

**Mô tả**: Cập nhật thông tin meal

⚠️ **Lưu ý**: Chỉ có thể cập nhật meal của chính mình (qua kiểm tra dailyLog → userId)

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của meal |

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "mealType": "MEAL_LUNCH",           // Tùy chọn - Đổi loại bữa ăn
  "mealDateTime": "2024-01-20T12:30:00Z"  // Tùy chọn - Đổi thời gian
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "mealType": "MEAL_LUNCH",
  "mealDateTime": "2024-01-20T12:30:00Z",
  "dailyLogId": 5,
  "updatedAt": "2024-01-20T12:30:00Z"
}
```

---

### 3.6 Xóa Meal

```
DELETE /meals/:id
```

**Mô tả**: Xóa một meal

⚠️ **Lưu ý**: Chỉ có thể xóa meal của chính mình

⚠️ **Cảnh báo**: Xóa meal sẽ xóa tất cả:
- `mealItems` liên quan (CASCADE)
- `foodImages` liên quan (CASCADE)

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của meal |

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (204 No Content):
```
(empty body)
```

---

## 🔐 Authentication & Authorization

### Admin Guard
Các API có ghi chú **"⚠️ Yêu cầu: Admin token"** đều sử dụng `AdminGuard`:

```typescript
@UseGuards(AdminGuard)
```

Token JWT phải chứa:
```json
{
  "id": 1,
  "email": "admin@example.com",
  "isAdmin": true  // ← Bắt buộc phải là true
}
```

### JWT Auth Guard
Workout Logs sử dụng `@UseGuards(JwtAuthGuard)` cho toàn bộ controller.

### User-based Access
- Daily Logs, Workout Logs, Meals đều kiểm tra userId từ token
- Users chỉ có thể xem/cập nhật/xóa dữ liệu của chính mình
- Admin có thể xem tất cả qua các endpoint `/all`

---

## 📝 Ví dụ Flow Tracking

### Scenario: Một ngày điển hình của user

```
1. GET /daily-logs/today
   → Tự động tạo daily log cho hôm nay

2. POST /meals
   Body: { "dailyLogId": 5, "mealType": "MEAL_BREAKFAST" }
   → Tạo bữa sáng

3. POST /meal-items (API khác)
   → Thêm món ăn vào bữa sáng

4. POST /workout-logs
   Body: {
     "workoutType": "Running",
     "durationMinute": 30,
     "burnedCalories": 300,
     "startedAt": "2024-01-20T06:00:00Z"
   }
   → Ghi lại tập luyện

5. GET /daily-logs/weekly
   → Xem tóm tắt cả tuần
```

---

## 🔗 API Liên quan

### Meal Items
- Xem API Meal Items để thêm/xóa món ăn trong meal

### Food Images
- Xem `@/api_doc/admin-food-management-api.md` - Phần Ảnh thực phẩm

---

*Document Version: 1.0*
*Last Updated: April 2026*
