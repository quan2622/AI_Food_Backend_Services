# API — Allcodes (mã tham chiếu)

Dùng cho **dropdown**, nhãn hiển thị, map `keyMap` → `value`/`description` (ví dụ loại bữa ăn, trạng thái, …).

**Base path:** `/allcodes`  
**Prefix đầy đủ:** `/api/v1/allcodes`

**Bảo vệ:** toàn bộ controller cần JWT (không có `@Public()`).

---

## 1. Tạo một bản ghi

```
POST /allcodes
```

**Body (CreateAllcodeDto):** `keyMap`, `type`, `value`, `description` (theo validation trong DTO).

---

## 2. Tạo hàng loạt

```
POST /allcodes/bulk
```

**Body:** `{ "items": [ ... ] }` — mảng không rỗng.

---

## 3. Liệt kê

```
GET /allcodes
GET /allcodes?type=<string>
```

- Không query: trả về tất cả (theo service).
- `type`: lọc theo loại mã.

---

## 3a. [Admin] Phân trang + lọc (aqp) — khuyến nghị cho bảng cấu hình mã

```
GET /allcodes/admin?current=1&pageSize=10&...
```

**Mô tả:** `AdminGuard` (JWT + `isAdmin: true`). Lọc/sort theo [api-query-params](https://github.com/koajs/aqp).

**Sort mặc định:** `updatedAt` giảm dần.

**Query:** `current`, `pageSize`, và các tham số `filter` / sort (ví dụ lọc theo `type`, `keyMap`).

**Response** (trong `data`): `{ EC, EM, meta, result }`.

- **`meta`:** `current`, `pageSize`, `pages`, `total`
- **`result`:** mảng bản ghi `AllCode` (`id`, `keyMap`, `type`, `value`, `description`, …)

Dùng cho màn admin chỉnh sửa hàng loạt mã tham chiếu; với danh sách đơn giản theo `type` vẫn có thể dùng `GET /allcodes?type=...` (không cần admin).

---

## 4. Tra theo keyMap

```
GET /allcodes/key/:keyMap
```

**Param:** `keyMap` — string (ví dụ mã enum dùng trong `Meal.mealType`).

---

## 5. Chi tiết theo id

```
GET /allcodes/:id
```

---

## 6. Cập nhật

```
PATCH /allcodes/:id
```

---

## 7. Xóa

```
DELETE /allcodes/:id
DELETE /allcodes/bulk
```

**Bulk:** body `{ "ids": [1,2,3] }` (theo `BulkDeleteAllCodeDto`).

---

## Gợi ý cho admin UI

- Trang “Cấu hình / Danh mục mã” dùng `GET /allcodes?type=...` để chỉnh sửa nhóm.
- Khi hiển thị tên bữa ăn đẹp, đồng bộ với `MealService` (enrich `mealType` từ AllCode).

---

*Cập nhật: tháng 4/2026*
