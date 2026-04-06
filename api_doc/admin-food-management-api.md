# Admin API Documentation - Food Management

Tài liệu API dành cho Admin để quản lý Thực phẩm (Món ăn, Phân loại, Ảnh thực phẩm).

**Tiền tố:** `/api/v1` — xem [README.md](./README.md).

**Quyền:** `GET /foods`, `GET /foods/:id` — mọi user đã đăng nhập. `POST|PATCH|DELETE` food & bulk — **`AdminGuard`**.

---

## 📋 Mục lục

1. [Món ăn (Foods)](#1-món-ăn-foods) — gồm `GET /foods/admin`
2. [Phân loại (Categories)](#2-phân-loại-categories)
3. [Ảnh thực phẩm (Food Images)](#3-ảnh-thực-phẩm-food-images) — gồm `GET /food-images/admin`

---

## 1. Món ăn (Foods)

Base path: `/foods`

### 1.0 [Admin] Phân trang + lọc (aqp) — khuyến nghị cho bảng món

```
GET /foods/admin?current=1&pageSize=10&...
```

**Mô tả:** `AdminGuard`. Lọc/sort theo [api-query-params](https://github.com/koajs/aqp) (giống `GET /users/admin`).

**Response** (trong `data`): `{ EC, EM, meta, result }`.

- **`result`:** mỗi món có **`foodCategory`** (id, name, description, parentId) — không dùng keyMap trên `Food`; hiển thị danh mục từ quan hệ.

---

### 1.1 Lấy danh sách tất cả Món ăn

```
GET /foods
```

**Mô tả**: Lấy danh sách tất cả món ăn trong hệ thống

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "foodName": "Bún bò Huế",
    "description": "Bún bò đặc sản Huế với nước dùng xương bò",
    "imageUrl": "https://res.cloudinary.com/.../bun-bo.jpg",
    "categoryId": 1,
    "foodCategory": {
      "id": 1,
      "name": "Món nước"
    },
    "defaultServingGrams": 450,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "nutritionProfile": {
      "id": 1,
      "source": "SRC_MANUAL",
      "values": [
        { "nutrient": { "name": "Calories" }, "value": 450 },
        { "nutrient": { "name": "Protein" }, "value": 25 },
        { "nutrient": { "name": "Carbs" }, "value": 60 },
        { "nutrient": { "name": "Fat" }, "value": 15 }
      ]
    },
    "foodIngredients": [
      {
        "ingredient": { "name": "Bún tươi" },
        "quantityGrams": 200
      }
    ]
  }
]
```

---

### 1.2 Lấy danh sách Món ăn theo Category

```
GET /foods?categoryId={categoryId}
```

**Mô tả**: Lấy danh sách món ăn thuộc một category cụ thể

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Query Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| categoryId | number | ✅ | ID của category |

**Response** (200 OK): *Mảng các food object giống 1.1*

---

### 1.3 Lấy chi tiết 1 Món ăn

```
GET /foods/:id
```

**Mô tả**: Lấy thông tin chi tiết của một món ăn

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của món ăn |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "foodName": "Bún bò Huế",
  "description": "Bún bò đặc sản Huế...",
  "imageUrl": "https://...",
  "categoryId": 1,
  "defaultServingGrams": 450,
  "foodCategory": { ... },
  "nutritionProfile": { ... },
  "foodIngredients": [ ... ],
  "mealItems": [ ... ],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

### 1.4 Tạo Món ăn mới

```
POST /foods
```

**Mô tả**: Tạo một món ăn mới trong hệ thống

**⚠️ Yêu cầu**: Admin token

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "foodName": "Phở bò tái",           // Bắt buộc - Tên món ăn, tối đa 255 ký tự
  "description": "Phở bò với thịt tái", // Tùy chọn - Mô tả, tối đa 1000 ký tự
  "imageUrl": "https://...",            // Tùy chọn - URL ảnh, tối đa 500 ký tự
  "categoryId": 1                         // Tùy chọn - ID của category
}
```

**Validation Rules**:
- `foodName`: Không được để trống, tối đa 255 ký tự
- `description`: Tối đa 1000 ký tự
- `imageUrl`: Tối đa 500 ký tự
- `categoryId`: Số nguyên dương (> 0)

**Response** (201 Created):
```json
{
  "id": 2,
  "foodName": "Phở bò tái",
  "description": "Phở bò với thịt tái",
  "imageUrl": "https://...",
  "categoryId": 1,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

### 1.5 Tạo nhiều Món ăn (Bulk Create)

```
POST /foods/bulk
```

**Mô tả**: Tạo nhiều món ăn cùng lúc

**⚠️ Yêu cầu**: Admin token

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "items": [                            // Bắt buộc - Mảng các món ăn, không được rỗng
    {
      "foodName": "Cơm tấm sườn",
      "description": "Cơm tấm với sườn nướng",
      "categoryId": 2
    },
    {
      "foodName": "Bánh mì thịt",
      "description": "Bánh mì kẹp thịt",
      "categoryId": 3
    }
  ]
}
```

**Validation Rules**:
- `items`: Phải là mảng, không được rỗng
- Mỗi item trong mảng phải tuân thủ validation của CreateFoodDto

**Response** (201 Created):
```json
{
  "count": 2,
  "foods": [
    { "id": 3, "foodName": "Cơm tấm sườn", ... },
    { "id": 4, "foodName": "Bánh mì thịt", ... }
  ]
}
```

---

### 1.6 Cập nhật Món ăn

```
PATCH /foods/:id
```

**Mô tả**: Cập nhật thông tin món ăn

**⚠️ Yêu cầu**: Admin token

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của món ăn |

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body** (tất cả tùy chọn):
```json
{
  "foodName": "Phở bò đặc biệt",
  "description": "Phở bò với thịt tái, nạm, gầu",
  "imageUrl": "https://new-image.jpg",
  "categoryId": 1
}
```

**Response** (200 OK):
```json
{
  "id": 1,
  "foodName": "Phở bò đặc biệt",
  "description": "Phở bò với thịt tái, nạm, gầu",
  "imageUrl": "https://new-image.jpg",
  "categoryId": 1,
  "updatedAt": "2024-01-02T00:00:00Z"
}
```

---

### 1.7 Xóa Món ăn

```
DELETE /foods/:id
```

**Mô tả**: Xóa một món ăn khỏi hệ thống

**⚠️ Yêu cầu**: Admin token

⚠️ **Cảnh báo**: Xóa food sẽ ảnh hưởng đến:
- `mealItems` liên quan (CASCADE hoặc RESTRICT tùy DB config)
- `foodIngredients` (xóa theo)
- `nutritionProfile` (xóa theo)

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của món ăn |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (204 No Content):
```
(empty body)
```

---

### 1.8 Xóa nhiều Món ăn (Bulk Delete)

```
DELETE /foods/bulk
```

**Mô tả**: Xóa nhiều món ăn cùng lúc

**⚠️ Yêu cầu**: Admin token

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "ids": [1, 2, 3, 4, 5]    // Bắt buộc - Mảng các ID, không được rỗng, mỗi ID > 0
}
```

**Validation Rules**:
- `ids`: Phải là mảng số nguyên dương, không được rỗng

**Response** (200 OK):
```json
{
  "count": 5,
  "message": "Deleted 5 foods successfully"
}
```

---

## 2. Phân loại (Categories)

Base URL: `/food-categories`

Hệ thống category hỗ trợ **phân cấp cha-con** (tree structure), một category có thể có nhiều sub-categories.

### 2.1 Lấy danh sách tất cả Categories

```
GET /food-categories
```

**Mô tả**: Lấy tất cả categories kèm theo cấu trúc cha-con

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Món nước",
    "description": "Các món có nước dùng",
    "parentId": null,
    "children": [
      {
        "id": 2,
        "name": "Phở",
        "description": "Các loại phở",
        "parentId": 1,
        "children": []
      },
      {
        "id": 3,
        "name": "Bún",
        "description": "Các loại bún",
        "parentId": 1,
        "children": []
      }
    ]
  },
  {
    "id": 4,
    "name": "Món cơm",
    "description": "Các món ăn với cơm",
    "parentId": null,
    "children": [...]
  }
]
```

---

### 2.2 Lấy danh sách Categories gốc (Root Categories)

```
GET /food-categories/roots
```

**Mô tả**: Lấy các categories cấp cao nhất (không có parent)

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Món nước",
    "description": "Các món có nước dùng",
    "parentId": null,
    "children": [ ... ]
  },
  {
    "id": 4,
    "name": "Món cơm",
    "description": "Các món ăn với cơm",
    "parentId": null,
    "children": [ ... ]
  }
]
```

---

### 2.3 Lấy chi tiết 1 Category

```
GET /food-categories/:id
```

**Mô tả**: Lấy thông tin chi tiết của một category

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của category |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "Món nước",
  "description": "Các món có nước dùng",
  "parentId": null,
  "parent": null,
  "children": [
    { "id": 2, "name": "Phở", ... },
    { "id": 3, "name": "Bún", ... }
  ],
  "foods": [
    { "id": 1, "foodName": "Bún bò Huế", ... }
  ]
}
```

