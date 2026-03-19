# Seed Dataset Design — Food Recommendation System

> **Mục tiêu:** Tạo dataset đủ tốt để test các thuật toán recommendation: content-based filtering, collaborative filtering, hybrid.

---

## 1. Phân tích entity phục vụ recommendation

Schema được chia thành 4 nhóm chức năng chính:

### 1.1 User context (`User`, `UserProfile`, `NutritionGoal`)

Xác định `remaining_nutrition` (target - consumed), `goal_type`, và `burned_calories` từ `WorkoutLog`. Đây là input cho content score trong `HybridRecommender._content_score()`.

### 1.2 Safety filter (`UserAllergy`, `Allergen`, `IngredientAllergen`)

Hard filter loại bỏ food có allergen trùng khớp **trước khi** đưa vào scoring. Chuỗi: `Food → FoodIngredient → IngredientAllergen → Allergen`.

### 1.3 Food catalog (`Food`, `FoodCategory`, `FoodNutritionProfile`, `FoodNutritionValue`, `Nutrient`, `Ingredient`)

Dữ liệu nutrition vector để tính cosine similarity giữa `food.nutrition` và `user.remaining_nutrition`. Meal affinity được tính từ tần suất ăn vào từng bữa trong `MealItem` history.

### 1.4 User history (`DailyLog`, `Meal`, `MealItem`)

Toàn bộ lịch sử dùng để tính:

- **Collaborative scores** — neighbor similarity qua `load_candidate_collaborative_scores()`
- **Meal affinity** — tỷ lệ food được ăn vào từng `MealType`
- **Repeat penalty** — số lần ăn food X trong 7 ngày gần nhất
- **`total_logs`** — quyết định alpha/beta weights trong `_dynamic_weights()`

---

## 2. Số lượng records cần thiết

| Bảng                      | Records     | Ghi chú                                                                                                              |
| ------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| `users`                   | **60**      | 10 cold-start · 25 moderate · 25 heavy                                                                               |
| `user_profiles`           | 60          | 1:1 với user                                                                                                         |
| `nutrition_goals`         | 70–80       | 1 active goal/user; vài user có goal cũ expired                                                                      |
| `allergens`               | 12          | Peanut, Gluten, Dairy, Egg, Shellfish, Soy, Tree Nut, Fish, Sesame, Wheat, Lupin, Mustard                            |
| `user_allergies`          | 30–40       | ~30% user có ≥1 allergy để test hard-filter path                                                                     |
| `food_categories`         | 15          | Cơm, Bún, Phở, Mì, Bánh mì, Salad, Sandwich, Soup, Grill, Stir-fry, Snack, Dessert, Drink, Breakfast bowl, Rice bowl |
| `foods`                   | **120**     | ~8 foods/category; 20% món mới (createdAt ≤ 7 ngày)                                                                  |
| `nutrients`               | 8           | Calories, Protein, Carbohydrates, Fat, Fiber, Sodium, Sugar, Cholesterol                                             |
| `food_nutrition_profiles` | 120         | 1:1 với food                                                                                                         |
| `food_nutrition_values`   | ~600        | 120 foods × 5 nutrients chính                                                                                        |
| `ingredients`             | 80          | Shared across foods                                                                                                  |
| `ingredient_allergens`    | 40–50       | ~60% ingredients không có allergen                                                                                   |
| `daily_logs`              | ~1.200      | Phân bổ theo tier user                                                                                               |
| `meals`                   | ~3.600      | 3 meals/log trung bình                                                                                               |
| `meal_items`              | **~12.000** | ~3.5 items/meal — signal chính cho Collaborative Filtering                                                           |

---

## 3. Data distribution

### 3.1 User tiers

Dựa trên logic `_dynamic_weights()` trong `hybrid.py`, `total_logs` quyết định alpha/beta weights:

| Tier           | Count | total_logs | Alpha | Beta | Gamma | Ghi chú                                        |
| -------------- | ----- | ---------- | ----- | ---- | ----- | ---------------------------------------------- |
| **Cold start** | 10    | 0–9        | 0.95  | 0.00 | 0.05  | Content-based only; test popular-fallback path |
| **Moderate**   | 25    | 10–60      | 0.55  | 0.35 | 0.10  | Hybrid scoring bắt đầu active                  |
| **Heavy**      | 25    | 61–200+    | 0.40  | 0.50 | 0.10  | CF dominant; test repeat penalty               |

