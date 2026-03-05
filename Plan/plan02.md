# Food Module — Refactor Plan (SOLID Architecture)

> **Mục tiêu:** Gộp `DishIngredient`, `FoodNutrition`, `NutritionComponent`, `FoodNutritionValue`, `FoodCategory` vào một `FoodModule` duy nhất, tổ chức theo nguyên tắc SOLID, dễ bảo trì và mở rộng.

---

## 1. Tổng quan thay đổi

| Trạng thái | Module / File |
|---|---|
| ✅ Giữ nguyên | `FoodModule`, `FoodService`, `FoodController` |
| ✅ Giữ nguyên | `FoodImageModule` (hoặc gộp vào nếu muốn) |
| 🆕 Thêm mới | `FoodCategoryService` + `FoodCategoryController` |
| 🆕 Thêm mới | `FoodNutritionService` + `FoodNutritionController` |
| 🆕 Thêm mới | `DishIngredientService` + `DishIngredientController` |
| 🆕 Thêm mới | 4 Prisma model mới vào `schema.prisma` |
| ✏️ Sửa | `Food` model — thêm relations mới |
| ✏️ Sửa | `food.module.ts` — đăng ký thêm providers/controllers |

---

## 2. Prisma Schema — Các model cần thêm mới

> **Lưu ý:** Chỉ liệt kê các model **MỚI HOÀN TOÀN** cần thêm vào `prisma/schema.prisma`. Các model hiện có (`Food`, `User`, `Meal`...) không được đụng vào ngoại trừ phần thêm relation.

---

### 2.1 Sửa model `Food` hiện có — Thêm relations

```prisma
model Food {
  id          Int        @id @default(autoincrement())
  foodName    String
  description String?
  category    String                        // Giữ nguyên field cũ (legacy)
  categoryId  Int?                          // 🆕 FK tới FoodCategory
  foodCategory FoodCategory? @relation(fields: [categoryId], references: [id])
  foodType    String        @default("INGREDIENT") // 🆕 "INGREDIENT" | "DISH" | "BRANDED"
  imageUrl    String?
  protein     Float         @default(0)
  carbs       Float         @default(0)
  fat         Float         @default(0)
  calories    Float         @default(0)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  mealItems   MealItem[]

  // 🆕 Relations mới
  nutritions       FoodNutrition[]
  dishIngredients  DishIngredient[] @relation("DishHasIngredients")
  usedAsIngredient DishIngredient[] @relation("IngredientUsedInDish")

  @@map("foods")
}
```

> **Giải thích:**
> - `category` (String) giữ lại để không phá vỡ code cũ — **không xóa ngay**.
> - `categoryId` thêm mới, nullable, để migration không lỗi với data cũ.
> - `foodType` phân loại món: nguyên liệu đơn, món ăn (DISH = gồm nhiều nguyên liệu), hoặc branded (có nhãn hiệu).
> - Hai relation `dishIngredients` và `usedAsIngredient` đều trỏ về `DishIngredient` nhưng với tên relation khác nhau — đây là **self-referencing nhiều chiều** qua bảng trung gian.

---

### 2.2 Model mới: `FoodCategory`

```prisma
model FoodCategory {
  id          Int            @id @default(autoincrement())
  name        String         @unique
  description String?
  parentId    Int?                              // Nullable — category gốc thì không có cha
  parent      FoodCategory?  @relation("CategoryTree", fields: [parentId], references: [id])
  children    FoodCategory[] @relation("CategoryTree")
  foods       Food[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  @@map("food_categories")
}
```

> **Giải thích:**
> - `parentId` nullable cho phép tạo category gốc (cấp 1) như "Món chính", "Tráng miệng"...
> - Self-relation `"CategoryTree"` tạo cây phân cấp không giới hạn độ sâu.
> - Khi query, dùng Prisma `include: { children: true }` để lấy toàn bộ cây.

---

### 2.3 Model mới: `NutritionComponent`

