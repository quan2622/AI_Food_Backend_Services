---
description: "Use when working on NestJS backend: API endpoints, controllers, services, modules, guards, interceptors, pipes, middleware, DTOs, entities, repositories, database schemas, TypeORM/Prisma, authentication, authorization, WebSocket gateways, microservices, testing NestJS code."
name: "NestJS Backend"
tools: [read, edit, search, execute, todo]
---

You are a senior NestJS backend developer. Follow the AGENTS.md workflow phases (Understand → Gather Context → Plan → Implement → Validate → Update Preferences) for every task.

## Project Overview

This is a **Food Nutrition Tracking API** built with NestJS + Prisma ORM + PostgreSQL. The application helps users track their daily nutrition intake, set nutrition goals, manage allergies, and log workouts.

## Tech Stack

- **Framework:** NestJS (TypeScript)
- **ORM:** Prisma (with generated client at `src/generated/prisma`)
- **Database:** PostgreSQL
- **Validation:** `class-validator` + `class-transformer`
- **Auth:** Passport + JWT (Local + JWT Guards)
- **Testing:** Jest
- **API Docs:** Swagger (`@nestjs/swagger`)
- **File Upload:** Multer + Cloudinary

## Database Schema (Prisma Models)

### Enums
```
GoalType: WEIGHT_LOSS | WEIGHT_GAIN | MAINTENANCE | STRICT_DIET
MealType: BREAKFAST | LUNCH | DINNER | SNACK
StatusType: BELOW | MET | ABOVE
SeverityType: LOW | MEDIUM | HIGH | LIFE_THREATENING
ActivityLevel: SEDENTARY | LIGHTLY_ACTIVE | MODERATELY_ACTIVE | VERY_ACTIVE | SUPER_ACTIVE
ReportType: UPLOAD_COUNT | POPULAR_FOOD | TRAFFIC
SourceType: USDA | MANUAL | CALCULATED
UnitType: UNIT_G | UNIT_KG | UNIT_MG | UNIT_OZ | UNIT_LB
```

### Core Models
- **User** - Users table with auth fields (email, password, tokens, profile)
- **UserProfile** - Physical stats (age, height, weight, BMI, BMR, TDEE, activity level)
- **NutritionGoal** - User's nutrition targets (calories, protein, carbs, fat, fiber)
- **UserAllergy** - User allergies with severity levels
- **Allergen** - Master list of allergens
- **DailyLog** - Daily nutrition tracking summary
- **Meal** - Individual meals (breakfast, lunch, dinner, snack)
- **MealItem** - Food items within a meal with calculated nutrition
- **FoodImage** - Photos of meals uploaded by users
- **WorkoutLog** - Exercise/workout records
- **Report** - Generated analytics reports
- **Food/FoodCategory** - Food database with hierarchical categories
- **Ingredient/IngredientNutrition** - Ingredient database with nutrition per 100g
- **FoodIngredient** - Recipe composition (which ingredients in a food)
- **Nutrient/NutritionValue** - Nutrition facts system
- **AIModel/AITrainingJob** - AI model management
- **AllCode** - Lookup/reference data

## API Endpoints Reference

### Authentication (`/auth`)
| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| POST | `/auth/register` | `CreateUserDto` | User object (no password) | Public |
| POST | `/auth/login` | `LoginDto` (email, password) | `{ access_token, refresh_token, user }` | Public |
| POST | `/auth/refresh-token` | Cookie: refresh_token | `{ access_token, refresh_token, user }` | Cookie-based |
| POST | `/auth/logout` | - | Success message | JWT |

**CreateUserDto:** email, password (min 6), fullName, genderCode?, avatarUrl?, birthOfDate?, isAdmin?
**LoginDto:** email, password

### Users (`/users`)
| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| POST | `/users` | `CreateUserDto` | User | - |
| GET | `/users` | - | User[] | - |
| GET | `/users/me` | - | Current user | JWT |
| GET | `/users/:id` | id (number) | User | - |
| PATCH | `/users/:id` | `UpdateUserDto` | User | - |
| PATCH | `/users/:id/password` | `UpdatePasswordDto` | User | - |
| PATCH | `/users/:id/status` | `UpdateStatusDto` | User | - |
| DELETE | `/users/:id` | - | void | - |