---

### 2.4 Lấy danh sách Sub-categories

```
GET /food-categories/:id/children
```

**Mô tả**: Lấy tất cả sub-categories của một category cha

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của category cha |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 2,
    "name": "Phở",
    "description": "Các loại phở",
    "parentId": 1,
    "foods": [ ... ]
  },
  {
    "id": 3,
    "name": "Bún",
    "description": "Các loại bún",
    "parentId": 1,
    "foods": [ ... ]
  }
]
```

---

### 2.5 Tạo Category mới

```
POST /food-categories
```

**Mô tả**: Tạo một category mới

**⚠️ Yêu cầu**: Admin token

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Món chiên",                  // Bắt buộc - Tên category, tối đa 255 ký tự
  "description": "Các món chiên rán",   // Tùy chọn - Mô tả, tối đa 1000 ký tự
  "parentId": 1                         // Tùy chọn - ID của category cha (nếu là sub-category)
}
```

**Validation Rules**:
- `name`: Không được để trống, tối đa 255 ký tự
- `description`: Tối đa 1000 ký tự
- `parentId`: Số nguyên dương (> 0), tùy chọn

**Response** (201 Created):
```json
{
  "id": 5,
  "name": "Món chiên",
  "description": "Các món chiên rán",
  "parentId": 1
}
```