```prisma
model NutritionComponent {
  id        Int                  @id @default(autoincrement())
  name      String               @unique   // "Protein", "Carbohydrate", "Fat", "Fiber", "Sodium"...
  unit      String               // "g", "mg", "mcg", "kcal"
  createdAt DateTime             @default(now())
  updatedAt DateTime             @updatedAt
  values    FoodNutritionValue[]

  @@map("nutrition_components")
}
```

> **Giải thích:**
> - Đây là **bảng danh mục** các chỉ số dinh dưỡng. Admin thêm một lần, dùng mãi.
> - Tách riêng thay vì hardcode "protein/carbs/fat" → sau này dễ mở rộng thêm "Cholesterol", "Sodium"...
> - `unit` lưu đơn vị đo: protein tính bằng `g`, sodium tính `mg`, v.v.

---

### 2.4 Model mới: `FoodNutrition`

```prisma
model FoodNutrition {
  id            Int                  @id @default(autoincrement())
  servingSize   Float                                  // Khẩu phần tính bằng gram (vd: 100)
  servingUnit   String               @default("g")    // Đơn vị khẩu phần: "g", "ml", "piece"
  source        String               @default("MANUAL") // "USDA" | "MANUAL" | "CALCULATED"
  isCalculated  Boolean              @default(false)  // true nếu được tính từ DishIngredient
  foodId        Int
  food          Food                 @relation(fields: [foodId], references: [id], onDelete: Cascade)
  values        FoodNutritionValue[]
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt

  @@map("food_nutritions")
}
```

> **Giải thích:**
> - Một `Food` có thể có **nhiều bảng dinh dưỡng** với các `servingSize` khác nhau (vd: per 100g, per 1 portion).
> - `source` phân biệt nguồn gốc: nhập tay, lấy từ USDA API, hay tự tính từ nguyên liệu.
> - `isCalculated = true` nghĩa là hệ thống tự tổng hợp từ `DishIngredient` → không cần nhập thủ công.
> - Relation `onDelete: Cascade` — xóa Food thì xóa luôn bảng dinh dưỡng.

---

### 2.5 Model mới: `FoodNutritionValue`

```prisma
model FoodNutritionValue {
  id          Int                @id @default(autoincrement())
  value       Float              // Giá trị dinh dưỡng (vd: 26.3)
  nutritionId Int
  nutrition   FoodNutrition      @relation(fields: [nutritionId], references: [id], onDelete: Cascade)
  componentId Int
  component   NutritionComponent @relation(fields: [componentId], references: [id], onDelete: Restrict)
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  @@unique([nutritionId, componentId])   // Mỗi bảng chỉ có 1 giá trị cho mỗi component
  @@map("food_nutrition_values")
}
```

> **Giải thích:**
> - Bảng **junction** giữa `FoodNutrition` và `NutritionComponent`.
> - `@@unique([nutritionId, componentId])` đảm bảo không có giá trị trùng lặp cho cùng 1 chỉ số trong 1 bảng dinh dưỡng.
> - `onDelete: Restrict` trên `component` → không cho xóa `NutritionComponent` nếu vẫn còn giá trị tham chiếu.
> - `onDelete: Cascade` trên `nutrition` → xóa `FoodNutrition` thì xóa luôn tất cả values.

---

### 2.6 Model mới: `DishIngredient`

```prisma
model DishIngredient {
  id             Int      @id @default(autoincrement())
  quantityGrams  Float                        // Lượng nguyên liệu tính bằng gram
  dishId         Int
  dish           Food     @relation("DishHasIngredients", fields: [dishId], references: [id], onDelete: Cascade)
  ingredientId   Int
  ingredient     Food     @relation("IngredientUsedInDish", fields: [ingredientId], references: [id], onDelete: Restrict)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([dishId, ingredientId])   // Mỗi nguyên liệu chỉ xuất hiện 1 lần trong 1 món
  @@map("dish_ingredients")
}
```