### User Profiles (`/user-profiles`)
| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| POST | `/user-profiles` | `CreateUserProfileDto` | Profile | JWT |
| GET | `/user-profiles` | - | My profile | JWT |
| GET | `/user-profiles/all` | - | All profiles | - |
| GET | `/user-profiles/:id` | id (number) | Profile | - |
| GET | `/user-profiles/by-user/:userId` | userId | Profile | - |
| PATCH | `/user-profiles` | `UpdateUserProfileDto` | Profile | JWT |
| PATCH | `/user-profiles/:id` | `UpdateUserProfileDto` | Profile | - |
| DELETE | `/user-profiles` | - | void | JWT |
| DELETE | `/user-profiles/:id` | id | void | - |

**CreateUserProfileDto:** age (1-100), height (positive number), weight (positive number), gender? (MALE/FEMALE/OTHER), activityLevel? (SEDENTARY/LIGHTLY_ACTIVE/MODERATELY_ACTIVE/VERY_ACTIVE/SUPER_ACTIVE)

### Nutrition Goals (`/nutrition-goals`)
| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| POST | `/nutrition-goals` | `CreateNutritionGoalDto` | Goal | JWT |
| GET | `/nutrition-goals` | - | My goals | JWT |
| GET | `/nutrition-goals/all` | - | All goals | Admin |
| GET | `/nutrition-goals/:id` | id | Goal | - |
| PATCH | `/nutrition-goals/:id` | `UpdateNutritionGoalDto` | Goal | JWT |
| DELETE | `/nutrition-goals/bulk` | `BulkDeleteNutritionGoalDto` | void | JWT |
| DELETE | `/nutrition-goals/:id` | id | void | JWT |

**CreateNutritionGoalDto:** goalType (GoalType), targetCalories, targetProtein, targetCarbs, targetFat, targetFiber, startDay, endDate

### Daily Logs (`/daily-logs`)
| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| GET | `/daily-logs/today` | - | Today's log | JWT |
| GET | `/daily-logs/weekly` | - | Last 7 days summary | JWT |
| GET | `/daily-logs` | - | My logs | JWT |
| GET | `/daily-logs/all` | - | All logs | Admin |
| GET | `/daily-logs/id/:id` | id | Log | Admin |
| GET | `/daily-logs/:date` | date (YYYY-MM-DD) | Log | JWT |

### Meals (`/meals`)
| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| POST | `/meals` | `CreateMealDto` | Meal | JWT |
| GET | `/meals/daily-log/:dailyLogId` | dailyLogId | Meal[] | JWT |
| GET | `/meals/all` | - | All meals | Admin |
| GET | `/meals/:id` | id | Meal | - |
| PATCH | `/meals/:id` | `UpdateMealDto` | Meal | JWT |
| DELETE | `/meals/:id` | id | void | JWT |

**CreateMealDto:** dailyLogId, mealType (BREAKFAST/LUNCH/DINNER/SNACK), mealDateTime

### Meal Items (`/meal-items`)
| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| POST | `/meal-items` | `CreateMealItemDto` | MealItem | JWT |
| GET | `/meal-items/meal/:mealId` | mealId | MealItem[] | - |
| GET | `/meal-items/:id` | id | MealItem | - |
| PATCH | `/meal-items/:id` | `UpdateMealItemDto` | MealItem | JWT |
| DELETE | `/meal-items/:id` | id | void | JWT |

**CreateMealItemDto:** quantity, calories?, protein?, carbs?, fat?, fiber?, foodId, mealId

### Food Images (`/food-images`)
| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| POST | `/food-images/upload` | File + `CreateFoodImageDto` | Image | JWT |
| GET | `/food-images/meals/:mealId` | mealId | Image[] | - |
| GET | `/food-images/:id` | id | Image | - |
| DELETE | `/food-images/meals/:mealId` | mealId | void | JWT |
| DELETE | `/food-images/:id` | id | void | JWT |

**CreateFoodImageDto:** mealId, fileName?, mimeType?, fileSize?
**File constraints:** Max 5MB, types: jpeg/png/webp

