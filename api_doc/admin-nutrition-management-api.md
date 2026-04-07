# Admin API Documentation - Nutrition Management

Tài liệu API dành cho Admin để quản lý Dinh dưỡng: Chất dinh dưỡng (Nutrients — endpoint `nutrition-components`) và Mục tiêu dinh dưỡng (Nutrition Goals).

**Tiền tố:** `/api/v1` — xem [README.md](./README.md).

---

## 📋 Mục lục

1. [Chất dinh dưỡng (Nutrition Components)](#1-chất-dinh-dưỡng-nutrition-components)
2. [Mục tiêu dinh dưỡng (Nutrition Goals)](#2-mục-tiêu-dinh-dưỡng-nutrition-goals) — gồm `GET /nutrition-goals/admin` (phân trang)

---

## 1. Chất dinh dưỡng (Nutrition Components)

Base path: `/nutrition-components`

Trong database model tên **`Nutrient`**. API vẫn dùng path `nutrition-components`.

Quản lý danh sách các chỉ số dinh dưỡng có thể có (Calories, Protein, Fat, Carbs...).

**Đơn vị (`unit`):** enum Prisma `UnitType` — ví dụ `UNIT_G`, `UNIT_KG`, `UNIT_MG`, `UNIT_OZ`, `UNIT_LB` (không dùng chuỗi tự do kiểu `kcal` trừ khi seed cho phép).

### 1.1 Lấy danh sách Chỉ số Dinh dưỡng

```
GET /nutrition-components
```

**Mô tả**: Lấy tất cả các chỉ số dinh dưỡng có thể đo

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Calories",
    "unit": "UNIT_G",
    "values": []
  },
  {
    "id": 2,
    "name": "Protein",
    "unit": "UNIT_G",
    "values": []
  },
  {
    "id": 3,
    "name": "Carbohydrates",
    "unit": "UNIT_G",
    "values": []
  },
  {
    "id": 4,
    "name": "Fat",
    "unit": "UNIT_G",
    "values": []
  },
  {
    "id": 5,
    "name": "Fiber",
    "unit": "UNIT_G",
    "values": []
  }
]
```

---

### 1.2 Tạo Chỉ số Dinh dưỡng mới

```
POST /nutrition-components
```

**Mô tả**: Thêm một chỉ số dinh dưỡng mới

**⚠️ Yêu cầu**: Admin token

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Iron",           // Bắt buộc - Tên chỉ số, tối đa 255 ký tự
  "unit": "UNIT_MG"         // Bắt buộc — UnitType
}
```

**Unit Types** (`unit`) — `UnitType` trong Prisma:

| Giá trị | Gợi ý |
|---------|--------|
| `UNIT_G` | Gram |
| `UNIT_KG` | Kilogram |
| `UNIT_MG` | Milligram |
| `UNIT_OZ` | Ounce |
| `UNIT_LB` | Pound |

**Validation Rules**:
- `name`: Không được để trống, tối đa 255 ký tự
- `unit`: Phải là một trong các giá trị enum trên

**Response** (201 Created):
```json
{
  "id": 6,
  "name": "Iron",
  "unit": "UNIT_MG",
  "values": []
}
```

---

### 1.3 Cập nhật Chỉ số Dinh dưỡng

```
PATCH /nutrition-components/:id
```

**Mô tả**: Cập nhật thông tin chỉ số dinh dưỡng

**⚠️ Yêu cầu**: Admin token

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của chỉ số dinh dưỡng |

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body** (tất cả tùy chọn):
```json
{
  "name": "Sắt (Iron)",
  "unit": "MG"
}
```

**Response** (200 OK):
```json
{
  "id": 6,
  "name": "Sắt (Iron)",
  "unit": "MG"
}
```

---

### 1.4 Xóa Chỉ số Dinh dưỡng

```
DELETE /nutrition-components/:id
```

**Mô tả**: Xóa một chỉ số dinh dưỡng

**⚠️ Yêu cầu**: Admin token

⚠️ **Cảnh báo**: Xóa sẽ ảnh hưởng đến tất cả các giá trị dinh dưỡng đang sử dụng chỉ số này.

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của chỉ số dinh dưỡng |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (204 No Content):
```
(empty body)
```

---

## 2. Mục tiêu dinh dưỡng (Nutrition Goals)

Base path: `/nutrition-goals`

Quản lý mục tiêu dinh dưỡng của người dùng (giảm cân, tăng cân, duy trì...).

### 2.1 [Admin] Phân trang + lọc (aqp) — khuyến nghị cho bảng admin

```
GET /nutrition-goals/admin?current=1&pageSize=10&...
```