> **Giải thích:**
> - Bảng này mô tả **công thức** của món ăn loại DISH.
> - `dishId` → Food có `foodType = "DISH"`.
> - `ingredientId` → Food có `foodType = "INGREDIENT"`.
> - Dùng **hai named relations** (`"DishHasIngredients"` và `"IngredientUsedInDish"`) vì cả hai FK đều trỏ về cùng bảng `Food` — Prisma yêu cầu đặt tên riêng để phân biệt.
> - `onDelete: Cascade` trên dish → xóa món ăn thì xóa luôn công thức.
> - `onDelete: Restrict` trên ingredient → không cho xóa nguyên liệu nếu đang được dùng trong công thức.
> - `@@unique([dishId, ingredientId])` tránh thêm cùng nguyên liệu hai lần.

---

## 3. Lệnh Migration

Sau khi chỉnh schema, chạy lần lượt:

```bash
# Bước 1: Tạo migration
npx prisma migrate dev --name add_food_module_extensions

# Bước 2: Tái sinh Prisma Client
npx prisma generate

# Bước 3: Kiểm tra TypeScript không lỗi
npx tsc --noEmit
```

---

## 4. Cấu trúc thư mục Food Module sau refactor

```
src/modules/food/
│
├── controllers/
│   ├── food.controller.ts              # CRUD Food cơ bản
│   ├── food-category.controller.ts     # CRUD FoodCategory
│   ├── food-nutrition.controller.ts    # Quản lý bảng dinh dưỡng + NutritionComponent
│   └── dish-ingredient.controller.ts   # Quản lý công thức món ăn
│
├── services/
│   ├── food.service.ts                 # Logic Food cơ bản (giữ nguyên)
│   ├── food-category.service.ts        # Logic FoodCategory
│   ├── food-nutrition.service.ts       # Logic FoodNutrition + Value + Component
│   └── dish-ingredient.service.ts      # Logic DishIngredient
│
├── dto/
│   ├── food/
│   │   ├── create-food.dto.ts          # Thêm field categoryId, foodType
│   │   ├── update-food.dto.ts
│   │   ├── bulk-create-food.dto.ts
│   │   └── bulk-delete-food.dto.ts
│   │
│   ├── food-category/
│   │   ├── create-food-category.dto.ts
│   │   └── update-food-category.dto.ts
│   │
│   ├── food-nutrition/
│   │   ├── create-food-nutrition.dto.ts
│   │   ├── update-food-nutrition.dto.ts
│   │   ├── upsert-nutrition-value.dto.ts   # Upsert nhiều values cùng lúc
│   │   └── create-nutrition-component.dto.ts
│   │
│   └── dish-ingredient/
│       ├── create-dish-ingredient.dto.ts
│       └── update-dish-ingredient.dto.ts
│
└── food.module.ts                      # Đăng ký toàn bộ
```

---

## 5. food.module.ts — Sau khi gộp

```typescript
@Module({
  imports: [CloudinaryModule],
  controllers: [
    FoodController,
    FoodCategoryController,
    FoodNutritionController,
    DishIngredientController,
  ],
  providers: [
    FoodService,
    FoodCategoryService,
    FoodNutritionService,
    DishIngredientService,
  ],
  exports: [
    FoodService,            // MealItemModule dùng để lấy nutrition khi tạo MealItem
    FoodNutritionService,   // Dùng cho AI module khi tính dinh dưỡng từ ảnh
  ],
})
export class FoodModule {}
```

---

## 6. Phân chia trách nhiệm từng Service

### `FoodService` — Giữ nguyên, chỉ thêm filter

| Method | Mô tả |
|---|---|
| `create(dto)` | Tạo food, có thêm `categoryId`, `foodType` |
| `createMany(dto[])` | Bulk tạo |
| `update(id, dto)` | Cập nhật |
| `remove(id)` | Xóa (check không có MealItem đang dùng) |
| `removeMany(ids[])` | Bulk xóa |
| `findAll(query?)` | Lấy tất cả, filter theo `categoryId`, `foodType` |
| `findOne(id)` | Lấy chi tiết kèm nutritions + category |
| `findByCategory(category)` | Giữ nguyên backward-compat |