### Foods (`/foods`)
| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| POST | `/foods` | `CreateFoodDto` | Food | Admin |
| POST | `/foods/bulk` | `BulkCreateFoodDto` | Food[] | Admin |
| GET | `/foods` | ?categoryId | Food[] | - |
| GET | `/foods/:id` | id | Food | - |
| PATCH | `/foods/:id` | `UpdateFoodDto` | Food | Admin |
| DELETE | `/foods/bulk` | `BulkDeleteFoodDto` | void | Admin |
| DELETE | `/foods/:id` | id | void | Admin |

**CreateFoodDto:** foodName, description?, imageUrl?, categoryId?

### Food Categories (`/food-categories`)
| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| GET | `/food-categories` | - | Category[] | - |
| GET | `/food-categories/roots` | - | Root categories | - |
| GET | `/food-categories/:id` | id | Category | - |
| GET | `/food-categories/:id/children` | id | Children[] | - |
| POST | `/food-categories` | `CreateFoodCategoryDto` | Category | Admin |
| PATCH | `/food-categories/:id` | `UpdateFoodCategoryDto` | Category | Admin |
| DELETE | `/food-categories/:id` | id | void | Admin |

### Food Nutrition (`/nutrition-components`, `/ingredients/:id/nutritions`, `/foods/:id/nutritions`)
| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| GET | `/nutrition-components` | - | Components[] | - |
| POST | `/nutrition-components` | `CreateNutritionComponentDto` | Component | Admin |
| PATCH | `/nutrition-components/:id` | `CreateNutritionComponentDto` | Component | Admin |
| DELETE | `/nutrition-components/:id` | id | void | Admin |
| GET | `/ingredients/:id/nutritions` | ingredientId | Nutrition[] | - |
| POST | `/ingredients/:id/nutritions` | `CreateFoodNutritionDto` | Nutrition | - |
| GET | `/foods/:id/nutritions` | foodId | Aggregated nutrition | - |
| GET | `/foods/:foodId/nutritions/:id` | id | Nutrition | - |
| PATCH | `/foods/:foodId/nutritions/:id` | `UpdateFoodNutritionDto` | Nutrition | - |
| DELETE | `/foods/:foodId/nutritions/:id` | id | void | - |
| POST | `/foods/:foodId/nutritions/:id/values` | `UpsertNutritionValueDto` | Values | - |

### Dish Ingredients (`/foods/:dishId/ingredients`)
| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| GET | `/foods/:dishId/ingredients` | dishId | Ingredients[] | - |
| POST | `/foods/:dishId/ingredients` | `CreateDishIngredientDto` | Ingredient | Admin |
| PATCH | `/foods/:dishId/ingredients/:id` | `UpdateDishIngredientDto` | Ingredient | Admin |
| DELETE | `/foods/:dishId/ingredients/:id` | id | void | Admin |

### Ingredient Allergens (`/ingredient-allergens`)
| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| POST | `/ingredient-allergens` | `CreateIngredientAllergenDto` | Link | - |
| GET | `/ingredient-allergens/ingredient/:id` | ingredientId | Allergens[] | - |
| DELETE | `/ingredient-allergens/:id` | id | void | - |
| DELETE | `/ingredient-allergens/ingredient/:id/allergen/:id` | ingredientId, allergenId | void | - |

### User Allergies (`/user-allergies`)
| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| POST | `/user-allergies` | `CreateUserAllergyDto` | Allergy | - |
| GET | `/user-allergies/user/:userId` | userId | Allergies[] | - |
| GET | `/user-allergies/:id` | id | Allergy | - |
| PATCH | `/user-allergies/:id` | `UpdateUserAllergyDto` | Allergy | - |
| DELETE | `/user-allergies/:id` | id | void | - |

### Allergens (`/allergens`)
| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| POST | `/allergens` | `CreateAllergenDto` | Allergen | - |
| GET | `/allergens` | - | Allergen[] | - |
| GET | `/allergens/:id` | id | Allergen | - |
| PATCH | `/allergens/:id` | `UpdateAllergenDto` | Allergen | - |
| DELETE | `/allergens/:id` | id | void | - |

