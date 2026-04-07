# Admin API Documentation - User Management

Tài liệu API dành cho Admin để quản lý Users, User Profiles và User Allergies.

---

## Tiền tố & response

- **URL đầy đủ:** `{origin}/api/v1` + path bên dưới (hỗ trợ thêm `/api/v2`).
- **JWT:** `Authorization: Bearer <access_token>`.
- **Response:** thường bọc trong `{ metadata, data }` — xem [README.md](./README.md).

---

## 📋 Mục lục

1. [Users Management](#1-users-management)
2. [User Profiles](#2-user-profiles)
3. [User Allergies](#3-user-allergies)

---

## 1. Users Management

Base path: `/users`

### 1.0 [Admin] Danh sách user có phân trang & lọc (khuyến nghị cho trang admin)

```
GET /users/admin?current=1&pageSize=10&...
```

**Mô tả:** Phân trang và lọc qua `api-query-params` (filter, sort). `AdminGuard` bắt buộc `isAdmin: true`.

**Sort mặc định:** `updatedAt` giảm dần.

**Query:**

| Tên | Kiểu | Mô tả |
|-----|------|--------|
| current | number | Trang (thường bắt đầu 1) |
| pageSize | number | Kích thước trang |
| (khác) | — | Tham số lọc/sort theo chuẩn aqp trên query string |

**Response:** Object dạng `{ EC, EM, meta: { current, pageSize, pages, total }, result: [...] }` — user **không** chứa password (đã strip).

---

### 1.0b User hiện tại (đã đăng nhập)

```
GET /users/me
```

**Mô tả:** Thông tin user theo JWT + `userProfile`.

---

### 1.1 Lấy danh sách Users (findMany thô)

```
GET /users
```

**Mô tả:** `findMany` toàn bộ user — **có thể bao gồm trường nhạy cảm** tùy phiên bản service. Cho màn admin, **ưu tiên `GET /users/admin`**.

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "avatarUrl": "https://...",
    "isAdmin": false,
    "status": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "userProfile": {
      "id": 1,
      "age": 25,
      "height": 170,
      "weight": 65,
      "bmi": 22.5,
      "bmr": 1500,
      "tdee": 2200
    }
  }
]
```

---

### 1.2 Lấy thông tin chi tiết 1 User

```
GET /users/:id
```

**Mô tả**: Lấy thông tin chi tiết của một user theo ID

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của user |

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "user@example.com",
  "fullName": "Nguyễn Văn A",
  "avatarUrl": "https://...",
  "isAdmin": false,
  "status": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "userProfile": { ... },
  "allergies": [ ... ],
  "nutritionGoals": [ ... ]
}
```

---

### 1.3 Tạo User mới

```
POST /users
```

**Mô tả**: Tạo một user mới trong hệ thống

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "newuser@example.com",        // Bắt buộc - Email hợp lệ
  "password": "123456",                   // Bắt buộc - Tối thiểu 6 ký tự
  "fullName": "Nguyễn Văn B",             // Bắt buộc - Họ tên
  "genderCode": "MALE",                   // Tùy chọn - MALE/FEMALE/OTHER
  "avatarUrl": "https://...",             // Tùy chọn - URL ảnh đại diện
  "birthOfDate": "1999-01-01",            // Tùy chọn - Ngày sinh (ISO date)
  "isAdmin": false                        // Tùy chọn - Mặc định false
}
```

**Validation Rules**:
- `email`: Phải là email hợp lệ
- `password`: Tối thiểu 6 ký tự, tối đa 100
- `fullName`: Không được để trống, tối đa 255 ký tự
- `genderCode`: MALE, FEMALE, hoặc OTHER
- `avatarUrl`: Tối đa 500 ký tự

**Response** (201 Created):
```json
{
  "id": 2,
  "email": "newuser@example.com",
  "fullName": "Nguyễn Văn B",
  "isAdmin": false,
  "status": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 1.4 Cập nhật thông tin User

```
PATCH /users/:id
```

**Mô tả**: Cập nhật thông tin của một user

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của user |

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body** (tất cả đều tùy chọn):
```json
{
  "email": "updated@example.com",
  "fullName": "Nguyễn Văn C",
  "avatarUrl": "https://...",
  "genderCode": "FEMALE",
  "birthOfDate": "1998-05-20",
  "isAdmin": true
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "email": "updated@example.com",
  "fullName": "Nguyễn Văn C",
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

---

### 1.5 Cập nhật mật khẩu User

```
PATCH /users/:id/password
```

**Mô tả**: Đổi mật khẩu cho user (Admin có thể reset password)

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của user |

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "newPassword": "newpassword123"    // Bắt buộc - Tối thiểu 6 ký tự
}
```

**Response** (200 OK):
```json
{
  "message": "Password updated successfully"
}
```

---

### 1.6 Cập nhật trạng thái User (Active/Inactive)

```
PATCH /users/:id/status
```

**Mô tả**: Kích hoạt hoặc vô hiệu hóa tài khoản user

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của user |

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "status": false    // Bắt buộc - true (active) hoặc false (inactive)
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "status": false,
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

---

### 1.7 Xóa User

```
DELETE /users/:id
```

**Mô tả**: Xóa user khỏi hệ thống (CASCADE - xóa cả profile, allergies, goals...)

⚠️ **Cảnh báo**: Xóa user sẽ xóa tất cả dữ liệu liên quan:
- User Profile
- User Allergies
- Nutrition Goals
- Daily Logs
- Workout Logs
- Reports
- Food Images

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của user |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (204 No Content):
```
(empty body)
```

---

## 2. User Profiles

Base path: `/user-profiles`

### 2.0 [Admin] Danh sách profile có phân trang (khuyến nghị)

```
GET /user-profiles/admin?current=1&pageSize=10&...
```

**Mô tả:** `AdminGuard` + filter/sort qua query (giống pattern `users/admin`).

**Sort mặc định:** `updatedAt` giảm dần.

---

### 2.1 Lấy danh sách tất cả Profiles (mảng phẳng)

```
GET /user-profiles/all
```

**Mô tả**: Lấy danh sách tất cả user profiles — **chỉ cần JWT** (controller không gắn `AdminGuard` trong code hiện tại).

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "age": 25,
    "height": 170.5,
    "weight": 65.0,
    "bmi": 22.49,
    "bmr": 1523.5,
    "tdee": 2200.0,
    "gender": "MALE",
    "activityLevel": "ACT_MODERATE",
    "userId": 1,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "fullName": "Nguyễn Văn A"
    }
  }
]
```

---

### 2.2 Lấy Profile theo User ID

```
GET /user-profiles/by-user/:userId
```

**Mô tả**: Lấy profile của một user cụ thể

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| userId | number | ✅ | ID của user |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "age": 25,
  "height": 170.5,
  "weight": 65.0,
  "bmi": 22.49,
  "bmr": 1523.5,
  "tdee": 2200.0,
  "gender": "MALE",
  "activityLevel": "MODERATELY_ACTIVE",
  "userId": 1
}
```