**Mô tả:** `AdminGuard`. Lọc/sort qua [api-query-params](https://github.com/koajs/aqp) (giống `GET /users/admin`).

**Sort mặc định:** `updatedAt` giảm dần.

**Query thường dùng:** `current`, `pageSize`, cùng các tham số `filter` / sort theo aqp.

**Response** (trong `data`): object dạng `{ EC, EM, meta, result }`:

- **`meta`:** `current`, `pageSize`, `pages`, `total`
- **`result`:** mảng goal kèm user; mỗi goal có **`goalTypeInfo`** và **`statusInfo`** (map từ `all_codes` theo `keyMap` = `goalType` / `status`) với `keyMap`, `value`, `description`

---

### 2.2 [Admin] Lấy tất cả Mục tiêu dinh dưỡng (không phân trang)

```
GET /nutrition-goals/all
```

**Mô tả**: Lấy danh sách tất cả mục tiêu dinh dưỡng của tất cả users

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
    "goalType": "GOAL_LOSS",
    "status": "NUTR_GOAL_ONGOING",
    "targetWeight": 65.0,
    "targetCalories": 1800,
    "targetProtein": 120.0,
    "targetCarbs": 180.0,
    "targetFat": 60.0,
    "targetFiber": 30.0,
    "startDate": "2024-01-01",
    "endDate": "2024-03-31",
    "userId": 1,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "fullName": "Nguyễn Văn A"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### 2.3 Lấy Mục tiêu dinh dưỡng của User hiện tại

```
GET /nutrition-goals
```

**Mô tả**: Lấy tất cả mục tiêu dinh dưỡng của user đang đăng nhập

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "goalType": "GOAL_LOSS",
    "status": "NUTR_GOAL_ONGOING",
    "targetWeight": 65.0,
    "targetCalories": 1800,
    "targetProtein": 120.0,
    "targetCarbs": 180.0,
    "targetFat": 60.0,
    "targetFiber": 30.0,
    "startDate": "2024-01-01",
    "endDate": "2024-03-31",
    "userId": 1,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### 2.4 Lấy Mục tiêu dinh dưỡng với lịch sử

```
GET /nutrition-goals/my-goals
```

**Mô tả**: Lấy mục tiêu dinh dưỡng kèm theo lịch sử tiến độ

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "goals": [
    {
      "id": 1,
      "goalType": "GOAL_LOSS",
      "status": "NUTR_GOAL_ONGOING",
      "targetWeight": 65.0,
      "targetCalories": 1800,
      "currentProgress": {
        "currentWeight": 68.5,
        "remainingDays": 45,
        "completionRate": 35.5
      }
    }
  ]
}
```

---

### 2.5 Lấy Mục tiêu dinh dưỡng hiện tại

```
GET /nutrition-goals/current
```

**Mô tả**: Lấy mục tiêu dinh dưỡng đang active (ONGOING) của user

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "goalType": "GOAL_LOSS",
  "status": "NUTR_GOAL_ONGOING",
  "targetWeight": 65.0,
  "targetCalories": 1800,
  "targetProtein": 120.0,
  "targetCarbs": 180.0,
  "targetFat": 60.0,
  "targetFiber": 30.0,
  "startDate": "2024-01-01",
  "endDate": "2024-03-31"
}
```

---

### 2.6 Lấy chi tiết 1 Mục tiêu dinh dưỡng

```
GET /nutrition-goals/:id
```

**Mô tả**: Lấy thông tin chi tiết của một mục tiêu dinh dưỡng (kèm `user`).

**Lưu ý:** Handler hiện **không** kiểm tra `userId` khớp JWT — mọi user đăng nhập có thể đọc goal theo `id` (nên cân nhắc siết quyền ở backend nếu cần bảo mật).

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của mục tiêu |

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "goalType": "GOAL_LOSS",
  "status": "NUTR_GOAL_ONGOING",
  "targetWeight": 65.0,
  "targetCalories": 1800,
  "targetProtein": 120.0,
  "targetCarbs": 180.0,
  "targetFat": 60.0,
  "targetFiber": 30.0,
  "startDate": "2024-01-01",
  "endDate": "2024-03-31",
  "userId": 1,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A"
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

### 2.7 Tạo Mục tiêu dinh dưỡng mới

```
POST /nutrition-goals
```