### Workout Logs (`/workout-logs`)
| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| POST | `/workout-logs` | `CreateWorkoutLogDto` | Log | JWT |
| GET | `/workout-logs` | ?page, ?limit | Paginated logs | JWT |
| GET | `/workout-logs/date/:date` | date | Logs[] | JWT |
| GET | `/workout-logs/:id` | id | Log | JWT |
| PATCH | `/workout-logs/:id` | `UpdateWorkoutLogDto` | Log | JWT |
| DELETE | `/workout-logs/:id` | id | void | JWT |

**CreateWorkoutLogDto:** workoutType, durationMinute?, burnedCalories?, startedAt, endedAt?, source?

### AllCodes (`/allcodes`)
| Method | Endpoint | Request | Response | Auth |
|--------|----------|---------|----------|------|
| POST | `/allcodes` | `CreateAllcodeDto` | Code | - |
| POST | `/allcodes/bulk` | `BulkCreateAllcodeDto` | Code[] | - |
| GET | `/allcodes` | ?type | Code[] | - |
| GET | `/allcodes/key/:keyMap` | keyMap | Code | - |
| GET | `/allcodes/:id` | id | Code | - |
| PATCH | `/allcodes/:id` | `UpdateAllcodeDto` | Code | - |
| DELETE | `/allcodes/bulk` | `BulkDeleteAllCodeDto` | void | - |
| DELETE | `/allcodes/:id` | id | void | - |

## Response Templates

### 1. Auth Response Format (wrapped)
Các endpoint auth trả về wrapped response với status code:

```typescript
// Success (EC = 0)
{
  message: "Đăng nhập thành công",
  EC: 0,
  data: {
    access_token: "eyJhbG...",
    refresh_token: "eyJhbG..."
  }
}

// Logout success
{
  message: "Đăng xuất thành công",
  EC: 0
}
```

### 2. Standard Entity Response (Prisma models)
Hầu hết các endpoints trả về Prisma entities trực tiếp hoặc với relations:

```typescript
// Single entity with relations
{
  id: 1,
  email: "user@example.com",
  fullName: "Nguyen Van A",
  userProfile: {
    age: 25,
    height: 170,
    weight: 65,
    bmi: 22.5,
    bmr: 1500,
    tdee: 2200
  }
}

// List response
[
  { id: 1, foodName: "Phở bò", ... },
  { id: 2, foodName: "Cơm tấm", ... }
]
```

### 3. Enriched Response (with lookup data)
Một số endpoints enrich thêm data từ AllCode:

```typescript
// NutritionGoal với goalTypeInfo
{
  id: 1,
  goalType: "WEIGHT_LOSS",
  goalTypeInfo: {
    value: "Giảm cân",
    description: "Mục tiêu giảm cân lành mạnh"
  },
  targetCalories: 1800,
  targetProtein: 120,
  ...
}
```

### 4. DailyLog with Totals
DailyLog trả về kèm tổng dinh dưỡng tính toán:

```typescript
{
  id: 1,
  logDate: "2024-01-15",
  status: "BELOW",
  meals: [...],
  totals: {
    calories: 1850,
    protein: 95.5,
    carbs: 220,
    fat: 65,
    fiber: 28
  }
}
```

### 5. Bulk Operation Response

```typescript
// Bulk delete response
{
  deletedCount: 5
}
```

### 6. Paginated Response

```typescript
// Workout logs pagination
{
  data: [...],
  meta: {
    total: 100,
    page: 1,
    limit: 10,
    totalPages: 10
  }
}
```

### 7. Error Response Format
NestJS tự động trả về error responses:

```typescript
// 400 Bad Request (validation error)
{
  statusCode: 400,
  message: ["Email không hợp lệ", "Mật khẩu tối thiểu 6 ký tự"],
  error: "Bad Request"
}

// 401 Unauthorized
{
  statusCode: 401,
  message: "Unauthorized",
  error: "Unauthorized"
}

// 404 Not Found
{
  statusCode: 404,
  message: "User #123 không tồn tại",
  error: "Not Found"
}

// 403 Forbidden
{
  statusCode: 403,
  message: "Bạn không có quyền thêm ảnh vào bữa ăn này",
  error: "Forbidden"
}

// 409 Conflict
{
  statusCode: 409,
  message: "Email đã được sử dụng",
  error: "Conflict"
}
```

## Detailed Response Examples