---

### 2.6 Cập nhật Category

```
PATCH /food-categories/:id
```

**Mô tả**: Cập nhật thông tin category

**⚠️ Yêu cầu**: Admin token

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của category |

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body** (tất cả tùy chọn):
```json
{
  "name": "Món nước và súp",
  "description": "Các món có nước dùng và súp",
  "parentId": null
}
```

⚠️ **Lưu ý**: Đổi `parentId` có thể làm thay đổi cấu trúc cây category

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "Món nước và súp",
  "description": "Các món có nước dùng và súp",
  "parentId": null
}
```

---

### 2.7 Xóa Category

```
DELETE /food-categories/:id
```

**Mô tả**: Xóa một category

**⚠️ Yêu cầu**: Admin token

⚠️ **Cảnh báo**: 
- Nếu category có `children`, xóa sẽ thất bại (RESTRICT)
- Nếu category có `foods` liên kết, xóa sẽ thất bại (RESTRICT)
- Cần xử lý di chuyển foods/children trước khi xóa

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của category |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (204 No Content):
```
(empty body)
```

---

## 3. Ảnh thực phẩm (Food Images)

Base path: `/food-images`

Food Images là ảnh do users upload khi ghi lại bữa ăn (meal). Admin có thể xem và quản lý.

### 3.0 [Admin] Phân trang + lọc (aqp) — toàn bộ ảnh hệ thống

```
GET /food-images/admin?current=1&pageSize=10&...
```

**Mô tả:** `AdminGuard`. Lọc/sort theo [api-query-params](https://github.com/koajs/aqp).

**Response** (trong `data`): `{ EC, EM, meta, result }`.

- **`result`:** mỗi bản ghi gồm `user` (rút gọn), `meal` (id, mealType, mealDateTime, dailyLogId), và **`mealTypeInfo`**: map từ `all_codes` theo `meal.mealType` (`keyMap`, `value`, `description`, `type`).

---

### 3.1 Upload ảnh thực phẩm

```
POST /food-images/upload
```

**Mô tả**: Upload ảnh cho một meal (thường dùng cho users, admin có thể dùng để test)

**Headers**:
```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Request Body** (Form Data):
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| image | File | ✅ | File ảnh (jpeg, png, webp), tối đa 5MB |
| mealId | number | ✅ | ID của meal mà ảnh thuộc về |

**Validation Rules**:
- `image`: 
  - Max size: 5MB
  - Allowed types: `image/jpeg`, `image/png`, `image/webp`
- `mealId`: Số nguyên dương

**Response** (201 Created):
```json
{
  "id": 1,
  "imageUrl": "https://res.cloudinary.com/.../food-image.jpg",
  "fileName": "food-image.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 2456789,
  "userId": 1,
  "mealId": 5,
  "uploadedAt": "2024-01-01T12:00:00Z"
}
```

---

### 3.2 Lấy danh sách Ảnh theo Meal

```
GET /food-images/meals/:mealId
```

