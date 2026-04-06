# API — Meal items (món trong bữa)

Quản lý từng **món ăn** gắn với một `Meal` (bữa trong `DailyLog`).

**Base path:** `/meal-items`  
**Prefix:** `/api/v1/meal-items`

**Bảo vệ:** JWT; thao tác create/update/delete gắn `userId` từ token (user chỉ sửa được dữ liệu của mình; admin dùng cùng API nếu có quyền sở hữu hoặc cần bổ sung backend riêng).

---

## 1. Thêm món vào bữa

```
POST /meal-items
```

**Body:** `CreateMealItemDto` — `mealId`, `foodId`, khối lượng / macro (theo DTO trong `src/modules/meal-item/dto/`).

---

## 2. Danh sách món theo meal

```
GET /meal-items/meal/:mealId
```

Dùng sau khi admin mở chi tiết một `Meal` (từ `GET /meals/all` hoặc `GET /meals/:id`).

---

## 3. Chi tiết một meal item

```
GET /meal-items/:id
```

---

## 4. Cập nhật

```
PATCH /meal-items/:id
```

---

## 5. Xóa

```
DELETE /meal-items/:id
```

**Response:** `204 No Content`.

---

## Liên kết tài liệu

- Bữa ăn: [admin-logs-tracking-api.md](./admin-logs-tracking-api.md) (Meals)
- Thực phẩm: [admin-food-management-api.md](./admin-food-management-api.md)

---

*Cập nhật: tháng 4/2026*