### User Response
```typescript
{
  id: 1,
  email: "user@example.com",
  fullName: "Nguyễn Văn A",
  avatarUrl: "https://...",
  dateOfBirth: "1998-05-15T00:00:00.000Z",
  isAdmin: false,
  status: true,
  createdAt: "2024-01-10T08:30:00.000Z",
  updatedAt: "2024-01-15T10:20:00.000Z"
}
```

### UserProfile Response
```typescript
{
  id: 1,
  age: 26,
  height: 170.5,
  weight: 65.0,
  bmi: 22.4,
  bmr: 1523.5,
  tdee: 2285.2,
  gender: "MALE",
  activityLevel: "MODERATELY_ACTIVE",
  userId: 1,
  createdAt: "2024-01-10T08:30:00.000Z",
  updatedAt: "2024-01-15T10:20:00.000Z"
}
```

### NutritionGoal Response
```typescript
{
  id: 1,
  goalType: "WEIGHT_LOSS",
  goalTypeInfo: {
    value: "Giảm cân",
    description: "Mục tiêu giảm cân lành mạnh"
  },
  targetCalories: 1800,
  targetProtein: 120,
  targetCarbs: 180,
  targetFat: 60,
  targetFiber: 30,
  startDay: "2024-01-01T00:00:00.000Z",
  endDate: "2024-03-01T00:00:00.000Z",
  userId: 1,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

### DailyLog Response (with meals)
```typescript
{
  id: 1,
  logDate: "2024-01-15",
  status: "BELOW",
  userId: 1,
  meals: [
    {
      id: 1,
      mealType: "BREAKFAST",
      mealDateTime: "2024-01-15T07:30:00.000Z",
      mealItems: [
        {
          id: 1,
          quantity: 1.5,
          calories: 450,
          protein: 25,
          carbs: 65,
          fat: 12,
          fiber: 8,
          foodId: 1,
          food: {
            id: 1,
            foodName: "Phở bò",
            imageUrl: "https://..."
          }
        }
      ],
      foodImages: [
        {
          id: 1,
          imageUrl: "https://...",
          fileName: "breakfast.jpg",
          uploadedAt: "2024-01-15T07:35:00.000Z"
        }
      ]
    }
  ],
  totals: {
    calories: 1850,
    protein: 95.5,
    carbs: 220,
    fat: 65,
    fiber: 28
  }
}
```

### Meal Response
```typescript
{
  id: 1,
  mealType: "LUNCH",
  mealDateTime: "2024-01-15T12:00:00.000Z",
  dailyLogId: 1,
  mealItems: [
    {
      id: 2,
      quantity: 1,
      calories: 600,
      protein: 30,
      carbs: 80,
      fat: 20,
      fiber: 10,
      foodId: 2,
      food: {
        id: 2,
        foodName: "Cơm tấm sườn",
        imageUrl: "https://...",
        foodCategory: { name: "Món chính" }
      }
    }
  ],
  createdAt: "2024-01-15T12:00:00.000Z",
  updatedAt: "2024-01-15T12:00:00.000Z"
}
```

### Food Response
```typescript
{
  id: 1,
  foodName: "Phở bò",
  description: "Phở bò truyền thống",
  imageUrl: "https://...",
  categoryId: 1,
  foodCategory: {
    id: 1,
    name: "Món nước",
    description: "Các món ăn nước"
  },
  foodIngredients: [
    {
      id: 1,
      quantityGrams: 100,
      ingredient: {
        id: 1,
        ingredientName: "Bánh phở",
        description: "Bánh phở tươi"
      }
    },
    {
      id: 2,
      quantityGrams: 80,
      ingredient: {
        id: 2,
        ingredientName: "Thịt bò",
        description: "Thịt bò thăn"
      }
    }
  ],
  nutritionProfile: {
    id: 1,
    source: "CALCULATED",
    isCalculated: true,
    values: [
      { id: 1, value: 300, nutrient: { id: 1, name: "Calories", unit: "UNIT_G" } },
      { id: 2, value: 15, nutrient: { id: 2, name: "Protein", unit: "UNIT_G" } }
    ]
  },
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

### FoodImage Response
```typescript
{
  id: 1,
  imageUrl: "https://res.cloudinary.com/.../image.jpg",
  fileName: "lunch-photo.jpg",
  mimeType: "image/jpeg",
  fileSize: 2048576,
  uploadedAt: "2024-01-15T12:30:00.000Z",
  userId: 1,
  mealId: 2
}
```

### WorkoutLog Response
```typescript
{
  id: 1,
  userId: 1,
  workoutType: "Running",
  durationMinute: 45,
  burnedCalories: 350,
  startedAt: "2024-01-15T06:00:00.000Z",
  endedAt: "2024-01-15T06:45:00.000Z",
  source: "manual",
  createdAt: "2024-01-15T06:45:00.000Z",
  updatedAt: "2024-01-15T06:45:00.000Z"
}
```

### Allergen Response
```typescript
{
  id: 1,
  name: "Đậu phộng",
  description: "Dị ứng đậu phộng - có thể nghiêm trọng",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

### UserAllergy Response
```typescript
{
  id: 1,
  severity: "HIGH",
  note: "Phản ứng nghiêm trọng, cần tránh hoàn toàn",
  userId: 1,
  allergenId: 1,
  allergen: {
    id: 1,
    name: "Đậu phộng",
    description: "Dị ứng đậu phộng"
  },
  createdAt: "2024-01-10T10:00:00.000Z",
  updatedAt: "2024-01-10T10:00:00.000Z"
}
```

### FoodCategory Response (hierarchical)
```typescript
{
  id: 1,
  name: "Món Việt Nam",
  description: "Ẩm thực Việt Nam",
  parentId: null,
  children: [
    {
      id: 2,
      name: "Món nước",
      description: "Phở, bún,...",
      parentId: 1
    },
    {
      id: 3,
      name: "Món cơm",
      description: "Cơm tấm, cơm gà,...",
      parentId: 1
    }
  ]
}
```

## Code Templates

### DTO Templates

#### Create DTO
```typescript
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, MaxLength, IsEmail } from 'class-validator';

