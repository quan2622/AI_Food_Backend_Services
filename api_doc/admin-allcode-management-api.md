# Admin API — Quản lý AllCode (mã tham chiếu)

Tài liệu REST API cho bảng **`AllCode`**: mã chuẩn hoá dùng xuyên hệ thống (nhãn hiển thị, dropdown, map `keyMap` → `value`/`description`). Ví dụ: loại bữa ăn (`MEAL_BREAKFAST`), trạng thái nhật ký (`STATUS_MET`), mức độ dị ứng, …

**Tiền tố:** `/api/v1` — xem [README.md](./README.md).

**Base path:** `/allcodes`

---

## Mục lục

1. [Vai trò & xác thực](#1-vai-trò--xác-thực)
2. [Mô hình dữ liệu](#2-mô-hình-dữ-liệu)
3. [Tạo một bản ghi](#3-tạo-một-bản-ghi)
4. [Tạo hàng loạt](#4-tạo-hàng-loạt)
5. [Liệt kê (theo type hoặc toàn bộ)](#5-liệt-kê-theo-type-hoặc-toàn-bộ)
6. [[Admin] Phân trang + lọc (aqp)](#6-admin-phân-trang--lọc-aqp)
7. [Tra cứu theo keyMap](#7-tra-cứu-theo-keymap)
8. [Chi tiết theo id](#8-chi-tiết-theo-id)
9. [Cập nhật](#9-cập-nhật)
10. [Xóa một / xóa hàng loạt](#10-xóa-một--xóa-hàng-loạt)
11. [Lỗi thường gặp](#11-lỗi-thường-gặp)
12. [Gợi ý màn hình admin](#12-gợi-ý-màn-hình-admin)

---

## 1. Vai trò & xác thực

| Yếu tố | Mô tả |
|--------|--------|
| **JWT** | Toàn bộ route dưới `/allcodes` nằm sau **global `JwtAuthGuard`**: cần header `Authorization: Bearer <access_token>`. |
| **Admin chỉ trên phân trang** | `GET /allcodes/admin` có thêm **`AdminGuard`**: JWT phải có `isAdmin: true`. |
| **POST / PATCH / DELETE (không `/admin`)** | Chỉ cần user đã đăng nhập; **không** bắt buộc admin trong code hiện tại. Nếu production chỉ cho admin chỉnh mã, nên bổ sung `AdminGuard` trên các route ghi. |

---

## 2. Mô hình dữ liệu

Bảng `all_codes` (model Prisma `AllCode`):

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|--------|
| `id` | number | — | Khóa chính (auto) |
| `keyMap` | string | ✅ | Mã ổn định, **duy nhất** (thường trùng với enum/key trong code, ví dụ `MEAL_LUNCH`) |
| `type` | string | ✅ | Nhóm mã (ví dụ `MEAL`, `STATUS`, `SEVERITY`) — dùng lọc `GET ?type=` |
| `value` | string | ✅ | Nhãn hiển thị (ví dụ "Bữa trưa") |
| `description` | string \| null | Không | Mô tả thêm |
| `createdAt` | ISO datetime | — | Ngày tạo |
| `updatedAt` | ISO datetime | — | Ngày cập nhật |

---

## 3. Tạo một bản ghi

```
POST /allcodes
```

**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

**Body** (`CreateAllcodeDto`):

| Trường | Kiểu | Ràng buộc |
|--------|------|-----------|
| `keyMap` | string | Bắt buộc, tối đa 100 ký tự |
| `type` | string | Bắt buộc, tối đa 100 ký tự |
| `value` | string | Bắt buộc, tối đa 255 ký tự |
| `description` | string | Tùy chọn, tối đa 500 ký tự |

**Response:** `201 Created` — object `AllCode` vừa tạo.

**Lỗi:** `409 Conflict` nếu `keyMap` đã tồn tại (message dạng `keyMap "..." đã tồn tại`).

**Ví dụ:**

```json
{
  "keyMap": "MEAL_SNACK",
  "type": "MEAL",
  "value": "Bữa phụ",
  "description": "Ăn vặt giữa các bữa chính"
}
```

---

## 4. Tạo hàng loạt

```
POST /allcodes/bulk
```

**Body** (`BulkCreateAllcodeDto`):

```json
{
  "items": [
    {
      "keyMap": "SEV_LOW",
      "type": "SEVERITY",
      "value": "Nhẹ",
      "description": null
    }
  ]
}
```

- `items`: mảng **không được rỗng**; mỗi phần tử cùng rule như `CreateAllcodeDto`.

**Response:** `201 Created`

```json
{
  "createdCount": 1
}
```

**Lưu ý backend:** `createMany` dùng `skipDuplicates: true` — bản ghi trùng `keyMap` sẽ bị bỏ qua, không ném lỗi; `createdCount` là số bản ghi thực sự insert.

---

## 5. Liệt kê (theo type hoặc toàn bộ)

```
GET /allcodes
GET /allcodes?type=<string>
```

**Headers:** `Authorization: Bearer <token>`

| Query | Mô tả |
|-------|--------|
| *(không có)* | Tất cả bản ghi, `orderBy`: `type` tăng dần |
| `type` | Lọc theo `type`, `orderBy`: `keyMap` tăng dần |

**Response:** `200 OK` — mảng `AllCode[]`.

Dùng cho dropdown theo nhóm mã (không cần quyền admin).

---

## 6. [Admin] Phân trang + lọc (aqp)

```
GET /allcodes/admin?current=1&pageSize=10&...
```

**Headers:** `Authorization: Bearer <admin_token>` (`isAdmin: true`)

**Query bắt buộc thường dùng:**

| Tham số | Ý nghĩa |
|---------|---------|
| `current` | Số trang (thường bắt đầu `1`) |
| `pageSize` | Số bản ghi / trang |

**Lọc & sort:** theo [api-query-params](https://github.com/koajs/aqp) — tham số lọc đưa vào `filter`, sort theo quy ước aqp (giống các module admin khác).

**Định dạng `filter` (tránh 500 với Prisma):**

- Chuỗi kiểu `filter[type]=GOAL` thường được HTTP parser chuyển thành object lồng `{ filter: { type: 'GOAL' } }` — hợp lệ.
- Một số client (hoặc chuỗi query đưa thẳng vào `aqp`) lại tạo key phẳng literal `filter[type]` trong object filter; Prisma không có field đó → lỗi. Backend đã **chuẩn hoá** key `filter[field]` thành `field` (ví dụ `filter[type]` → `type`) trong `stripAdminPaginationFilter` dùng chung cho mọi admin pagination.

**Sort mặc định** (khi không truyền `sort`): `updatedAt` **giảm dần**.

**Ví dụ lọc theo nhóm `type`:**

```
GET /api/v1/allcodes/admin?current=1&pageSize=20&filter[type]=MEAL
```

(Tương đương `filter[type]=GOAL` cho nhóm mã goal.)

**Ví dụ tìm theo tên hiển thị (regex, nếu client gửi đúng cú pháp aqp):**

```
GET /api/v1/allcodes/admin?current=1&pageSize=10&filter[value][$regex]=bữa
```

**Response** (trong `data` sau interceptor; hoặc trực tiếp tùy cấu hình):

```json
{
  "EC": 0,
  "EM": "Get all codes with query paginate success (admin)",
  "meta": {
    "current": 1,
    "pageSize": 10,
    "pages": 5,
    "total": 48
  },
  "result": [
    {
      "id": 1,
      "keyMap": "MEAL_BREAKFAST",
      "type": "MEAL",
      "value": "Bữa sáng",
      "description": null,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## 7. Tra cứu theo keyMap

```
GET /allcodes/key/:keyMap
```

**Param:** `keyMap` — chuỗi (có thể chứa ký tự đặc biệt tùy URL encode).

**Response:** `200 OK` — một object `AllCode`.

**Lỗi:** `404` nếu không có bản ghi với `keyMap` đó.

**Lưu ý routing:** route `key/:keyMap` được khai báo **trước** `GET /allcodes/:id` để tránh nhầm `key` thành id số.

---

## 8. Chi tiết theo id

```
GET /allcodes/:id
```

**Response:** `200 OK` — `AllCode`.

**Lỗi:** `404` nếu id không tồn tại.

---

## 9. Cập nhật

```
PATCH /allcodes/:id
```

**Body** (`UpdateAllcodeDto`): tất cả trường **tùy chọn** (partial của create). Có thể chỉ gửi field cần đổi.

- Đổi `keyMap` sang giá trị đã tồn tại → `409 Conflict`.

**Response:** `200 OK` — bản ghi sau cập nhật.

---

## 10. Xóa một / xóa hàng loạt

### Xóa một

```
DELETE /allcodes/:id
```

**Response:** `204 No Content`

**Lỗi:** `404` nếu không tồn tại.

### Xóa hàng loạt

```
DELETE /allcodes/bulk
```

**Body** (`BulkDeleteAllCodeDto`):

```json
{
  "ids": [1, 2, 3]
}
```

- `ids`: mảng số nguyên dương, **không rỗng**.

**Response:** `200 OK`

```json
{
  "deletedCount": 3
}
```

Id không tồn tại vẫn được bỏ qua bởi `deleteMany`; `deletedCount` là số dòng thực sự xóa.

**Lưu ý routing:** trong code, `DELETE /allcodes/bulk` phải khớp trước pattern `DELETE /allcodes/:id` (đã đúng thứ tự trong controller).

---

## 11. Lỗi thường gặp

| HTTP | Tình huống |
|------|------------|
| `401` | Thiếu / sai JWT |
| `403` | Gọi `GET /allcodes/admin` khi user không phải admin |
| `404` | Sai `id` hoặc `keyMap` khi tra cứu |
| `409` | Trùng `keyMap` khi create / update |
| `400` | Validation DTO (thiếu field bắt buộc, sai kiểu, …) |

---

## 12. Gợi ý màn hình admin

| Màn hình | API gợi ý |
|----------|-----------|
| Bảng toàn bộ mã có phân trang, lọc, sort | `GET /allcodes/admin` |
| Form sửa theo nhóm (ít bản ghi) | `GET /allcodes?type=MEAL` + `PATCH /allcodes/:id` |
| Seed / import nhiều dòng | `POST /allcodes/bulk` |
| Kiểm tra một mã cố định trong code | `GET /allcodes/key/MEAL_LUNCH` |
| Xóa nhiều dòng đã chọn | `DELETE /allcodes/bulk` |

Đồng bộ với các module khác: khi thêm `keyMap` mới cho enum (ví dụ `MealType`), nên có bản ghi AllCode tương ứng để API enrich (`mealTypeInfo`, `statusInfo`, …) hiển thị đúng.

---

*Document version: 1.0*  
*Last updated: April 2026*
