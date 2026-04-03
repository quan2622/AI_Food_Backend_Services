# Admin API Documentation - Ingredients Management

Tài liệu API dành cho Admin để quản lý Nguyên liệu, Chất gây dị ứng (Allergens) và Dinh dưỡng Nguyên liệu.

---

## 📋 Mục lục

1. [Chất gây dị ứng (Allergens)](#1-chất-gây-dị-ứng-allergens)
2. [Liên kết Nguyên liệu - Allergen](#2-liên-kết-nguyên-liệu---allergen)
3. [Nguyên liệu trong Món ăn (Dish Ingredients)](#3-nguyên-liệu-trong-món-ăn-dish-ingredients)
4. [Dinh dưỡng Nguyên liệu (Ingredient Nutrition)](#4-dinh-dưỡng-nguyên-liệu-ingredient-nutrition)
5. [Chỉ số Dinh dưỡng (Nutrition Components)](#5-chỉ-số-dinh-dưỡng-nutrition-components)

---

## 📝 Lưu ý quan trọng về Nguyên liệu

Hệ thống hiện tại **không có API CRUD trực tiếp** cho danh sách nguyên liệu (Ingredient). Thay vào đó:

- **Nguyên liệu** được tạo/tồn tại trong database và được liên kết với:
  - **Món ăn** (qua `DishIngredientController`) - xem mục 3
  - **Allergens** (qua `IngredientAllergenController`) - xem mục 2
  - **Dinh dưỡng** (qua `FoodNutritionController`) - xem mục 4

- Để quản lý danh sách nguyên liệu cơ bản, bạn cần seed dữ liệu trực tiếp vào DB hoặc thông qua migration.

---

## 1. Chất gây dị ứng (Allergens)

Base URL: `/allergens`

Allergens là các chất gây dị ứng độc lập (ví dụ: Đậu phộng, Hải sản, Gluten...).

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

Base URL: `/ingredient-allergens`

Quản lý mối quan hệ nhiều-nhiều giữa **Nguyên liệu** và **Allergen**.
- Một nguyên liệu có thể chứa nhiều allergen
- Một allergen có thể có trong nhiều nguyên liệu

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

Base URL: `/foods/:dishId/ingredients`

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

Base URL: `/ingredients/:ingredientId/nutritions`

Quản lý thông tin dinh dưỡng của từng nguyên liệu.

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
    "servingUnit": "G",
    "source": "MANUAL",
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

**Request Body**:
```json
{
  "servingSize": 100,             // Bắt buộc - Khẩu phần, >= 0
  "servingUnit": "G",             // Bắt buộc - Đơn vị (G, KG, MG, OZ, LB)
  "source": "USDA",               // Bắt buộc - Nguồn (USDA | MANUAL | CALCULATED)
  "isCalculated": false           // Tùy chọn - Tính toán tự động
}
```

**Unit Types** (`servingUnit`):
- `G` - Gram
- `KG` - Kilogram
- `MG` - Milligram
- `OZ` - Ounce
- `LB` - Pound

**Source Types** (`source`):
- `USDA` - Dữ liệu từ USDA
- `MANUAL` - Nhập thủ công
- `CALCULATED` - Tính toán từ các nguyên liệu khác

**Response** (201 Created):
```json
{
  "id": 2,
  "servingSize": 100,
  "servingUnit": "G",
  "source": "USDA",
  "isCalculated": false,
  "ingredientId": 5,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### 4.3 Cập nhật Dinh dưỡng

```
PATCH /foods/:foodId/nutritions/:id
```

**Mô tả**: Cập nhật thông tin dinh dưỡng

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

**Request Body** (tất cả tùy chọn):
```json
{
  "servingSize": 150,
  "servingUnit": "G",
  "source": "MANUAL",
  "isCalculated": true
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "servingSize": 150,
  "servingUnit": "G",
  "source": "MANUAL",
  "isCalculated": true,
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

---

### 4.4 Xóa Dinh dưỡng

```
DELETE /foods/:foodId/nutritions/:id
```

**Mô tả**: Xóa thông tin dinh dưỡng

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| foodId | number | ✅ | ID của món ăn |
| id | number | ✅ | ID của bản ghi dinh dưỡng |

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

**Mô tả**: Cập nhật/Thêm các giá trị dinh dưỡng cụ thể (calories, protein...)

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

Base URL: `/nutrition-components`

Quản lý danh sách các chỉ số dinh dưỡng có thể có (Calories, Protein, Fat...).

### 5.1 Lấy danh sách Chỉ số Dinh dưỡng

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
    "unit": "kcal",
    "values": []
  },
  {
    "id": 2,
    "name": "Protein",
    "unit": "g",
    "values": []
  },
  {
    "id": 3,
    "name": "Carbohydrates",
    "unit": "g",
    "values": []
  }
]
```

---

### 5.2 Tạo Chỉ số Dinh dưỡng mới

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
  "name": "Fiber",          // Bắt buộc - Tên chỉ số, tối đa 255 ký tự
  "unit": "G"               // Bắt buộc - Đơn vị (G, KG, MG, OZ, LB)
}
```

**Validation Rules**:
- `name`: Không được để trống, tối đa 255 ký tự
- `unit`: Phải là một trong các giá trị: `G`, `KG`, `MG`, `OZ`, `LB`

**Response** (201 Created):
```json
{
  "id": 4,
  "name": "Fiber",
  "unit": "G",
  "values": []
}
```

---

### 5.3 Cập nhật Chỉ số Dinh dưỡng

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
  "name": "Chất xơ",
  "unit": "G"
}
```

**Response** (200 OK):
```json
{
  "id": 4,
  "name": "Chất xơ",
  "unit": "G"
}
```

---

### 5.4 Xóa Chỉ số Dinh dưỡng

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