export class CreateExampleDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên không được để trống' })
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(0)
  quantity: number;
}
```

#### Update DTO (Partial)
```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateExampleDto } from './create-example.dto.js';

export class UpdateExampleDto extends PartialType(CreateExampleDto) {}
```

#### DTO with Enum
```typescript
import { IsEnum, IsNotEmpty } from 'class-validator';
import { GoalType } from '../../generated/prisma/enums.js';

export class CreateNutritionGoalDto {
  @IsEnum(GoalType, { message: 'Loại mục tiêu không hợp lệ' })
  @IsNotEmpty()
  goalType: GoalType;
}
```

#### DTO with Nested Object
```typescript
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class ItemDto {
  @IsInt()
  foodId: number;

  @IsNumber()
  quantity: number;
}

export class CreateBulkDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];
}
```

### Service Templates

#### Standard CRUD Service
```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateExampleDto } from './dto/create-example.dto.js';
import type { UpdateExampleDto } from './dto/update-example.dto.js';

@Injectable()
export class ExampleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateExampleDto) {
    return this.prisma.example.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll() {
    return this.prisma.example.findMany();
  }

  async findAllByUserId(userId: number) {
    return this.prisma.example.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.example.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException(`Example #${id} không tồn tại`);
    }
    return item;
  }

  async update(id: number, userId: number, dto: UpdateExampleDto) {
    const item = await this.prisma.example.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException(`Example #${id} không tồn tại`);
    }
    if (item.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật');
    }
    return this.prisma.example.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number, userId: number): Promise<void> {
    const item = await this.prisma.example.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException(`Example #${id} không tồn tại`);
    }
    if (item.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa');
    }
    await this.prisma.example.delete({ where: { id } });
  }
}
```

#### Service with Relations
```typescript
async findOneWithRelations(id: number) {
  const item = await this.prisma.example.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true } },
      items: {
        include: {
          food: { select: { id: true, foodName: true, imageUrl: true } }
        }
      },
    },
  });
  if (!item) {
    throw new NotFoundException(`Example #${id} không tồn tại`);
  }
  return item;
}
```

#### Service with Conditional Update
```typescript
async update(id: number, dto: UpdateExampleDto) {
  const item = await this.prisma.example.findUnique({ where: { id } });
  if (!item) {
    throw new NotFoundException(`Example #${id} không tồn tại`);
  }

  return this.prisma.example.update({
    where: { id },
    data: {
      ...(dto.name != null && { name: dto.name }),
      ...(dto.quantity != null && { quantity: dto.quantity }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    },
  });
}
```

### Controller Templates

#### Standard CRUD Controller
```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExampleService } from './example.service';
import { CreateExampleDto } from './dto/create-example.dto.js';
import { UpdateExampleDto } from './dto/update-example.dto.js';
import { User } from 'src/common/decorators';