**Mô tả**: Lấy tất cả ảnh của một meal

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| mealId | number | ✅ | ID của meal |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "imageUrl": "https://res.cloudinary.com/.../img1.jpg",
    "fileName": "img1.jpg",
    "mimeType": "image/jpeg",
    "fileSize": 2456789,
    "userId": 1,
    "mealId": 5,
    "uploadedAt": "2024-01-01T12:00:00Z"
  },
  {
    "id": 2,
    "imageUrl": "https://res.cloudinary.com/.../img2.jpg",
    "fileName": "img2.jpg",
    "mimeType": "image/png",
    "fileSize": 1234567,
    "userId": 1,
    "mealId": 5,
    "uploadedAt": "2024-01-01T12:05:00Z"
  }
]
```

---

### 3.3 Lấy chi tiết 1 Ảnh

```
GET /food-images/:id
```

**Mô tả**: Lấy thông tin chi tiết của một ảnh

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của ảnh |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "imageUrl": "https://res.cloudinary.com/.../food-image.jpg",
  "fileName": "food-image.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 2456789,
  "userId": 1,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A"
  },
  "mealId": 5,
  "meal": {
    "id": 5,
    "mealType": "MEAL_BREAKFAST",
    "mealDateTime": "2024-01-01T08:00:00Z"
  },
  "uploadedAt": "2024-01-01T12:00:00Z"
}
```

---

### 3.4 Xóa một Ảnh

```
DELETE /food-images/:id
```

**Mô tả**: Xóa một ảnh

**⚠️ Lưu ý**: API này yêu cầu userId trong token phải khớp với userId của ảnh, HOẶC user là admin

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| id | number | ✅ | ID của ảnh |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (204 No Content):
```
(empty body)
```

---

### 3.5 Xóa tất cả Ảnh của một Meal

```
DELETE /food-images/meals/:mealId
```

**Mô tả**: Xóa tất cả ảnh thuộc về một meal

**⚠️ Lưu ý**: API này yêu cầu userId trong token phải khớp với owner của ảnh, HOẶC user là admin

**Params**:
| Tên | Kiểu | Bắt buộc | Mô tả |
|-----|------|----------|-------|
| mealId | number | ✅ | ID của meal |

**Headers**:
```
Authorization: Bearer <admin_token>
```

**Response** (200 OK):
```json
{
  "count": 3,
  "message": "Deleted 3 images from meal 5"
}
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

### Food Images Permission
Food Images có quyền đặc biệt:
- **Normal user**: Chỉ xóa ảnh của chính mình
- **Admin**: Có thể xóa ảnh của bất kỳ user nào

---

## 📝 Ví dụ Flow Admin Quản Lý Food

### Scenario 1: Tạo cấu trúc Category và Food

```
1. POST /food-categories              → Tạo root category "Món nước" (id: 1)
2. POST /food-categories              → Tạo sub-category "Phở" với parentId=1 (id: 2)
3. POST /foods                      → Tạo món "Phở bò tái" với categoryId=2
4. POST /foods/bulk                 → Tạo nhiều món cùng lúc
```

### Scenario 2: Cập nhật và sắp xếp lại

```
1. GET /food-categories               → Xem toàn bộ cây category
2. PATCH /food-categories/2           → Đổi parent của "Phở" sang category khác
3. PATCH /foods/5                     → Cập nhật thông tin món ăn
4. DELETE /foods/3                    → Xóa món ăn không còn dùng
```

### Scenario 3: Quản lý ảnh

```
1. GET /food-images/meals/10          → Xem ảnh của meal #10
2. DELETE /food-images/5              → Xóa 1 ảnh cụ thể
3. DELETE /food-images/meals/10       → Xóa tất cả ảnh của meal #10
```

---

## 🔗 API Liên quan (Khác)

Để quản lý đầy đủ thực phẩm, Admin cần thêm các API:

### Ingredients Management
- `GET/POST/PATCH/DELETE /ingredients` - Quản lý nguyên liệu
- `GET/POST/PATCH/DELETE /dish-ingredients` - Liên kết food-ingredient
- `GET/POST/PATCH/DELETE /ingredient-nutritions` - Dinh dưỡng nguyên liệu

### Nutrition Management
- `GET/POST/PATCH/DELETE /food-nutrition` - Quản lý dinh dưỡng món ăn

### Allergens Management
- `GET/POST/PATCH/DELETE /allergens` - Quản lý chất gây dị ứng
- `GET/POST/PATCH/DELETE /ingredient-allergens` - Liên kết ingredient-allergen

---

*Document Version: 1.0*
*Last Updated: April 2026*