> **Lưu ý:** Các con số alpha/beta trên là khi `has_cf=True`. Khi không có collaborative neighbors, beta = 0 ở mọi tier.

### 3.2 Goal type distribution

| goalType      | Count | Target calories | Protein | Carbs | Fat | Fiber |
| ------------- | ----- | --------------- | ------- | ----- | --- | ----- |
| `WEIGHT_LOSS` | 20    | 1.600 kcal      | 120g    | 160g  | 50g | 25g   |
| `WEIGHT_GAIN` | 15    | 2.800 kcal      | 160g    | 350g  | 90g | 20g   |
| `MAINTENANCE` | 20    | 2.000 kcal      | 100g    | 250g  | 65g | 25g   |
| `STRICT_DIET` | 5     | 1.500 kcal      | 130g    | 140g  | 45g | 30g   |

> `STRICT_DIET` kích hoạt logic đặc biệt trong `_dynamic_weights()`: alpha tăng +0.10, beta giảm -0.10.

### 3.3 Food catalog distribution

- **Calorie range:** 80–900 kcal/100g, phân bổ normal distribution quanh 300–500 kcal.
- **Meal affinity:** Cần seed MealItem history với pattern rõ ràng (phở → BREAKFAST/LUNCH, snack → SNACK only).
- **New items:** 20–25 foods có `createdAt` ≤ 7 ngày để test `new_item_window_days` injection path.
- **Allergen coverage:** Ít nhất 30 foods chứa ≥1 allergen để test hard-filter.
- **Popularity spread:** Phân bổ Pareto — 20% foods chiếm 80% lượt ăn để test popular-fallback sorting.
- **Edge case:** 3–5 foods có `nutrition.calories = 0` → phải bị loại bởi hard filter.

### 3.4 Meal affinity templates

```
Phở:            BREAKFAST=0.55, LUNCH=0.30, DINNER=0.10, SNACK=0.05
Cơm:            BREAKFAST=0.05, LUNCH=0.45, DINNER=0.45, SNACK=0.05
Salad:          BREAKFAST=0.10, LUNCH=0.55, DINNER=0.30, SNACK=0.05
Snack:          BREAKFAST=0.10, LUNCH=0.05, DINNER=0.05, SNACK=0.80
Breakfast bowl: BREAKFAST=0.75, LUNCH=0.15, DINNER=0.05, SNACK=0.05
Grill:          BREAKFAST=0.05, LUNCH=0.30, DINNER=0.60, SNACK=0.05
Default:        uniform 0.25 mỗi loại
```

### 3.5 User preference clusters (quan trọng cho CF)

Cần tạo **cluster rõ ràng** thay vì random hoàn toàn để CF có đủ signal tìm neighbors:

| Cluster | Fav categories               | Goal type   | Users |
| ------- | ---------------------------- | ----------- | ----- |
| A       | Salad, Grill, Breakfast bowl | WEIGHT_LOSS | 12    |
| B       | Cơm, Bún, Phở                | MAINTENANCE | 12    |
| C       | Grill, Rice bowl, Sandwich   | WEIGHT_GAIN | 12    |
| D       | Snack, Dessert, Drink        | MAINTENANCE | 9     |
| E       | Soup, Salad, Mì              | STRICT_DIET | 5     |

> Cold-start users (10 người) **không assign cluster** → test cold path thuần túy.

---

## 4. Test cases cần cover