---

### 2.3 Lấy Profile theo Profile ID

```
GET /user-profiles/:id
```

**Mô tả**: Lấy profile theo ID của profile

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của profile |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK): *Giống 2.2*

---

### 2.4 Tạo Profile cho User

```
POST /user-profiles
```

**Mô tả**: User tự tạo profile cho chính mình (mỗi user chỉ có 1 profile)

⚠️ **Lưu ý**: Mỗi user chỉ có 1 profile duy nhất (quan hệ 1-1). User phải đăng nhập để tạo profile.

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "age": 25,                            // Bắt buộc - 1-100
  "height": 170.5,                      // Bắt buộc - Chiều cao (cm)
  "weight": 65.0,                       // Bắt buộc - Cân nặng (kg)
  "gender": "MALE",                     // Tùy chọn - MALE/FEMALE/UNDEFINED
  "activityLevel": "ACT_MODERATE"       // Tùy chọn - ACT_* (xem bảng Activity Level)
}
```

**Gender (optional):** `MALE` \| `FEMALE` \| `UNDEFINED`

**Activity Level (optional)** — enum trong schema:

| Giá trị | Gợi ý mô tả |
|---------|-------------|
| ACT_SEDENTARY | Ít vận động |
| ACT_LIGHT | Nhẹ |
| ACT_MODERATE | Vừa |
| ACT_VERY | Nhiều |
| ACT_SUPER | Rất cao |

**Tự động tính toán**: Khi tạo profile, hệ thống tự động tính:
- `bmi`: Body Mass Index
- `bmr`: Basal Metabolic Rate
- `tdee`: Total Daily Energy Expenditure

**Response** (201 Created):
```json
{
  "id": 1,
  "age": 25,
  "height": 170.5,
  "weight": 65.0,
  "bmi": 22.49,
  "bmr": 1523.5,
  "tdee": 2200.0,
  "userId": 1,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 2.5 Cập nhật Profile theo Profile ID

```
PATCH /user-profiles/:id
```

**Mô tả**: Cập nhật thông tin profile

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của profile |

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body** (tất cả tùy chọn):
```json
{
  "age": 26,
  "height": 171.0,
  "weight": 66.5,
  "gender": "MALE",
  "activityLevel": "VERY_ACTIVE"
}
```

**Tự động tính toán lại**: BMI, BMR, TDEE sẽ được tính lại khi weight/height/age thay đổi

**Response** (200 OK):
```json
{
  "id": 1,
  "age": 26,
  "height": 171.0,
  "weight": 66.5,
  "bmi": 22.75,
  "bmr": 1540.0,
  "tdee": 2400.0,
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

---

### 2.6 Xóa Profile

```
DELETE /user-profiles/:id
```

**Mô tả**: Xóa profile của user (Admin)

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của profile |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (204 No Content)

---

### 2.7 User tự xem Profile của mình

```
GET /user-profiles
```

**Mô tả**: User đăng nhập tự xem profile của chính mình

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (200 OK): *Giống 2.2*

---

### 2.8 User tự cập nhật Profile của mình

```
PATCH /user-profiles
```

**Mô tả**: User đăng nhập tự cập nhật profile của chính mình

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (tất cả tùy chọn):
```json
{
  "age": 26,
  "height": 171.0,
  "weight": 66.5,
  "gender": "MALE",
  "activityLevel": "VERY_ACTIVE"
}
```

**Tự động tính toán lại**: BMI, BMR, TDEE sẽ được tính lại khi weight/height/age thay đổi

**Response** (200 OK): *Giống 2.5*

---

### 2.9 User tự xóa Profile của mình

```
DELETE /user-profiles
```

**Mô tả**: User đăng nhập tự xóa profile của chính mình

**Headers**:
```
Authorization: Bearer <token>
```

**Response** (204 No Content)

---

## 3. User Allergies

Base path: `/user-allergies`

### 3.0 [Admin] Danh sách dị ứng có phân trang

```
GET /user-allergies/admin?current=1&pageSize=10&...
```

**Mô tả:** `AdminGuard`. Lọc/sort theo [api-query-params](https://github.com/koajs/aqp) (giống `GET /users/admin`).

**Sort mặc định:** `updatedAt` giảm dần.

**Query:** `current`, `pageSize`, và các tham số `filter` / sort theo aqp.

**Response** (trong `data`): `{ EC, EM, meta, result }`.

- **`meta`:** `current`, `pageSize`, `pages`, `total`
- **`result`:** mảng nhóm theo **user** (`userId`, `user`, `allergies[]`). Trong mỗi phần tử `allergies`:
  - `severity`: mã Prisma (`SEV_*`)
  - **`severityInfo`**: map từ bảng `all_codes` theo `keyMap` = `severity` — gồm `keyMap`, `value`, `description`, `type` (nhãn hiển thị cho mức độ dị ứng)
  - `allergen`, `note`, …

---

### 3.1 Lấy danh sách Allergies của User

```
GET /user-allergies/user/:userId
```

**Mô tả**: Lấy danh sách tất cả dị ứng của một user

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| userId | number | ✅ | ID của user |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "severity": "SEV_HIGH",
    "note": "Phản ứng nghiêm trọng với đậu phộng",
    "userId": 1,
    "allergenId": 1,
    "allergen": {
      "id": 1,
      "name": "Đậu phộng",
      "description": "Peanut allergy"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### 3.2 Lấy chi tiết 1 User Allergy

```
GET /user-allergies/:id
```

**Mô tả**: Lấy thông tin chi tiết của một bản ghi dị ứng

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của user allergy |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "severity": "SEV_HIGH",
  "note": "Phản ứng nghiêm trọng",
  "userId": 1,
  "allergenId": 1,
  "allergen": {
    "id": 1,
    "name": "Đậu phộng",
    "description": "Peanut"
  },
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 3.3 Thêm Allergy cho User

```
POST /user-allergies
```

**Mô tả**: Thêm một chất gây dị ứng mới cho user

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": 1,                          // Bắt buộc - ID của user
  "allergenId": 1,                      // Bắt buộc - ID của chất gây dị ứng
  "severity": "SEV_HIGH",               // Bắt buộc — giá trị Prisma (xem bảng Severity)
  "note": "Phản ứng nghiêm trọng"       // Tùy chọn - Ghi chú, tối đa 1000 ký tự
}
```

**Severity** (enum `SeverityType` trong DB):

| Giá trị | Mô tả |
|---------|-------|
| SEV_LOW | Nhẹ |
| SEV_MEDIUM | Trung bình |
| SEV_HIGH | Nặng |
| SEV_LIFE_THREATENING | Nguy hiểm tính mạng |

**Lưu ý:** DTO có thể đang validate tập khác — khi gọi API nếu bị 400, thử đúng giá trị Prisma ở bảng trên.

**Validation**:
- Mỗi user không thể có trùng `allergenId` (unique constraint)
- Nếu thêm trùng sẽ báo lỗi 409 Conflict

**Response** (201 Created):
```json
{
  "id": 1,
  "userId": 1,
  "allergenId": 1,
  "severity": "SEV_HIGH",
  "note": "Phản ứng nghiêm trọng",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 3.4 Cập nhật User Allergy

```
PATCH /user-allergies/:id
```

**Mô tả**: Cập nhật thông tin dị ứng (severity, note)

⚠️ **Lưu ý**: Không thể đổi `userId` hoặc `allergenId`, chỉ đổi được `severity` và `note`

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của user allergy |

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body** (tất cả tùy chọn):
```json
{
  "severity": "SEV_LIFE_THREATENING",
  "note": "Cực kỳ nguy hiểm, cần mang theo epinephrine"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "userId": 1,
  "allergenId": 1,
  "severity": "SEV_LIFE_THREATENING",
  "note": "Cực kỳ nguy hiểm...",
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

---

### 3.5 Xóa User Allergy

```
DELETE /user-allergies/:id
```

**Mô tả**: Xóa một bản ghi dị ứng của user

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của user allergy |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (204 No Content)

---

## 🔐 Authentication & Authorization

### Admin Token
Tất cả API Admin yêu cầu JWT token với quyền admin:

```
Authorization: Bearer <jwt_token>
```

Token phải chứa claim `isAdmin: true`

### Status Codes

| Code | Ý nghĩa |
|------|---------|
| 200 | Thành công |
| 201 | Tạo thành công |
| 204 | Xóa thành công (no content) |
| 400 | Bad Request - Dữ liệu không hợp lệ |
| 401 | Unauthorized - Chưa đăng nhập |
| 403 | Forbidden - Không có quyền admin |
| 404 | Not Found - Không tìm thấy resource |
| 409 | Conflict - Dữ liệu bị trùng (unique constraint) |

---

## 📝 Ví dụ Flow Admin Quản Lý User

### Scenario: Tạo user mới với profile và allergies

```
1. POST /users                    → Tạo user, nhận userId (ví dụ: 5)
2. POST /user-profiles            → Tạo profile cho user 5
3. POST /user-allergies           → Thêm allergy cho user 5 (nếu cần)
```

### Scenario: Xem và cập nhật thông tin user

```
1. GET /users/5                   → Xem thông tin user
2. GET /user-profiles/by-user/5   → Xem profile của user
3. GET /user-allergies/user/5     → Xem allergies của user
4. PATCH /users/5                 → Cập nhật thông tin nếu cần
5. PATCH /user-profiles/:id       → Cập nhật profile nếu cần
```

---

*Document Version: 1.0*
*Last Updated: April 2026*