**Mô tả**: Tạo mục tiêu dinh dưỡng mới cho user hiện tại

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "goalType": "GOAL_LOSS",        // Bắt buộc - Loại mục tiêu
  "targetWeight": 65.0,             // Bắt buộc - Cân nặng mục tiêu (kg)
  "targetCalories": 1800,           // Bắt buộc - Calories mục tiêu (kcal)
  "targetProtein": 120.0,           // Bắt buộc - Protein mục tiêu (g)
  "targetCarbs": 180.0,             // Bắt buộc - Carbs mục tiêu (g)
  "targetFat": 60.0,                // Bắt buộc - Fat mục tiêu (g)
  "targetFiber": 30.0,              // Bắt buộc - Chất xơ mục tiêu (g)
  "startDate": "2024-01-01",        // Bắt buộc - Ngày bắt đầu (ISO date)
  "endDate": "2024-03-31",          // Bắt buộc - Ngày kết thúc (ISO date)
  "status": "NUTR_GOAL_ONGOING"     // Tùy chọn - Trạng thái
}
```

**Goal Types** (`goalType`):
| Giá trị | Mô tả |
|---------|-------|
| `GOAL_LOSS` | Giảm cân |
| `GOAL_GAIN` | Tăng cân |
| `GOAL_MAINTAIN` | Duy trì cân nặng |
| `GOAL_STRICT` | Chế độ nghiêm ngặt |

**Status Types** (`status`):
| Giá trị | Mô tả |
|---------|-------|
| `NUTR_GOAL_ONGOING` | Đang thực hiện |
| `NUTR_GOAL_COMPLETED` | Hoàn thành |
| `NUTR_GOAL_PAUSED` | Tạm dừng |
| `NUTR_GOAL_FAILED` | Thất bại |

**Response** (201 Created):
```json
{
  "id": 1,
  "goalType": "GOAL_LOSS",
  "status": "NUTR_GOAL_ONGOING",
  "targetWeight": 65.0,
  "targetCalories": 1800,
  "targetProtein": 120.0,
  "targetCarbs": 180.0,
  "targetFat": 60.0,
  "targetFiber": 30.0,
  "startDate": "2024-01-01",
  "endDate": "2024-03-31",
  "userId": 1,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 2.8 Cập nhật Mục tiêu dinh dưỡng

```
PATCH /nutrition-goals/:id
```

**Mô tả**: Cập nhật thông tin mục tiêu dinh dưỡng

⚠️ **Lưu ý**: Chỉ có thể cập nhật mục tiêu của chính mình (dựa trên userId trong token)

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của mục tiêu |

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (tất cả tùy chọn):
```json
{
  "goalType": "GOAL_LOSS",
  "status": "NUTR_GOAL_PAUSED",
  "targetWeight": 64.0,
  "targetCalories": 1750,
  "targetProtein": 115.0,
  "targetCarbs": 170.0,
  "targetFat": 58.0,
  "targetFiber": 32.0,
  "endDate": "2024-04-30"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "goalType": "GOAL_LOSS",
  "status": "NUTR_GOAL_PAUSED",
  "targetWeight": 64.0,
  "targetCalories": 1750,
  "targetProtein": 115.0,
  "targetCarbs": 170.0,
  "targetFat": 58.0,
  "targetFiber": 32.0,
  "endDate": "2024-04-30",
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

---

### 2.9 Xóa 1 Mục tiêu dinh dưỡng

```
DELETE /nutrition-goals/:id
```

**Mô tả**: Xóa một mục tiêu dinh dưỡng

⚠️ **Lưu ý**: Chỉ có thể xóa mục tiêu của chính mình

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của mục tiêu |

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (204 No Content):
```
(empty body)
```

---

### 2.10 Xóa nhiều Mục tiêu dinh dưỡng (Bulk Delete)

```
DELETE /nutrition-goals/bulk
```

**Mô tả**: Xóa nhiều mục tiêu dinh dưỡng cùng lúc (chỉ các goal thuộc user trong token).

**Lưu ý định tuyến:** Trong NestJS, route `bulk` phải được khai báo **trước** `DELETE :id` — controller đã đặt đúng thứ tự.

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "ids": [1, 2, 3]
}
```

**Response** (200 OK): theo service — thường có `count` / message.

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

### User-based Access
Các API Nutrition Goals sử dụng `@User()` decorator để lấy userId từ token:
- Users chỉ có thể xem/cập nhật/xóa mục tiêu của chính mình
- Admin có thể xem tất cả qua `/nutrition-goals/all` hoặc phân trang qua `/nutrition-goals/admin`

---

## 📝 Ví dụ Flow Quản lý Mục tiêu Dinh dưỡng

### Scenario: User tạo mục tiêu giảm cân

```
1. POST /nutrition-goals
   Body: {
     "goalType": "GOAL_LOSS",
     "targetWeight": 65,
     "targetCalories": 1800,
     "targetProtein": 120,
     "targetCarbs": 180,
     "targetFat": 60,
     "targetFiber": 30,
     "startDate": "2024-01-01",
     "endDate": "2024-03-31"
   }

2. GET /nutrition-goals/current    → Kiểm tra mục tiêu hiện tại

3. PATCH /nutrition-goals/1
   Body: { "status": "NUTR_GOAL_PAUSED" }    // Tạm dừng nếu cần
```

### Scenario: Admin quản lý tất cả mục tiêu

```
1. GET /nutrition-goals/admin?current=1&pageSize=20   → Danh sách phân trang (khuyến nghị)
2. GET /nutrition-goals/all                          → Toàn bộ không phân trang
3. GET /nutrition-goals/5                             → Chi tiết mục tiêu #5
```

---

## 🔗 API Liên quan

### Dinh dưỡng Nguyên liệu
- Xem `@/api_doc/admin-ingredients-management-api.md` - Phần 4 và 5

### Thực phẩm và Dinh dưỡng
- Xem `@/api_doc/admin-food-management-api.md` - Phần Food Nutrition

---

*Document Version: 1.0*
*Last Updated: April 2026*