| Case                           | Setup                                                         | Expected behavior                                                 |
| ------------------------------ | ------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Cold start — no history**    | User tier cold, `total_logs = 0`                              | `strategy = content-based-filtering`, weights `(0.95, 0.0, 0.05)` |
| **Cold start — all low score** | Food catalog thiếu nutrition data                             | `strategy = popular-fallback`                                     |
| **Allergy hard block**         | User có Peanut allergy, 40% foods chứa Peanut                 | Không có food chứa peanut trong result                            |
| **Allergy threshold fallback** | Sau filter allergy + affinity còn < 5 foods                   | Threshold giảm xuống `/2`, re-filter                              |
| **CF neighbors found**         | Tier 2/3 user trong cluster, cluster mates có lịch sử rõ ràng | `collaborative_score > 0`, `strategy = hybrid`                    |
| **Repeat penalty max**         | User ăn food X đúng `repeat_threshold` lần trong 7 ngày       | `repeat_penalty = 1.0`                                            |
| **New item injection**         | Food mới tạo ≤ 7 ngày, `content_score >= 0.15`                | Food mới xuất hiện ở vị trí `index=2`                             |
| **Diversity rerank**           | 1 category có 5+ high-score foods                             | Tối đa 2 foods/category trong top 10                              |
| **Guest user**                 | `user_id = null`                                              | `UserContextRecord(user_id=None)`, không crash                    |
| **User not found**             | `user_id = 9999` (không tồn tại)                              | HTTP 404, `EC=1001`                                               |
| **STRICT_DIET weight shift**   | `goal_type = STRICT_DIET`                                     | alpha +0.10, beta -0.10                                           |
| **Hybrid strategy**            | Tier 3 user, CF neighbors tồn tại                             | `strategy = hybrid`, cả content + CF scores > 0                   |

---

## 5. Logic generate data (Python pseudo-code)

### 5.1 Master data

```python
NUTRIENTS = [
    {"name": "Calories",       "unit": "UNIT_KG"},   # LOWER(n.name) IN ('calories','energy')
    {"name": "Protein",        "unit": "UNIT_G"},
    {"name": "Carbohydrates",  "unit": "UNIT_G"},     # LOWER IN ('carbs','carbohydrates')
    {"name": "Fat",            "unit": "UNIT_G"},
    {"name": "Fiber",          "unit": "UNIT_G"},     # LOWER IN ('fiber','fibre','dietary fiber')
    {"name": "Sodium",         "unit": "UNIT_MG"},
    {"name": "Sugar",          "unit": "UNIT_G"},
    {"name": "Cholesterol",    "unit": "UNIT_MG"},
]

ALLERGENS = [
    "Peanut", "Gluten", "Dairy", "Egg", "Shellfish",
    "Soy", "Tree Nut", "Fish", "Sesame", "Wheat", "Lupin", "Mustard"
]

CATEGORIES = [
    "Cơm", "Bún", "Phở", "Mì", "Bánh mì",
    "Salad", "Sandwich", "Soup", "Grill", "Stir-fry",
    "Snack", "Dessert", "Drink", "Breakfast bowl", "Rice bowl"
]
```

### 5.2 Food catalog generator

```python
import random
from datetime import datetime, timedelta

# (calories_mean, calories_std, protein_ratio, carb_ratio, fat_ratio, fiber_ratio)
NUTRITION_TEMPLATE = {
    "Salad":          (180,  40,  0.20, 0.50, 0.25, 0.10),
    "Phở":            (380,  60,  0.25, 0.55, 0.18, 0.05),
    "Cơm":            (450,  80,  0.18, 0.60, 0.18, 0.06),
    "Snack":          (280,  70,  0.08, 0.55, 0.35, 0.04),
    "Grill":          (520, 100,  0.40, 0.20, 0.38, 0.04),
    "Breakfast bowl": (350,  60,  0.22, 0.55, 0.20, 0.08),
    "Soup":           (220,  50,  0.20, 0.45, 0.25, 0.08),
    "default":        (400, 100,  0.20, 0.50, 0.25, 0.06),
}

def generate_nutrition(category: str) -> dict:
    tmpl = NUTRITION_TEMPLATE.get(category, NUTRITION_TEMPLATE["default"])
    cal_mean, cal_std, p_r, c_r, f_r, fi_r = tmpl
    calories = max(80, random.gauss(cal_mean, cal_std))
    return {
        "Calories":      round(calories, 1),
        "Protein":       round(calories * p_r / 4, 1),   # 1g protein = 4 kcal
        "Carbohydrates": round(calories * c_r / 4, 1),   # 1g carb   = 4 kcal
        "Fat":           round(calories * f_r / 9, 1),   # 1g fat    = 9 kcal
        "Fiber":         round(calories * fi_r / 2, 1),
    }

def generate_foods(categories: list, n: int = 120) -> list:
    now = datetime.utcnow()
    foods = []
    for i in range(n):
        cat = categories[i % len(categories)]
        is_new = i < 24  # 20% foods mới (index 0–23)
        created_at = (
            now - timedelta(days=random.randint(0, 3))
            if is_new
            else now - timedelta(days=random.randint(8, 365))
        )
        foods.append({
            "foodName":   f"{cat} #{i+1:03d}",
            "category":   cat,
            "createdAt":  created_at,
            "nutrition":  generate_nutrition(cat),
            # edge case: 3 foods có calories = 0 để test hard filter
            "skip_nutrition": i in [50, 75, 100],
        })
    return foods
```