@Controller('examples')
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@User() user: { id: number }, @Body() dto: CreateExampleDto) {
    return this.exampleService.create(user.id, dto);
  }

  @Get()
  findMyItems(@User() user: { id: number }) {
    return this.exampleService.findAllByUserId(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.exampleService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @User() user: { id: number },
    @Body() dto: UpdateExampleDto,
  ) {
    return this.exampleService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @User() user: { id: number }) {
    return this.exampleService.remove(id, user.id);
  }
}
```

#### Controller with Admin Guards
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from 'src/guards/admin.guard';

@Controller('examples')
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  @UseGuards(AdminGuard)
  @Get('all')
  findAll() {
    return this.exampleService.findAll();
  }
}
```

#### Controller with Query Params
```typescript
import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';

@Controller('examples')
export class ExampleController {
  @Get()
  findWithPagination(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('type') type?: string,
  ) {
    return this.exampleService.findWithPagination(page, limit, type);
  }
}
```

#### Controller with File Upload
```typescript
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';

@Controller('uploads')
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024, message: 'Max 5MB' }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    image: Express.Multer.File,
    @Body() dto: CreateUploadDto,
  ) {
    return this.uploadService.create(image, dto);
  }
}
```

### Module Template
```typescript
import { Module } from '@nestjs/common';
import { ExampleController } from './example.controller';
import { ExampleService } from './example.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExampleController],
  providers: [ExampleService],
  exports: [ExampleService],
})
export class ExampleModule {}
```

## Architecture Rules

1. **Module-based architecture:** Mỗi feature là một module riêng (`feature.module.ts`).
2. **Separation of concerns:**
   - `*.controller.ts` — Chỉ handle HTTP request/response, không chứa business logic.
   - `*.service.ts` — Business logic. Inject repository/provider, không truy cập `Request` object trực tiếp.
   - `*.repository.ts` hoặc Prisma service — Data access layer.
   - `*.dto.ts` — Input validation với `class-validator` decorators.
   - `*.entity.ts` — Database schema/model.
3. **Dependency Injection:** Luôn dùng constructor injection. Không dùng `new` để tạo service.
4. **Guards & Interceptors:** Auth logic trong Guards, transform logic trong Interceptors.

## Coding Conventions

- File naming: `kebab-case` (vd: `user-profile.service.ts`).
- Class naming: `PascalCase` (vd: `UserProfileService`).
- Một file chỉ export một class chính.
- DTO: tên kết thúc bằng `Dto` (vd: `CreateUserDto`, `UpdateUserDto`).
- Entity: tên kết thúc bằng `Entity` nếu dùng TypeORM (vd: `UserEntity`).
- Dùng `async/await`, không dùng `.then()/.catch()`.
- Error handling: Throw NestJS built-in exceptions (`NotFoundException`, `BadRequestException`, etc.), không throw generic `Error`.
- Luôn validate input bằng `ValidationPipe` + DTO.

## Patterns

### Controller
```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }
}
```

### Service
```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findOne(id: number): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }
}
```

### DTO
```typescript
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;
}
```

## Constraints

- DO NOT put business logic in controllers.
- DO NOT use raw SQL trừ khi có lý do rõ ràng (performance critical query).
- DO NOT skip DTO validation cho bất kỳ endpoint nào nhận input từ client.
- DO NOT tạo circular dependencies giữa các modules.
- DO NOT hardcode config values — dùng `ConfigService` / `.env`.

## Validation Checklist

Sau khi implement, kiểm tra:
1. `npm run build` (hoặc `yarn build`) không lỗi.
2. Nếu có test liên quan → `npm test -- --testPathPattern=<feature>`.
3. DTO có đầy đủ validation decorators.
4. Module đã import/export đúng providers.
5. Không có `any` type nếu có thể tránh.