---

### `FoodCategoryService` — Mới hoàn toàn

| Method | Mô tả |
|---|---|
| `findAll()` | Lấy tất cả category kèm children (dạng cây) |
| `findRoots()` | Chỉ lấy category cấp gốc (không có parentId) |
| `findChildren(parentId)` | Lấy category con trực tiếp |
| `findOne(id)` | Chi tiết 1 category |
| `create(dto)` | Tạo mới (kiểm tra parentId tồn tại nếu có) |
| `update(id, dto)` | Cập nhật (không cho đặt cha là chính nó) |
| `remove(id)` | Xóa (kiểm tra không có food đang dùng + không có children) |

**Routes:**
```
GET    /food-categories           → findAll() (dạng cây)
GET    /food-categories/roots     → findRoots()
GET    /food-categories/:id       → findOne(id)
POST   /food-categories           → create (Admin)
PATCH  /food-categories/:id       → update (Admin)
DELETE /food-categories/:id       → remove (Admin)
```

---

### `FoodNutritionService` — Mới hoàn toàn

Service này xử lý 3 entity liên quan chặt chẽ nên gộp 1 service:

#### Phần NutritionComponent (danh mục chỉ số)

| Method | Mô tả |
|---|---|
| `findAllComponents()` | Lấy tất cả component (Protein, Carbs...) |
| `createComponent(dto)` | Admin thêm component mới |
| `updateComponent(id, dto)` | Admin sửa tên/đơn vị |
| `removeComponent(id)` | Admin xóa (có Restrict nếu đang dùng) |

#### Phần FoodNutrition (bảng dinh dưỡng của food)

| Method | Mô tả |
|---|---|
| `findByFoodId(foodId)` | Lấy tất cả bảng dinh dưỡng của 1 food |
| `findOneNutrition(id)` | Chi tiết 1 bảng kèm values |
| `createNutrition(foodId, dto)` | Tạo bảng dinh dưỡng cho food |
| `updateNutrition(id, dto)` | Sửa servingSize, source |
| `removeNutrition(id)` | Xóa bảng (cascade xóa values) |
| `upsertValues(nutritionId, values[])` | Upsert toàn bộ values 1 lần |
| `calculateFromIngredients(foodId)` | Tự tính nutrition từ DishIngredient |

**Routes:**
```
GET    /nutrition-components              → findAllComponents()
POST   /nutrition-components              → createComponent (Admin)
PATCH  /nutrition-components/:id          → updateComponent (Admin)
DELETE /nutrition-components/:id          → removeComponent (Admin)

GET    /foods/:foodId/nutritions          → findByFoodId(foodId)
POST   /foods/:foodId/nutritions          → createNutrition(foodId, dto)
GET    /foods/:foodId/nutritions/:id      → findOneNutrition(id)
PATCH  /foods/:foodId/nutritions/:id      → updateNutrition(id, dto)
DELETE /foods/:foodId/nutritions/:id      → removeNutrition(id)
POST   /foods/:foodId/nutritions/:id/values  → upsertValues(id, values[])
POST   /foods/:foodId/nutritions/calculate   → calculateFromIngredients(foodId)
```

---

### `DishIngredientService` — Mới hoàn toàn

| Method | Mô tả |
|---|---|
| `findByDish(dishId)` | Lấy tất cả nguyên liệu của 1 món ăn |
| `addIngredient(dishId, dto)` | Thêm nguyên liệu vào món (kiểm tra food type) |
| `updateIngredient(id, dto)` | Sửa lượng nguyên liệu |
| `removeIngredient(id)` | Xóa nguyên liệu khỏi món |
| `validateDishType(foodId)` | Guard nội bộ: kiểm tra food phải là DISH |