### 5.3 User + UserProfile generator

```python
GOAL_CONFIG = {
    "WEIGHT_LOSS": {"calories": 1600, "protein": 120, "carbs": 160, "fat": 50,  "fiber": 25},
    "WEIGHT_GAIN": {"calories": 2800, "protein": 160, "carbs": 350, "fat": 90,  "fiber": 20},
    "MAINTENANCE": {"calories": 2000, "protein": 100, "carbs": 250, "fat": 65,  "fiber": 25},
    "STRICT_DIET": {"calories": 1500, "protein": 130, "carbs": 140, "fat": 45,  "fiber": 30},
}

def generate_user(uid: int, tier: str, goal_type: str, cluster: str | None) -> dict:
    age    = random.randint(20, 55)
    gender = random.choice(["male", "female"])
    weight = random.uniform(50, 95)
    height = random.uniform(155, 185)
    bmi    = weight / ((height / 100) ** 2)

    # Harris-Benedict BMR
    bmr = (
        88.36 + 13.4 * weight + 4.8 * height - 5.7 * age
        if gender == "male"
        else 447.6 + 9.25 * weight + 3.1 * height - 4.3 * age
    )
    activity_factor = random.choice([1.2, 1.375, 1.55, 1.725])

    return {
        "email":    f"user{uid:03d}@seed.test",
        "fullName": f"User {uid:03d}",
        "tier":     tier,
        "cluster":  cluster,
        "profile": {
            "age": age, "height": round(height, 1), "weight": round(weight, 1),
            "bmi":  round(bmi, 2),
            "bmr":  round(bmr, 1),
            "tdee": round(bmr * activity_factor, 1),
            "gender": gender,
            "activityLevel": random.choice(
                ["SEDENTARY", "LIGHTLY_ACTIVE", "MODERATELY_ACTIVE"]
            ),
        },
        "goal": {
            "goalType": goal_type,
            **GOAL_CONFIG[goal_type],
            # Thêm noise nhỏ để targets không giống nhau hoàn toàn
            "targetCalories": GOAL_CONFIG[goal_type]["calories"] + random.randint(-100, 100),
        },
    }
```

### 5.4 History generator (signal chính cho CF)

```python
from datetime import date, timedelta

CLUSTER_PREFS = {
    "A": ["Salad", "Grill", "Breakfast bowl"],
    "B": ["Cơm", "Bún", "Phở"],
    "C": ["Grill", "Rice bowl", "Sandwich"],
    "D": ["Snack", "Dessert", "Drink"],
    "E": ["Soup", "Salad", "Mì"],
}

TIER_LOGS = {
    "cold":     (0, 9),
    "moderate": (10, 60),
    "heavy":    (61, 200),
}

def generate_history(user: dict, all_foods: list) -> list:
    tier     = user["tier"]
    cluster  = user["cluster"]
    min_logs, max_logs = TIER_LOGS[tier]
    target_logs = random.randint(min_logs, max_logs)

    # Xác định preferred foods dựa trên cluster
    fav_cats = CLUSTER_PREFS.get(cluster, []) if cluster else []
    preferred = [f for f in all_foods if f["category"] in fav_cats]
    other     = [f for f in all_foods if f["category"] not in fav_cats]

    daily_logs = []
    for day_offset in range(target_logs):
        log_date   = date.today() - timedelta(days=day_offset)
        meal_types = random.sample(
            ["BREAKFAST", "LUNCH", "DINNER"],
            k=random.choice([2, 3])
        )
        meals = []
        for meal_type in meal_types:
            # 70% chọn từ preferred → tạo preference signal rõ ràng cho CF
            pool  = preferred if (random.random() < 0.7 and preferred) else other
            items = random.sample(pool, k=min(random.randint(1, 3), len(pool)))
            meals.append({
                "mealType": meal_type,
                "items": [
                    {
                        "foodId":   f["id"],
                        "quantity": round(random.uniform(0.8, 1.5), 2),
                        # Pre-compute nutrition (quantity × per-100g values)
                        "calories": round(f["nutrition"]["Calories"] * items[0]["quantity"] / 100, 2),
                        "protein":  round(f["nutrition"]["Protein"]  * items[0]["quantity"] / 100, 2),
                        "carbs":    round(f["nutrition"]["Carbohydrates"] * items[0]["quantity"] / 100, 2),
                        "fat":      round(f["nutrition"]["Fat"]      * items[0]["quantity"] / 100, 2),
                        "fiber":    round(f["nutrition"]["Fiber"]    * items[0]["quantity"] / 100, 2),
                    }
                    for f in items
                ]
            })
        daily_logs.append({"logDate": log_date, "meals": meals})

    return daily_logs
```

