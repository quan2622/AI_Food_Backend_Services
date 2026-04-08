# Admin API Documentation - Ingredients Management

Tài liệu API dành cho Admin để quản lý Nguyên liệu, Chất gây dị ứng (Allergens) và Dinh dưỡng Nguyên liệu.

**Tiền tố:** `/api/v1` — xem [README.md](./README.md).

---

## 📋 Mục lục

0. [Nguyên liệu (Ingredients)](#0-nguyên-liệu-ingredients) — gồm `GET /ingredients/admin`
1. [Chất gây dị ứng (Allergens)](#1-chất-gây-dị-ứng-allergens) — gồm `GET /allergens/admin`
2. [Liên kết Nguyên liệu - Allergen](#2-liên-kết-nguyên-liệu---allergen) — gồm `GET /ingredient-allergens/admin`
3. [Nguyên liệu trong Món ăn (Dish Ingredients)](#3-nguyên-liệu-trong-món-ăn-dish-ingredients)
4. [Dinh dưỡng Nguyên liệu (Ingredient Nutrition)](#4-dinh-dưỡng-nguyên-liệu-ingredient-nutrition)
5. [Chỉ số Dinh dưỡng (Nutrition Components)](#5-chỉ-số-dinh-dưỡng-nutrition-components)

---

## 0. Nguyên liệu (Ingredients)

Base path: `/ingredients`

### 0.0 [Admin] Phân trang + lọc (aqp) — danh sách nguyên liệu

```
GET /ingredients/admin?current=1&pageSize=10&...
```

**Mô tả:** `AdminGuard`. Lọc/sort theo [api-query-params](https://github.com/koajs/aqp).

**Sort mặc định:** `updatedAt` giảm dần.

**Response** (trong `data`): `{ EC, EM, meta, result }` — `result` là mảng `Ingredient`.

---

### 0.1 Lấy danh sách nguyên liệu

```
GET /ingredients
```

**Mô tả:** Lấy toàn bộ nguyên liệu, sắp theo `ingredientName` tăng dần.

---

### 0.2 Lấy chi tiết 1 nguyên liệu

```
GET /ingredients/:id
```

**Params:** `id` (number).

---

### 0.3 Tạo nguyên liệu mới (form-data + upload Cloudinary)

```
POST /ingredients
```

**Mô tả:** `AdminGuard`. Nhận `multipart/form-data`, upload ảnh lên Cloudinary rồi lưu `imageUrl` vào bảng `ingredients`.

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Form Data**:
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `ingredientName` | string | ✅ | Tên nguyên liệu (<= 255 ký tự) |
| `description` | string | | Mô tả (<= 1000 ký tự) |
| `image` | file(binary) | ✅ | Ảnh `jpeg/png/webp`, tối đa 5MB |

**Response** (201 Created):
```json
{
  "id": 123,
  "ingredientName": "con mèo",
  "description": "abc",
  "imageUrl": "https://res.cloudinary.com/.../ingredient.jpg",
  "createdAt": "2026-04-08T00:45:00.000Z",
  "updatedAt": "2026-04-08T00:45:00.000Z"
}
```

---

### 0.4 Cập nhật nguyên liệu (form-data, ảnh tùy chọn)

```
PATCH /ingredients/:id
```

**Mô tả:** `AdminGuard`. `multipart/form-data`. Các field text đều tùy chọn; nếu gửi `image` mới thì upload lên Cloudinary và cập nhật `imageUrl`, không gửi `image` thì giữ nguyên ảnh cũ.

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Form Data**:
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `ingredientName` | string | | Tên nguyên liệu (<= 255 ký tự) |
| `description` | string | | Mô tả (<= 1000 ký tự) |
| `image` | file(binary) | | Ảnh mới `jpeg/png/webp`, tối đa 5MB — nếu có thì upload Cloudinary và lưu URL |

**Response** (200 OK): bản ghi `Ingredient` sau khi cập nhật.

---

## 1. Chất gây dị ứng (Allergens)

Base path: `/allergens`

Allergens là các chất gây dị ứng độc lập (ví dụ: Đậu phộng, Hải sản, Gluten...).

### 1.0 [Admin] Phân trang + lọc (aqp) — khuyến nghị

```
GET /allergens/admin?current=1&pageSize=10&...
```

**Mô tả:** `AdminGuard`. Lọc/sort theo [api-query-params](https://github.com/koajs/aqp).

**Sort mặc định:** `updatedAt` giảm dần.

**Response** (trong `data`): `{ EC, EM, meta, result }` — **`result`** là mảng `Allergen` (không có keyMap riêng; hiển thị tên/mô tả từ entity).

---

### 1.1 Lấy danh sách tất cả Allergens

```
GET /allergens
```

**Mô tả**: Lấy danh sách tất cả chất gây dị ứng

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Đậu phộng",
    "description": "Peanut - Có thể gây phản ứng nghiêm trọng",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "name": "Hải sản",
    "description": "Seafood - Tôm, cua, cá...",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": 3,
    "name": "Gluten",
    "description": "Từ lúa mì, đại mạch, lúa mạch đen",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### 1.2 Lấy chi tiết 1 Allergen

```
GET /allergens/:id
```

**Mô tả**: Lấy thông tin chi tiết của một allergen

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của allergen |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "Đậu phộng",
  "description": "Peanut - Có thể gây phản ứng nghiêm trọng",
  "ingredientAllergens": [
    {
      "id": 1,
      "ingredientId": 5,
      "ingredient": { "name": "Đậu phộng rang" }
    }
  ],
  "userAllergies": [
    {
      "id": 1,
      "userId": 1,
      "severity": "LIFE_THREATENING"
    }
  ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

### 1.3 Tạo Allergen mới

```
POST /allergens
```

**Mô tả**: Tạo một chất gây dị ứng mới

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Sữa",                        // Bắt buộc - Tên allergen, tối đa 255 ký tự
  "description": "Lactose và casein"    // Tùy chọn - Mô tả, tối đa 1000 ký tự
}
```

**Validation Rules**:
- `name`: Không được để trống, tối đa 255 ký tự, phải unique
- `description`: Tối đa 1000 ký tự

**Response** (201 Created):
```json
{
  "id": 4,
  "name": "Sữa",
  "description": "Lactose và casein",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

### 1.4 Cập nhật Allergen

```
PATCH /allergens/:id
```

**Mô tả**: Cập nhật thông tin allergen

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của allergen |

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body** (tất cả tùy chọn):
```json
{
  "name": "Đậu phộng (Peanut)",
  "description": "Peanut - Nguy hiểm cao, cần mang EpiPen"
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "Đậu phộng (Peanut)",
  "description": "Peanut - Nguy hiểm cao, cần mang EpiPen",
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

---

### 1.5 Xóa Allergen

```
DELETE /allergens/:id
```

**Mô tả**: Xóa một allergen

⚠️ **Cảnh báo**: Xóa allergen sẽ ảnh hưởng đến:
- Các `ingredientAllergens` liên quan (CASCADE - xóa theo)
- Các `userAllergies` liên quan (CASCADE - xóa theo)

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của allergen |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (204 No Content):
```
(empty body)
```

---

## 2. Liên kết Nguyên liệu - Allergen

Base path: `/ingredient-allergens`

Quản lý mối quan hệ nhiều-nhiều giữa **Nguyên liệu** và **Allergen**.
- Một nguyên liệu có thể chứa nhiều allergen
- Một allergen có thể có trong nhiều nguyên liệu

### 2.0 [Admin] Phân trang + lọc (aqp) — toàn bộ liên kết

```
GET /ingredient-allergens/admin?current=1&pageSize=10&...
```

**Mô tả:** `AdminGuard`. Lọc/sort theo [api-query-params](https://github.com/koajs/aqp).

**Sort mặc định:** `updatedAt` giảm dần.

**Response** (trong `data`): `{ EC, EM, meta, result }`.

- **`result`:** mỗi bản ghi gồm **`ingredient`** và **`allergen`** đầy đủ (không map thêm AllCode trên entity này).

---

### 2.1 Lấy danh sách Allergens của một Nguyên liệu

```
GET /ingredient-allergens/ingredient/:ingredientId
```

**Mô tả**: Lấy tất cả allergens liên kết với một nguyên liệu

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| ingredientId | number | ✅ | ID của nguyên liệu |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "ingredientId": 5,
    "allergenId": 1,
    "allergen": {
      "id": 1,
      "name": "Đậu phộng",
      "description": "Peanut allergy"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "ingredientId": 5,
    "allergenId": 3,
    "allergen": {
      "id": 3,
      "name": "Gluten",
      "description": "Wheat allergy"
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### 2.2 Tạo liên kết Nguyên liệu - Allergen

```
POST /ingredient-allergens
```

**Mô tả**: Liên kết một allergen với một nguyên liệu

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "ingredientId": 5,    // Bắt buộc - ID nguyên liệu, số nguyên dương
  "allergenId": 1       // Bắt buộc - ID allergen, số nguyên dương
}
```

**Validation Rules**:
- `ingredientId`: Số nguyên dương
- `allergenId`: Số nguyên dương
- Cặp `[ingredientId, allergenId]` phải unique (không được trùng)

**Response** (201 Created):
```json
{
  "id": 3,
  "ingredientId": 5,
  "allergenId": 1,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 2.3 Xóa liên kết theo ID

```
DELETE /ingredient-allergens/:id
```

**Mô tả**: Xóa một liên kết nguyên liệu-allergen theo ID

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của liên kết |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (204 No Content):
```
(empty body)
```

---

### 2.4 Xóa liên kết theo Composite Key

```
DELETE /ingredient-allergens/ingredient/:ingredientId/allergen/:allergenId
```

**Mô tả**: Xóa liên kết bằng cặp `[ingredientId, allergenId]`

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| ingredientId | number | ✅ | ID của nguyên liệu |
| allergenId | number | ✅ | ID của allergen |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (204 No Content):
```
(empty body)
```

---

## 3. Nguyên liệu trong Món ăn (Dish Ingredients)

Base path: `/foods/:dishId/ingredients`

Quản lý thành phần nguyên liệu của mỗi món ăn.

### 3.1 Lấy danh sách Nguyên liệu của Món ăn

```
GET /foods/:dishId/ingredients
```

**Mô tả**: Lấy tất cả nguyên liệu cấu thành món ăn

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| dishId | number | ✅ | ID của món ăn (food) |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "quantityGrams": 200,
    "foodId": 1,
    "ingredientId": 5,
    "ingredient": {
      "id": 5,
      "ingredientName": "Bún tươi",
      "description": "Bún gạo tươi",
      "ingredientAllergens": []
    },
    "createdAt": "2024-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "quantityGrams": 100,
    "foodId": 1,
    "ingredientId": 8,
    "ingredient": {
      "id": 8,
      "ingredientName": "Thịt bò",
      "description": "Thịt bò tươi",
      "ingredientAllergens": []
    },
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### 3.2 Thêm Nguyên liệu vào Món ăn

```
POST /foods/:dishId/ingredients
```

**Mô tả**: Thêm một nguyên liệu vào món ăn

**⚠️ Yêu cầu**: Admin token

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| dishId | number | ✅ | ID của món ăn |

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "ingredientId": 5,      // Bắt buộc - ID nguyên liệu, số nguyên dương
  "quantityGrams": 200    // Bắt buộc - Khối lượng (gram), >= 0
}
```

**Validation Rules**:
- `ingredientId`: Số nguyên dương
- `quantityGrams`: Số >= 0

**Response** (201 Created):
```json
{
  "id": 3,
  "ingredientId": 5,
  "quantityGrams": 200,
  "foodId": 1,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 3.3 Cập nhật Nguyên liệu trong Món ăn

```
PATCH /foods/:dishId/ingredients/:id
```

**Mô tả**: Cập nhật khối lượng nguyên liệu trong món ăn

**⚠️ Yêu cầu**: Admin token

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| dishId | number | ✅ | ID của món ăn |
| id | number | ✅ | ID của liên kết (foodIngredientId) |

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "quantityGrams": 250    // Bắt buộc - Khối lượng mới (gram), >= 0
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "ingredientId": 5,
  "quantityGrams": 250,
  "foodId": 1,
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

---

### 3.4 Xóa Nguyên liện khỏi Món ăn

```
DELETE /foods/:dishId/ingredients/:id
```

**Mô tả**: Xóa một nguyên liệu khỏi món ăn

**⚠️ Yêu cầu**: Admin token

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| dishId | number | ✅ | ID của món ăn |
| id | number | ✅ | ID của liên kết (foodIngredientId) |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (204 No Content):
```
(empty body)
```

---

## 4. Dinh dưỡng Nguyên liệu (Ingredient Nutrition)

Controller `FoodNutritionController` — các path dưới đây nằm **trực tiếp dưới** `/api/v1` (không có prefix `foods` cho phần ingredient).

Quản lý bản ghi **`IngredientNutrition`** (khẩu phần + bộ giá trị `NutritionValue` theo `nutrientId`).

**Tổng hợp theo món:**

```
GET /foods/:foodId/nutritions
```

Trả về mọi `IngredientNutrition` của các nguyên liệu thuộc món `foodId` (aggregate).

---

Base path (theo nguyên liệu): `/ingredients/:ingredientId/nutritions`

### 4.1 Lấy Dinh dưỡng của Nguyên liệu

```
GET /ingredients/:ingredientId/nutritions
```

**Mô tả**: Lấy tất cả thông tin dinh dưỡng của một nguyên liệu

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| ingredientId | number | ✅ | ID của nguyên liệu |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "servingSize": 100,
    "servingUnit": "UNIT_G",
    "source": "SRC_MANUAL",
    "isCalculated": false,
    "ingredientId": 5,
    "values": [
      {
        "id": 1,
        "value": 120,
        "nutrientId": 1,
        "nutrient": { "name": "Calories", "unit": "kcal" }
      },
      {
        "id": 2,
        "value": 5.5,
        "nutrientId": 2,
        "nutrient": { "name": "Protein", "unit": "g" }
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

---

### 4.2 Tạo Dinh dưỡng cho Nguyên liệu

```
POST /ingredients/:ingredientId/nutritions
```

**Mô tả**: Thêm thông tin dinh dưỡng cho nguyên liệu

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| ingredientId | number | ✅ | ID của nguyên liệu |

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body** (`CreateFoodNutritionDto`):
```json
{
  "servingSize": 100,
  "servingUnit": "UNIT_G",
  "source": "SRC_USDA",
  "isCalculated": false
}
```

- **`servingUnit`:** enum Prisma `UnitType` (`UNIT_G`, `UNIT_KG`, …).
- **`source`:** enum Prisma `SourceType` — `SRC_USDA` \| `SRC_MANUAL` \| `SRC_CALC`.

**Lưu ý:** DTO trong code có thể dùng bộ string khác cho `source` — nếu request bị 400, thử đúng giá trị enum Prisma ở trên.

**Response** (201 Created):
```json
{
  "id": 2,
  "servingSize": 100,
  "servingUnit": "UNIT_G",
  "source": "SRC_USDA",
  "isCalculated": false,
  "ingredientId": 5,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 4.3 Cập nhật Dinh dưỡng (bản ghi IngredientNutrition)

```
PATCH /foods/:foodId/nutritions/:id
```

**Mô tả:** Cập nhật một bản ghi `IngredientNutrition` theo **id** (service chỉ dùng `id`; `foodId` trên path để định tuyến nhất quán).

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| foodId | number | ✅ | ID món ăn (dish) |
| id | number | ✅ | ID bản ghi `IngredientNutrition` |

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body** (tất cả tùy chọn):
```json
{
  "servingSize": 150,
  "servingUnit": "UNIT_G",
  "source": "SRC_MANUAL",
  "isCalculated": true
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "servingSize": 150,
  "servingUnit": "UNIT_G",
  "source": "SRC_MANUAL",
  "isCalculated": true,
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

---

### 4.4 Xóa Dinh dưỡng

```
DELETE /foods/:foodId/nutritions/:id
```

**Mô tả:** Xóa bản ghi `IngredientNutrition` theo `id`.

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| foodId | number | ✅ | ID món ăn |
| id | number | ✅ | ID bản ghi dinh dưỡng |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (204 No Content):
```
(empty body)
```

---

### 4.5 Cập nhật giá trị Dinh dưỡng (Values)

```
POST /foods/:foodId/nutritions/:id/values
```

**Mô tả:** Ghi đè toàn bộ `NutritionValue` của bản ghi `IngredientNutrition` (xóa cũ + tạo mới trong transaction). Dùng **`nutrientId`** (bảng Nutrient), không dùng tên tự do.

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| foodId | number | ✅ | ID của món ăn |
| id | number | ✅ | ID của bản ghi dinh dưỡng |

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "values": [                     // Bắt buộc - Mảng các giá trị
    {
      "nutrientId": 1,           // Bắt buộc - ID chỉ số dinh dưỡng
      "value": 120.5            // Bắt buộc - Giá trị (số)
    },
    {
      "nutrientId": 2,
      "value": 5.5
    },
    {
      "nutrientId": 3,
      "value": 25.0
    }
  ]
}
```

**Validation Rules**:
- `values`: Phải là mảng
- `nutrientId`: Số nguyên dương
- `value`: Số (có thể thập phân)

**Response** (200 OK):
```json
{
  "message": "Nutrition values updated successfully",
  "count": 3,
  "values": [
    { "nutrientId": 1, "value": 120.5 },
    { "nutrientId": 2, "value": 5.5 },
    { "nutrientId": 3, "value": 25.0 }
  ]
}
```

---

## 5. Chỉ số Dinh dưỡng (Nutrition Components)

Path **`/nutrition-components`** — CRUD **Nutrient** (tên + `UnitType`).

**Không lặp lại chi tiết ở đây** — xem đầy đủ tại [admin-nutrition-management-api.md](./admin-nutrition-management-api.md) mục *Chất dinh dưỡng*.

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

---

## 📝 Ví dụ Flow Admin Quản Lý Nguyên liệu

### Scenario: Thêm nguyên liệu vào món ăn với allergens và dinh dưỡng

```
1. POST /allergens                        → Tạo allergen "Đậu phộng" (id: 1)
2. POST /ingredient-allergens             → Liên kết ingredient#5 với allergen#1
3. POST /foods/10/ingredients             → Thêm nguyên liệu#5 vào món ăn#10
4. POST /ingredients/5/nutritions         → Thêm thông tin dinh dưỡng cho nguyên liệu#5
5. POST /foods/10/nutritions/1/values     → Cập nhật giá trị dinh dưỡng
```

### Scenario: Quản lý allergens

```
1. GET /allergens                         → Xem danh sách allergens
2. POST /allergens                        → Tạo allergen mới
3. GET /ingredient-allergens/ingredient/5 → Xem allergens của nguyên liệu#5
4. DELETE /ingredient-allergens/3         → Xóa liên kết allergen
```

---

## 🔗 API Liên quan khác

### Dinh dưỡng Món ăn (Food Nutrition)
- `GET /foods/:foodId/nutritions` - Xem dinh dưỡng tổng hợp của món ăn
- Dùng để tính toán dinh dưỡng tự động từ các nguyên liệu

---

*Document Version: 1.0*
*Last Updated: April 2026*
