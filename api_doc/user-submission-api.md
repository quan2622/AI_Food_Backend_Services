# User Submission API — Đóng góp & Báo cáo

Tài liệu REST API cho bảng **`user_submissions`**: hợp nhất luồng **Báo cáo sai sót (REPORT)** và **Đóng góp món mới (CONTRIBUTION)** thành một "Inbox" duy nhất cho Admin.

**Tiền tố:** `/api/v1` — xem [README.md](./README.md).

**Base path:** `/user-submissions`

---

## Mục lục

1. [Giới thiệu & Mô hình dữ liệu](#1-giới-thiệu--mô-hình-dữ-liệu)
2. [User APIs](#2-user-apis)
   - [Tạo submission mới](#21-tạo-submission-mới)
   - [Lấy danh sách của tôi](#22-lấy-danh-sách-submission-của-tôi)
   - [Hủy submission](#23-hủy-submission)
3. [Community APIs](#3-community-apis)
   - [Vote submission](#31-vote-submission)
4. [Admin APIs](#4-admin-apis)
   - [Lấy tất cả submissions](#41-lấy-tất-cả-submissions)
   - [Lấy thống kê](#42-lấy-thống-kê)
   - [Chi tiết submission](#43-chi-tiết-submission)
   - [Cập nhật status](#44-cập-nhật-status)
   - [Duyệt & xử lý](#45-duyệt--xử-lý)
   - [Từ chối](#46-từ-chối)
5. [Payload Schema](#5-payload-schema)
   - [CONTRIBUTION (Đóng góp mới)](#51-contribution-đóng-góp-mới)
   - [REPORT (Báo cáo sai sót)](#52-report-báo-cáo-sai-sót)
6. [Enums & Constants](#6-enums--constants)
7. [Lỗi thường gặp](#7-lỗi-thường-gặp)
8. [Gợi ý màn hình Admin](#8-gợi-ý-màn-hình-admin)

---

## 1. Giới thiệu & Mô hình dữ liệu

### Schema `user_submissions`

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | number (PK) | Khóa chính tự tăng |
| `userId` | FK (Users) | Người gửi yêu cầu |
| `type` | ENUM | `REPORT` hoặc `CONTRIBUTION` |
| `targetFoodId` | FK (Foods) \| null | ID món ăn bị báo cáo (NULL nếu là món mới) |
| `category` | ENUM | Chi tiết: `WRONG_INFO`, `BAD_IMAGE`, `NEW_FOOD`, `DUPLICATE` |
| `payload` | JSON | Dữ liệu món ăn (Tên, Calo, Protein...) |
| `description` | text \| null | Ghi chú từ người dùng |
| `status` | ENUM | `PENDING`, `APPROVED`, `REJECTED` |
| `adminNote` | text \| null | Lý do từ chối hoặc ghi chú của Admin |
| `upvotes` | number | Số vote ủng hộ (cộng đồng) |
| `downvotes` | number | Số vote phản đối |
| `reliabilityScore` | number | Điểm uy tín của người đóng góp (0-100) |
| `createdAt` | ISO datetime | Thời gian tạo |
| `updatedAt` | ISO datetime | Thời gian cập nhật |

### Các ENUM

```typescript
enum SubmissionType {
  REPORT         // Báo cáo sai sót
  CONTRIBUTION   // Đóng góp món mới
}

enum SubmissionCategory {
  WRONG_INFO     // Thông tin sai
  BAD_IMAGE      // Ảnh kém chất lượng
  NEW_FOOD       // Món ăn mới
  DUPLICATE      // Trùng lặp
}

enum SubmissionStatus {
  PENDING        // Chờ xử lý
  APPROVED       // Đã duyệt
  REJECTED       // Đã từ chối
}
```

---

## 2. User APIs

Tất cả APIs yêu cầu `Authorization: Bearer <token>`.

### 2.1 Tạo submission mới

```
POST /user-submissions
```

**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Body (`CreateSubmissionDto`):**

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `type` | string | ✅ | `REPORT` hoặc `CONTRIBUTION` |
| `targetFoodId` | number | ⚠️ | Bắt buộc nếu `type=REPORT`. ID món ăn cần báo cáo |
| `category` | string | ✅ | `WRONG_INFO`, `BAD_IMAGE`, `NEW_FOOD`, `DUPLICATE` |
| `payload` | object | ✅ | Dữ liệu món ăn (xem [Payload Schema](#5-payload-schema)) |
| `description` | string | Không | Ghi chú thêm |

**Ví dụ — Đóng góp món mới:**

```json
{
  "type": "CONTRIBUTION",
  "category": "NEW_FOOD",
  "payload": {
    "foodName": "Phở gà",
    "description": "Phở gà truyền thống",
    "categoryId": 1,
    "defaultServingGrams": 450,
    "imageUrl": "https://...",
    "nutritionValues": [
      { "nutrientId": 1, "value": 450 },   // Calories
      { "nutrientId": 2, "value": 25 },   // Protein
      { "nutrientId": 3, "value": 60 },   // Carbs
      { "nutrientId": 4, "value": 12 }    // Fat
    ]
  },
  "description": "Món này rất phổ biến ở miền Bắc"
}
```

**Ví dụ — Báo cáo sai thông tin:**

```json
{
  "type": "REPORT",
  "targetFoodId": 101,
  "category": "WRONG_INFO",
  "payload": {
    "calories": 320,
    "protein": 18,
    "carbs": 45,
    "fat": 8
  },
  "description": "Món này thực tế là 320kcal chứ không phải 500kcal như trong database"
}
```

**Response:** `201 Created`

```json
{
  "EC": 0,
  "EM": "Tạo submission thành công",
  "result": {
    "id": 1,
    "userId": 5,
    "type": "CONTRIBUTION",
    "category": "NEW_FOOD",
    "payload": { ... },
    "status": "PENDING",
    "reliabilityScore": 75,
    "createdAt": "2026-04-09T15:00:00.000Z"
  }
}
```

**Lỗi:**
- `400` — Thiếu `targetFoodId` khi `type=REPORT`
- `404` — `targetFoodId` không tồn tại

---

### 2.2 Lấy danh sách submission của tôi

```
GET /user-submissions/my-submissions?type=&category=&status=&current=1&pageSize=10
```

**Query params (tùy chọn):**

| Param | Mô tả |
|-------|-------|
| `type` | Lọc theo `REPORT` / `CONTRIBUTION` |
| `category` | Lọc theo category |
| `status` | Lọc theo `PENDING` / `APPROVED` / `REJECTED` |
| `current` | Trang hiện tại (mặc định: 1) |
| `pageSize` | Số bản ghi/trang (mặc định: 10) |

**Response:** `200 OK`

```json
{
  "EC": 0,
  "EM": "Get user submissions success",
  "meta": {
    "current": 1,
    "pageSize": 10,
    "pages": 2,
    "total": 15
  },
  "result": [
    {
      "id": 1,
      "type": "CONTRIBUTION",
      "category": "NEW_FOOD",
      "status": "PENDING",
      "payload": { ... },
      "description": "...",
      "targetFood": null,
      "createdAt": "2026-04-09T15:00:00.000Z"
    }
  ]
}
```

---

### 2.3 Hủy submission

```
DELETE /user-submissions/my-submissions/:id
```

Chỉ có thể hủy submission đang ở trạng thái `PENDING`.

**Response:** `204 No Content`

**Lỗi:**
- `403` — Không phải chủ sở hữu submission
- `400` — Submission không ở trạng thái PENDING
- `404` — Không tìm thấy submission

---

## 3. Community APIs

### 3.1 Vote submission

```
POST /user-submissions/:id/vote
```

**Body (`VoteSubmissionDto`):**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `voteType` | string | `upvote` hoặc `downvote` |

**Ví dụ:**

```json
{
  "voteType": "upvote"
}
```

**Response:** `200 OK`

```json
{
  "EC": 0,
  "EM": "Vote thành công",
  "result": {
    "id": 1,
    "upvotes": 5,
    "downvotes": 1
  }
}
```

---

## 4. Admin APIs

Yêu cầu `Authorization: Bearer <admin_token>` (user có `isAdmin: true`).

### 4.1 Lấy tất cả submissions

```
GET /user-submissions/admin/all?type=&category=&status=&userId=&targetFoodId=&current=1&pageSize=10
```

**Query params:**

| Param | Mô tả |
|-------|-------|
| `type` | `REPORT` / `CONTRIBUTION` |
| `category` | Lọc theo category |
| `status` | `PENDING` / `APPROVED` / `REJECTED` |
| `userId` | Lọc theo người gửi |
| `targetFoodId` | Lọc theo món ăn bị báo cáo |
| `current` | Trang hiện tại |
| `pageSize` | Số bản ghi/trang |

**Response:** `200 OK`

Kết quả được sắp xếp:
1. `status: PENDING` trước
2. `upvotes` cao trước (ưu tiên cộng đồng quan tâm)
3. `createdAt` mới nhất trước

```json
{
  "EC": 0,
  "EM": "Get all submissions success",
  "meta": { ... },
  "result": [
    {
      "id": 1,
      "type": "CONTRIBUTION",
      "category": "NEW_FOOD",
      "status": "PENDING",
      "upvotes": 10,
      "downvotes": 0,
      "reliabilityScore": 85,
      "user": {
        "id": 5,
        "fullName": "Nguyễn Văn A",
        "email": "a@example.com",
        "avatarUrl": "https://..."
      },
      "targetFood": null,
      "createdAt": "2026-04-09T15:00:00.000Z"
    }
  ]
}
```

---

### 4.2 Lấy thống kê

```
GET /user-submissions/admin/stats
```

**Response:** `200 OK`

```json
{
  "EC": 0,
  "EM": "Get stats success",
  "result": {
    "total": 150,
    "pending": 25,
    "approved": 100,
    "rejected": 25,
    "reports": 80,
    "contributions": 70
  }
}
```

---

### 4.3 Chi tiết submission

```
GET /user-submissions/admin/:id
```

**Response:** `200 OK`

```json
{
  "EC": 0,
  "EM": "Get submission detail success",
  "result": {
    "id": 1,
    "type": "REPORT",
    "category": "WRONG_INFO",
    "status": "PENDING",
    "payload": {
      "calories": 320,
      "protein": 18
    },
    "description": "Thông tin sai",
    "user": { ... },
    "targetFood": {
      "id": 101,
      "foodName": "Cơm tấm sườn bì",
      "imageUrl": "https://...",
      "nutritionProfile": {
        "values": [
          { "nutrient": { "name": "Calories" }, "value": 500 }
        ]
      }
    }
  }
}
```

---

### 4.4 Cập nhật status

```
PATCH /user-submissions/admin/:id/status
```

**Body (`UpdateSubmissionStatusDto`):**

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `status` | string | `PENDING`, `APPROVED`, `REJECTED` |
| `adminNote` | string | Ghi chú của Admin |

**Ví dụ:**

```json
{
  "status": "APPROVED",
  "adminNote": "Thông tin chính xác, đã cập nhật"
}
```

**Response:** `200 OK`

---

### 4.5 Duyệt & xử lý

```
POST /user-submissions/admin/:id/approve
```

API này thực hiện "Một chạm":
- Nếu `type=CONTRIBUTION` → Tạo món ăn mới từ `payload`
- Nếu `type=REPORT` → Cập nhật món ăn `targetFoodId` từ `payload`
- Đổi `status` thành `APPROVED`
- Cập nhật `reliabilityScore` cho người gửi

**Body (tùy chọn):**

```json
{
  "adminNote": "Thông tin đã được xác minh và cập nhật"
}
```

**Response:** `200 OK`

```json
{
  "EC": 0,
  "EM": "Duyệt và xử lý submission thành công",
  "result": {
    "id": 1,
    "status": "APPROVED",
    "adminNote": "Thông tin đã được xác minh và cập nhật",
    "reliabilityScore": 90
  }
}
```

**Lỗi:**
- `400` — Submission không ở trạng thái PENDING

---

### 4.6 Từ chối

```
POST /user-submissions/admin/:id/reject
```

**Body (bắt buộc):**

```json
{
  "adminNote": "Thông tin không chính xác, không có nguồn xác minh"
}
```

**Response:** `200 OK`

```json
{
  "EC": 0,
  "EM": "Từ chối submission thành công",
  "result": {
    "id": 1,
    "status": "REJECTED",
    "adminNote": "Thông tin không chính xác...",
    "reliabilityScore": 70
  }
}
```

**Lỗi:**
- `400` — Submission không ở trạng thái PENDING
- `400` — Thiếu `adminNote`

---

## 5. Payload Schema

### 5.1 CONTRIBUTION (Đóng góp mới)

Payload chứa toàn bộ thông tin món ăn:

```json
{
  "foodName": "Tên món ăn",
  "description": "Mô tả",
  "categoryId": 1,
  "defaultServingGrams": 100,
  "imageUrl": "https://...",
  "nutritionValues": [
    { "nutrientId": 1, "value": 450 },
    { "nutrientId": 2, "value": 25 }
  ]
}
```

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `foodName` | string | Tên món ăn |
| `description` | string | Mô tả món ăn |
| `categoryId` | number | ID danh mục |
| `defaultServingGrams` | number | Khẩu phần mặc định (gram) |
| `imageUrl` | string | URL ảnh |
| `nutritionValues` | array | Mảng giá trị dinh dưỡng |

### 5.2 REPORT (Báo cáo sai sót)

Payload có thể chứa toàn bộ hoặc chỉ những trường cần sửa:

**Báo cáo sai thông tin dinh dưỡng:**

```json
{
  "calories": 320,
  "protein": 18,
  "carbs": 45,
  "fat": 8
}
```

**Báo cáo ảnh kém:**

```json
{
  "imageUrl": "https://.../new-image.jpg"
}
```

**Báo cáo trùng lặp:**

```json
{
  "duplicateOf": 102
}
```

---

## 6. Enums & Constants

### SubmissionType

| Giá trị | Mô tả |
|---------|-------|
| `REPORT` | Báo cáo sai sót về món ăn có sẵn |
| `CONTRIBUTION` | Đóng góp món ăn mới |

### SubmissionCategory

| Giá trị | Dùng cho | Mô tả |
|---------|----------|-------|
| `WRONG_INFO` | REPORT | Thông tin dinh dưỡng sai |
| `BAD_IMAGE` | REPORT | Ảnh kém chất lượng, không đúng |
| `NEW_FOOD` | CONTRIBUTION | Món ăn mới |
| `DUPLICATE` | Cả hai | Trùng lặp với món khác |

### SubmissionStatus

| Giá trị | Mô tả |
|---------|-------|
| `PENDING` | Đang chờ Admin xử lý |
| `APPROVED` | Đã duyệt và xử lý |
| `REJECTED` | Đã từ chối |

---

## 7. Lỗi thường gặp

| HTTP | Tình huống |
|------|------------|
| `401` | Thiếu / sai JWT |
| `403` | Không phải Admin khi gọi Admin APIs |
| `400` | Validation DTO (thiếu field, sai kiểu...) |
| `400` | `type=REPORT` nhưng thiếu `targetFoodId` |
| `400` | Hủy/Duyệt/Từ chối submission không ở trạng thái PENDING |
| `404` | Không tìm thấy submission hoặc targetFoodId |

---

## 8. Gợi ý màn hình Admin

| Màn hình | API gợi ý |
|----------|-----------|
| **Inbox Dashboard** — Tổng quan các submission | `GET /user-submissions/admin/stats` |
| **Danh sách submissions** — Phân trang, lọc, sort | `GET /user-submissions/admin/all?status=PENDING` |
| **Chi tiết & Xử lý** — So sánh dữ liệu cũ/mới | `GET /user-submissions/admin/:id` |
| **Duyệt nhanh** — Một chạm approve | `POST /user-submissions/admin/:id/approve` |
| **Từ chối có lý do** | `POST /user-submissions/admin/:id/reject` |
| **Cập nhật status thủ công** | `PATCH /user-submissions/admin/:id/status` |

### Workflow gợi ý cho Admin:

1. **Xem danh sách:** `/admin/all?status=PENDING&sort=-upvotes,-createdAt`
   - Ưu tiên submission có nhiều upvotes (cộng đồng quan tâm)
   - Ưu tiên reliabilityScore cao (người dùng uy tín)

2. **Xem chi tiết:** `/admin/:id`
   - Xem `targetFood` (nếu REPORT) để so sánh với `payload`
   - Xem `user.reliabilityScore`

3. **Xử lý:**
   - Nếu đúng: `POST /admin/:id/approve` → Tự động cập nhật database
   - Nếu sai: `POST /admin/:id/reject` + ghi chú lý do

---

*Document version: 1.0*  
*Last updated: April 2026*