### 5.5 Edge case users

```python
EDGE_CASE_USERS = [
    # guest — không có user_id, test UserContextRecord(user_id=None)
    {"type": "guest", "user_id": None},

    # user không tồn tại — test 404 path
    {"type": "not_found", "user_id": 9999},

    # user có allergy bao phủ nhiều foods
    {"type": "heavy_allergy", "allergies": ["Gluten", "Dairy", "Egg"], "tier": "heavy"},

    # user chưa có nutrition goal → remaining_nutrition = zeros
    {"type": "no_goal", "tier": "moderate"},

    # user có goal đã expired (endDate trong quá khứ)
    {"type": "expired_goal", "tier": "moderate"},
]
```

---

## 6. Script structure

```
seed/
├── 01_master_data.sql     # Nutrients, Allergens, FoodCategories
├── 02_foods.py            # 120 foods + nutrition profiles
├── 03_ingredients.py      # 80 ingredients + allergen links
├── 04_users.py            # 60 users theo 3 tiers + 5 clusters
├── 05_goals.py            # NutritionGoal per user
├── 06_history.py          # DailyLog → Meal → MealItem (bulk insert)
├── 07_edge_cases.py       # Guest, strict_diet, no_goal, expired_goal
└── run_all.py             # Orchestrator với dependency ordering
```

### Thứ tự insert bắt buộc

```
allergens
  → food_categories
    → foods
      → food_nutrition_profiles
        → food_nutrition_values       ← cần nutrient IDs
      → ingredients
        → ingredient_allergens        ← cần allergen IDs
        → food_ingredients
users
  → user_profiles
  → nutrition_goals
  → user_allergies                    ← cần allergen IDs
  → daily_logs
    → meals
      → meal_items                    ← cần food IDs
```

---

## 7. Checklist kiểm tra sau khi seed

```sql
-- Kiểm tra food có đủ nutrition
SELECT COUNT(*) FROM foods f
LEFT JOIN food_nutrition_profiles fnp ON fnp."foodId" = f.id
WHERE fnp.id IS NULL;
-- Expected: 0

-- Kiểm tra phân bổ meal affinity (phải có đủ data cho cả 4 meal types)
SELECT m."mealType", COUNT(DISTINCT mi."foodId") AS unique_foods
FROM meal_items mi
JOIN meals m ON m.id = mi."mealId"
GROUP BY m."mealType";
-- Expected: mỗi meal type có ít nhất 30 unique foods

-- Kiểm tra collaborative filtering có đủ overlap
WITH user_foods AS (
  SELECT dl."userId", mi."foodId"
  FROM meal_items mi
  JOIN meals m ON m.id = mi."mealId"
  JOIN daily_logs dl ON dl.id = m."dailyLogId"
  GROUP BY dl."userId", mi."foodId"
)
SELECT u1."userId", COUNT(*) AS shared_with_others
FROM user_foods u1
JOIN user_foods u2 ON u1."foodId" = u2."foodId" AND u1."userId" <> u2."userId"
GROUP BY u1."userId"
HAVING COUNT(*) < 5
ORDER BY shared_with_others ASC;
-- Expected: cold-start users (total_logs < 10) được phép ở đây; moderate/heavy không nên

-- Kiểm tra allergy hard filter hoạt động
-- (Chạy qua service, không phải SQL)
-- GET /v1/recommendations?user_id=<heavy_allergy_user>&meal_type=LUNCH
-- Verify: không có food nào trong result chứa allergen của user đó
```

---