**Routes:**
```
GET    /foods/:dishId/ingredients         → findByDish(dishId)
POST   /foods/:dishId/ingredients         → addIngredient(dishId, dto)
PATCH  /foods/:dishId/ingredients/:id     → updateIngredient(id, dto)
DELETE /foods/:dishId/ingredients/:id     → removeIngredient(id)
```

---

## 7. SOLID áp dụng như thế nào

### S — Single Responsibility
- `FoodService` chỉ biết về entity `Food`, không động vào nutrition hay ingredient.
- `FoodNutritionService` chỉ xử lý dữ liệu dinh dưỡng.
- `DishIngredientService` chỉ xử lý công thức món ăn.
- Mỗi controller chỉ delegate xuống đúng 1 service.

### O — Open/Closed
- Muốn thêm loại food mới (vd: "SUPPLEMENT") → chỉ thêm enum value, không sửa service.
- Muốn thêm source dinh dưỡng mới (vd: "OPEN_FOOD_FACTS") → thêm case trong `source` field, không sửa logic cũ.

### L — Liskov
- Mọi service đều injectable, hoán đổi được khi test: `FoodNutritionService` có thể mock độc lập.

### I — Interface Segregation
- `MealItemModule` chỉ import `FoodService`, không cần biết gì về nutrition hay ingredient.
- AI module chỉ import `FoodNutritionService` khi cần tra cứu dinh dưỡng.
- Client chỉ gọi đúng endpoint cần thiết, không bị lẫn với endpoint khác.

### D — Dependency Inversion
- Mọi service đều phụ thuộc vào `PrismaService` (abstraction được inject qua DI).
- Không có service nào `new` trực tiếp một service khác.
- `DishIngredientService` không import `FoodNutritionService` — nếu cần tính dinh dưỡng thì gọi qua event hoặc để controller điều phối.

---

## 8. Thứ tự thực hiện

```
Bước 1  Sửa schema.prisma — thêm 4 model mới + sửa Food model
        └── npx prisma migrate dev --name add_food_module_extensions
        └── npx prisma generate

Bước 2  Tạo thư mục controllers/, services/, dto/ trong food/

Bước 3  Implement NutritionComponent (ít phụ thuộc nhất)
        └── createComponent, findAllComponents
        └── Tạo route POST /nutrition-components (Admin)

Bước 4  Implement FoodCategory
        └── CRUD + self-reference tree
        └── Seed data: "Món chính", "Món phụ", "Đồ uống"...

Bước 5  Sửa CreateFoodDto — thêm categoryId, foodType (optional, default INGREDIENT)

Bước 6  Implement FoodNutrition + FoodNutritionValue
        └── upsertValues nhận mảng [{componentId, value}]

Bước 7  Implement DishIngredient
        └── Validate dishId phải có foodType = "DISH"

Bước 8  Cập nhật food.module.ts — đăng ký tất cả providers/controllers

Bước 9  Cập nhật app.module.ts nếu có thay đổi import

Bước 10 Viết unit test cho FoodNutritionService.calculateFromIngredients()
        └── Đây là method phức tạp nhất — cần test kỹ
```

---

## 9. Lưu ý đặc biệt

### Backward Compatibility
Field `category` (String) trên `Food` model hiện có **vẫn giữ nguyên** trong bước đầu. Chỉ xóa sau khi:
1. Migration dữ liệu cũ sang `categoryId` xong.
2. Tất cả endpoint đang dùng `category` đã được chuyển sang dùng `categoryId`.

### FoodImage Module
`FoodImageModule` đang tách riêng và hoạt động tốt. **Không cần gộp** trong lần refactor này — ưu tiên ổn định hơn là gộp tất cả.

### calculateFromIngredients Logic
```
Với mỗi DishIngredient của dishId:
  Lấy FoodNutrition của ingredient (per 100g)
  Tính: value * (quantityGrams / servingSize)
  Cộng dồn tất cả ingredients
Tạo FoodNutrition mới với isCalculated = true
Upsert FoodNutritionValue cho từng NutritionComponent
```
