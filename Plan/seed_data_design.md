# Seed Dataset Design v2 — Food Recommendation System (Vietnamese)

> **Mục tiêu:** Tạo dataset có thể **kiểm soát kết quả** để verify từng nhánh thuật toán: content-based filtering, collaborative filtering, hybrid, hard filter, diversity rerank, popular-fallback. Toàn bộ món ăn là ẩm thực Việt Nam đa dạng.

---

## 1. Nguyên tắc thiết kế "controllable seed"

Thay vì random, mỗi record được đặt giá trị **cố định và có chủ đích** để output của thuật toán có thể dự đoán trước:

- **Nutrition values** → được chọn để cosine similarity với user remaining có thứ hạng rõ ràng (food A > B > C).
- **Meal affinity** → được "thao túng" bằng cách tạo MealItem history có phân bổ rõ ràng theo buổi.
- **Allergen** → gán cụ thể để biết chính xác user X sẽ bị block food nào.
- **User remaining nutrition** → được thiết kế theo từng "scenario" để expected score có thể tính tay.
- **total_logs** → cố định theo tier để alpha/beta weights hoàn toàn predictable.

---

## 2. Food catalog — Món ăn Việt Nam

### 2.1 Danh sách 15 categories

| ID  | Category          | Buổi chính       | Ghi chú                           |
| --- | ----------------- | ---------------- | --------------------------------- |
| 1   | Phở               | BREAKFAST, LUNCH | Phở bò, phở gà                    |
| 2   | Bún               | BREAKFAST, LUNCH | Bún bò, bún riêu, bún mắm         |
| 3   | Cơm               | LUNCH, DINNER    | Cơm tấm, cơm trắng, cơm chiên     |
| 4   | Mì                | BREAKFAST, LUNCH | Mì quảng, mì xào, hủ tiếu         |
| 5   | Bánh mì           | BREAKFAST, SNACK | Bánh mì thịt, bánh mì chả         |
| 6   | Gỏi & Salad       | LUNCH, DINNER    | Gỏi cuốn, gỏi gà, nộm             |
| 7   | Canh & Súp        | LUNCH, DINNER    | Canh chua, canh khổ qua           |
| 8   | Món nướng         | DINNER           | Bò nướng, heo nướng, gà nướng     |
| 9   | Món xào           | LUNCH, DINNER    | Rau xào, thịt xào, hải sản xào    |
| 10  | Cháo              | BREAKFAST        | Cháo gà, cháo lòng, cháo đậu xanh |
| 11  | Bánh & Xôi        | BREAKFAST, SNACK | Xôi gà, bánh cuốn, bánh bèo       |
| 12  | Chè & Tráng miệng | SNACK            | Chè đậu, chè trôi nước            |
| 13  | Nước uống         | SNACK            | Sinh tố, nước mía, trà sữa        |
| 14  | Nem & Cuốn        | LUNCH, DINNER    | Nem rán, gỏi cuốn                 |
| 15  | Cơm bowl          | LUNCH, DINNER    | Cơm gà Hội An, cơm tấm sườn       |

---

### 2.2 Food list — 120 món cố định

Mỗi món có `nutrition`, `allergens`, `meal_affinity_seed` được đặt **tay** có chủ đích. Nutrition unit: per 100g serving.

#### Nhóm A — Món dùng cho test HIGH PROTEIN (dành cho user WEIGHT_GAIN / WEIGHT_LOSS goal)

| food_id | Tên món             | Cal | Protein | Carbs | Fat | Fiber | Allergen  | Affinity chính             |
| ------- | ------------------- | --- | ------- | ----- | --- | ----- | --------- | -------------------------- |
| 1       | Phở bò tái          | 185 | 18      | 20    | 4.5 | 0.8   | —         | BREAKFAST(60%), LUNCH(30%) |
| 2       | Bún bò Huế          | 195 | 17      | 22    | 5.0 | 1.0   | —         | BREAKFAST(55%), LUNCH(35%) |
| 3       | Cơm tấm sườn bì chả | 420 | 28      | 48    | 12  | 2.0   | Egg       | LUNCH(50%), DINNER(40%)    |
| 4       | Gà nướng lá chanh   | 210 | 32      | 2     | 8.5 | 0.5   | —         | DINNER(65%), LUNCH(25%)    |
| 5       | Bò lúc lắc          | 280 | 30      | 8     | 14  | 1.0   | —         | DINNER(60%), LUNCH(30%)    |
| 6       | Cháo gà             | 120 | 14      | 18    | 2.5 | 0.5   | —         | BREAKFAST(80%), SNACK(15%) |
| 7       | Trứng hấp thịt bằm  | 165 | 15      | 5     | 10  | 0.3   | Egg       | LUNCH(45%), DINNER(45%)    |
| 8       | Tôm nướng muối ớt   | 135 | 26      | 3     | 2.0 | 0.0   | Shellfish | DINNER(70%), LUNCH(20%)    |

> **Test signal:** food_id 1,2,4,5,8 → protein cao → sẽ được ưu tiên cho user WEIGHT_GAIN. food_id 4,5,8 → allergen hoặc sạch allergen để test filter.

---

#### Nhóm B — Món dùng cho test HIGH FIBER / WEIGHT_LOSS

| food_id | Tên món               | Cal | Protein | Carbs | Fat | Fiber | Allergen  | Affinity chính                          |
| ------- | --------------------- | --- | ------- | ----- | --- | ----- | --------- | --------------------------------------- |
| 11      | Gỏi cuốn tôm thịt     | 95  | 8       | 14    | 2.0 | 2.5   | Shellfish | LUNCH(55%), DINNER(35%)                 |
| 12      | Nộm đu đủ bò khô      | 110 | 12      | 15    | 2.5 | 3.0   | —         | LUNCH(60%), DINNER(30%)                 |
| 13      | Canh chua cá          | 85  | 10      | 10    | 2.0 | 2.8   | Fish      | LUNCH(40%), DINNER(50%)                 |
| 14      | Rau muống xào tỏi     | 55  | 3       | 8     | 2.0 | 3.5   | —         | LUNCH(35%), DINNER(55%)                 |
| 15      | Dưa hấu & trái cây    | 45  | 1       | 11    | 0.2 | 1.2   | —         | SNACK(80%), BREAKFAST(15%)              |
| 16      | Súp bí đỏ             | 70  | 2       | 14    | 1.5 | 2.0   | —         | BREAKFAST(30%), LUNCH(40%), DINNER(25%) |
| 17      | Gỏi gà bắp cải        | 120 | 15      | 10    | 3.5 | 2.5   | —         | LUNCH(60%), DINNER(30%)                 |
| 18      | Canh khổ qua dồn thịt | 90  | 9       | 8     | 3.0 | 3.2   | —         | LUNCH(35%), DINNER(55%)                 |

> **Test signal:** food_id 11–18 → fiber cao, calories thấp → ưu tiên WEIGHT_LOSS. food_id 13 có Fish allergen → bị block cho user dị ứng cá.

---

#### Nhóm C — Món MODERATE (MAINTENANCE goal)

| food_id | Tên món              | Cal | Protein | Carbs | Fat | Fiber | Allergen          | Affinity chính                      |
| ------- | -------------------- | --- | ------- | ----- | --- | ----- | ----------------- | ----------------------------------- |
| 21      | Phở gà               | 165 | 14      | 20    | 3.5 | 0.8   | —                 | BREAKFAST(65%), LUNCH(25%)          |
| 22      | Mì Quảng             | 310 | 16      | 42    | 8.0 | 2.0   | Gluten, Shellfish | BREAKFAST(40%), LUNCH(45%)          |
| 23      | Hủ tiếu Nam Vang     | 290 | 18      | 38    | 7.5 | 1.5   | —                 | BREAKFAST(45%), LUNCH(40%)          |
| 24      | Cơm chiên dương châu | 380 | 12      | 55    | 12  | 1.5   | Egg               | LUNCH(50%), DINNER(40%)             |
| 25      | Bánh cuốn nhân thịt  | 180 | 10      | 28    | 4.0 | 1.0   | Gluten            | BREAKFAST(70%), SNACK(20%)          |
| 26      | Xôi gà               | 290 | 18      | 42    | 6.5 | 1.8   | —                 | BREAKFAST(75%), SNACK(20%)          |
| 27      | Bánh mì thịt nguội   | 260 | 12      | 35    | 8.5 | 2.0   | Gluten, Egg       | BREAKFAST(60%), SNACK(30%)          |
| 28      | Cháo đậu xanh        | 105 | 5       | 20    | 1.0 | 3.5   | —                 | BREAKFAST(65%), SNACK(25%)          |
| 29      | Nem rán (chả giò)    | 220 | 8       | 22    | 11  | 1.5   | Gluten, Egg       | LUNCH(45%), DINNER(40%), SNACK(10%) |
| 30      | Bún riêu cua         | 185 | 14      | 22    | 5.0 | 1.5   | Shellfish         | BREAKFAST(50%), LUNCH(35%)          |

---

#### Nhóm D — Món HIGH CARB / HIGH CALORIE (cho WEIGHT_GAIN test)

| food_id | Tên món            | Cal | Protein | Carbs | Fat | Fiber | Allergen          | Affinity chính             |
| ------- | ------------------ | --- | ------- | ----- | --- | ----- | ----------------- | -------------------------- |
| 31      | Cơm gà Hội An      | 440 | 22      | 62    | 12  | 2.0   | —                 | LUNCH(55%), DINNER(35%)    |
| 32      | Bún mắm            | 350 | 20      | 45    | 10  | 2.5   | Fish, Shellfish   | LUNCH(50%), DINNER(35%)    |
| 33      | Mì xào hải sản     | 420 | 18      | 58    | 14  | 2.0   | Gluten, Shellfish | LUNCH(40%), DINNER(45%)    |
| 34      | Xôi xéo            | 320 | 8       | 58    | 7.0 | 2.5   | —                 | BREAKFAST(70%), SNACK(25%) |
| 35      | Bánh bao nhân thịt | 285 | 12      | 42    | 8.0 | 1.5   | Gluten            | BREAKFAST(55%), SNACK(35%) |
| 36      | Bánh mì chả cá     | 270 | 14      | 36    | 7.5 | 1.8   | Gluten, Fish      | BREAKFAST(50%), SNACK(40%) |
| 37      | Cháo lòng          | 155 | 12      | 18    | 5.5 | 0.8   | —                 | BREAKFAST(75%), LUNCH(20%) |
| 38      | Bún thịt nướng     | 365 | 22      | 48    | 9.5 | 2.5   | —                 | LUNCH(55%), DINNER(35%)    |

---

#### Nhóm E — Món SNACK / NHẸ

| food_id | Tên món           | Cal | Protein | Carbs | Fat | Fiber | Allergen | Affinity chính             |
| ------- | ----------------- | --- | ------- | ----- | --- | ----- | -------- | -------------------------- |
| 41      | Chè đậu đỏ        | 145 | 4       | 30    | 1.5 | 4.0   | —        | SNACK(85%), BREAKFAST(10%) |
| 42      | Chè trôi nước     | 195 | 3       | 38    | 4.5 | 2.0   | —        | SNACK(80%), BREAKFAST(15%) |
| 43      | Sinh tố bơ        | 185 | 3       | 15    | 13  | 5.0   | —        | SNACK(75%), BREAKFAST(20%) |
| 44      | Nước mía          | 75  | 0.5     | 18    | 0.2 | 0.3   | —        | SNACK(70%), LUNCH(25%)     |
| 45      | Bánh bèo          | 125 | 4       | 22    | 3.0 | 0.8   | —        | SNACK(60%), BREAKFAST(30%) |
| 46      | Trà sữa trân châu | 280 | 4       | 52    | 6.5 | 0.5   | Dairy    | SNACK(90%)                 |
| 47      | Bánh tráng trộn   | 195 | 5       | 32    | 6.5 | 2.0   | —        | SNACK(85%)                 |
| 48      | Gỏi cuốn chay     | 80  | 4       | 14    | 1.5 | 2.8   | —        | SNACK(50%), LUNCH(35%)     |

---

#### Nhóm F — Món NEW ITEM (createdAt ≤ 7 ngày — để test new item injection)

| food_id | Tên món           | Cal | Protein | Carbs | Fat | Fiber | Allergen    | Ghi chú                                        |
| ------- | ----------------- | --- | ------- | ----- | --- | ----- | ----------- | ---------------------------------------------- |
| 51      | Bún đậu mắm tôm   | 310 | 16      | 38    | 10  | 2.5   | —           | New, content_score sẽ ≥ 0.15 với user moderate |
| 52      | Cơm tấm chả trứng | 395 | 24      | 50    | 10  | 1.8   | Egg         | New, bị block nếu user có Egg allergy          |
| 53      | Phở cuốn          | 175 | 14      | 22    | 4.0 | 1.5   | —           | New, affinity LUNCH cao                        |
| 54      | Bánh mì chảo      | 430 | 18      | 42    | 20  | 1.5   | Gluten, Egg | New, calories cao → test WEIGHT_LOSS penalty   |
| 55      | Chả cá Lã Vọng    | 240 | 28      | 8     | 12  | 1.0   | Fish        | New, protein cao                               |

> **Test signal:** food_id 51–55 luôn có `createdAt = now - 2 days`. Khi content_score ≥ 0.15, sẽ được inject vào `index=2` trong result. Test bằng cách verify position của food này trong response.

---

#### Nhóm G — Món EDGE CASE

| food_id | Tên món                 | Cal   | Protein | Carbs | Fat | Fiber | Mục đích                                                                     |
| ------- | ----------------------- | ----- | ------- | ----- | --- | ----- | ---------------------------------------------------------------------------- |
| 61      | [Dummy - No Nutrition]  | **0** | 0       | 0     | 0   | 0     | Test hard filter loại `calories ≤ 0`                                         |
| 62      | [Dummy - All Allergens] | 200   | 10      | 20    | 8   | 1     | Có đủ 6 allergen → test block hoàn toàn                                      |
| 63      | Bánh tráng nướng        | 155   | 3       | 28    | 4   | 1.5   | Cùng category "Bánh & Xôi" với food 45 → test diversity cap (max 2/category) |
| 64      | Bánh ướt                | 130   | 4       | 24    | 3   | 0.8   | Cùng category → food thứ 3, bị đẩy xuống overflow                            |
| 65      | Bánh khọt               | 185   | 6       | 22    | 8   | 1.0   | Cùng category → food thứ 4                                                   |

> **food_id 62** gán allergen: `Peanut, Gluten, Dairy, Egg, Shellfish, Fish` → mọi user có bất kỳ allergy nào trong danh sách đều bị block food này.

---

### 2.3 Cách tạo meal affinity có kiểm soát

Meal affinity trong service được tính từ `_fetch_food_meal_stats()` theo công thức:

```
affinity[meal_type] = (count[meal_type] + 1) / (total_count + 4)
```

Để đạt affinity target, seed `MealItem` với phân bổ **cố định** sau:

```python
# Ví dụ: food_id=1 (Phở bò) muốn BREAKFAST=60%, LUNCH=30%, DINNER=5%, SNACK=5%
# Với total = 100 lượt → count: BREAKFAST=60, LUNCH=30, DINNER=5, SNACK=5
# affinity tính ra: BREAKFAST=(60+1)/(100+4)=0.587, LUNCH=(30+1)/104=0.298 ✓

MEAL_HISTORY_SEED = {
    # food_id: {BREAKFAST: n, LUNCH: n, DINNER: n, SNACK: n}
    1:  {"BREAKFAST": 60, "LUNCH": 30, "DINNER":  5, "SNACK":  5},  # Phở bò → sáng rõ ràng
    2:  {"BREAKFAST": 55, "LUNCH": 35, "DINNER":  5, "SNACK":  5},  # Bún bò
    3:  {"BREAKFAST":  5, "LUNCH": 50, "DINNER": 40, "SNACK":  5},  # Cơm tấm → trưa/tối
    4:  {"BREAKFAST":  5, "LUNCH": 25, "DINNER": 65, "SNACK":  5},  # Gà nướng → tối rõ
    6:  {"BREAKFAST": 80, "LUNCH":  5, "DINNER":  5, "SNACK": 10},  # Cháo gà → sáng gần như 100%
    26: {"BREAKFAST": 75, "LUNCH":  5, "DINNER":  5, "SNACK": 15},  # Xôi gà → sáng
    41: {"BREAKFAST":  5, "LUNCH":  5, "DINNER":  5, "SNACK": 85},  # Chè đậu → snack gần như 100%
    46: {"BREAKFAST":  0, "LUNCH":  5, "DINNER":  5, "SNACK": 90},  # Trà sữa → snack
    # ...
}
```

Với thiết kế này, khi test `meal_type=BREAKFAST` với `meal_affinity_threshold=0.15`:

- food_id=3 (Cơm tấm): affinity BREAKFAST ≈ 0.058 → **bị loại** ✓
- food_id=6 (Cháo gà): affinity BREAKFAST ≈ 0.779 → **được giữ** ✓
- food_id=41 (Chè đậu): affinity BREAKFAST ≈ 0.058 → **bị loại** ✓

---

## 3. User profiles — Thiết kế có kiểm soát

### 3.1 User tiers & clusters

```
60 users tổng:
├── 10 Cold-start (total_logs = 0–9)     → test content-based only path
├── 25 Moderate   (total_logs = 10–60)   → test hybrid bắt đầu
└── 25 Heavy      (total_logs = 61–200)  → test CF dominant + repeat penalty
```

**5 Preference clusters** (dùng cho Collaborative Filtering):

| Cluster | Fav categories                | Goal        | Users | Ghi chú               |
| ------- | ----------------------------- | ----------- | ----- | --------------------- |
| A       | Gỏi & Salad, Cháo, Canh & Súp | WEIGHT_LOSS | 12    | Low-cal lovers        |
| B       | Phở, Bún, Mì                  | MAINTENANCE | 12    | Soup & noodle crowd   |
| C       | Cơm, Món nướng, Cơm bowl      | WEIGHT_GAIN | 12    | Rice & grill crowd    |
| D       | Chè, Bánh & Xôi, Bánh mì      | MAINTENANCE | 9     | Snack/breakfast crowd |
| E       | Canh & Súp, Gỏi & Salad, Nem  | STRICT_DIET | 5     | Diet-strict group     |

> Cold-start users **không assign cluster** → CF sẽ không tìm được neighbor → test fallback sang content-based.

---

### 3.2 Special user profiles — thiết kế để test algorithm

Đây là phần quan trọng nhất. Mỗi user dưới đây được tạo với **remaining nutrition cố định** và **lịch sử cố định** để output có thể tính toán trước.

---

#### USER-SC01 — "Perfect match content score"

> **Mục đích:** Verify cosine similarity hoạt động đúng. Food A phải score cao hơn Food B.

```
user_id: 101
goal_type: WEIGHT_LOSS
remaining_nutrition:
  calories:  500   # đã ăn gần đủ
  protein:   30
  carbs:     45
  fat:       12
  fiber:     10

total_logs: 5       → tier cold-start → alpha=0.95, beta=0.0
allergy: []         → không block food nào
repeat_counts: {}   → không penalty

Expected ranking (tính tay):
  food_id=14 (Rau muống xào, cal=55, protein=3, fiber=3.5)
    → cosine(remaining=[500,30,45,12,10], food=[55,3,8,2,3.5]) ≈ 0.94 (rất gần hướng)
    → goal_multiplier WEIGHT_LOSS: bonus fiber → ~1.15
    → meal_affinity DINNER ≈ 0.55
    → content_score ≈ 0.59  ← cao nhất nhóm fiber

  food_id=17 (Gỏi gà, cal=120, protein=15, fiber=2.5)
    → cosine ≈ 0.88 → content_score ≈ 0.52

  food_id=3 (Cơm tấm, cal=420, protein=28, carbs=48)
    → calories quá cao so với remaining=500 nhưng vector hướng khác
    → WEIGHT_LOSS penalty (-0.3 * calories_norm) → goal_multiplier ≈ 0.75
    → content_score thấp hơn nhiều

Verify: result[0].id IN [14, 17], result không có food_id=3 trong top 3
```

---

#### USER-SC02 — "Allergy hard block"

> **Mục đích:** Verify hard filter loại đúng food có allergen.

```
user_id: 102
goal_type: MAINTENANCE
remaining_nutrition:
  calories:  800
  protein:   40
  carbs:     100
  fat:       25
  fiber:     12

total_logs: 80      → tier heavy → CF-dominant nếu có neighbor
allergy: ["Shellfish", "Fish"]

Foods bị block phải là:
  food_id=8  (Tôm nướng - Shellfish)     ✗
  food_id=11 (Gỏi cuốn tôm - Shellfish) ✗
  food_id=13 (Canh chua cá - Fish)       ✗
  food_id=32 (Bún mắm - Fish+Shellfish)  ✗
  food_id=36 (Bánh mì chả cá - Fish)    ✗
  food_id=55 (Chả cá Lã Vọng - Fish)    ✗
  food_id=62 (All allergens)             ✗

Verify: Không có bất kỳ food nào trong danh sách trên xuất hiện trong result.
```

---

#### USER-SC03 — "Repeat penalty max"

> **Mục đích:** Verify repeat penalty làm giảm score đúng.

```
user_id: 103
goal_type: MAINTENANCE
remaining_nutrition:
  calories:  600
  protein:   35
  carbs:     75
  fat:       18
  fiber:     8

total_logs: 90      → heavy tier
allergy: []
repeat_counts:
  food_id=1:  3    # đúng bằng repeat_penalty_threshold=3 → penalty=1.0
  food_id=2:  2    # penalty = 2/3 = 0.667
  food_id=21: 1    # penalty = 1/3 = 0.333
  food_id=4:  0    # không penalty

Với alpha=0.40, beta=0.50, gamma=0.10 (heavy tier, has_cf=True):
  food_id=1: final_score = max(0, 0.40*content + 0.50*cf - 0.10*1.0)
           → bị trừ 0.10 → tụt hạng so với food không bị repeat

Verify:
  food_id=1 phải có score thấp hơn food_id=4 dù nutrition tương tự
  result.items[*].id không có food_id=1 ở top 3
```

---

#### USER-SC04 — "Popular fallback trigger"

> **Mục đích:** Verify khi mọi final_score = 0 thì strategy = popular-fallback.

```
user_id: 104
goal_type: MAINTENANCE
remaining_nutrition:
  calories: 0    # đã ăn đủ hoặc vượt → remaining = 0
  protein:  0
  carbs:    0
  fat:      0
  fiber:    0

total_logs: 0   → cold-start
allergy: []

Khi remaining = zeros:
  cosine_similarity(zeros, food_vector) = 0  (left_norm=0 → return 0.0)
  content_score = 0.0 với mọi food
  collaborative_score = 0.0 (cold-start, no CF)
  → final_score = 0 với mọi food
  → _resolve_strategy returns "popular-fallback"

Verify:
  response.data.recommendation_strategy == "popular-fallback"
  items được sort theo popularity_count DESC
  popular foods (food có nhiều MealItem nhất) xuất hiện đầu
```

---

#### USER-SC05 — "Affinity threshold fallback"

> **Mục đích:** Verify khi hard filter còn < 5 món thì threshold giảm /2.

```
user_id: 105
goal_type: MAINTENANCE
remaining_nutrition: (bình thường)
meal_type request: SNACK
meal_affinity_threshold: 0.50  # ngưỡng cao

total_logs: 10
allergy: []

Với threshold=0.50, chỉ food có affinity SNACK ≥ 0.50 được giữ:
  food_id=41 (Chè đậu - affinity SNACK≈0.83)      ✓
  food_id=42 (Chè trôi nước - ≈0.78)              ✓
  food_id=43 (Sinh tố bơ - ≈0.73)                 ✓
  food_id=46 (Trà sữa - ≈0.87)                    ✓
  food_id=47 (Bánh tráng trộn - ≈0.83)            ✓
  → Vừa đủ 5, không trigger fallback

Để test fallback: set threshold=0.70 → chỉ còn 3 food
  → trigger fallback: threshold /2 = 0.35
  → filter lại với 0.35 → ra nhiều hơn 5

Verify:
  Khi threshold=0.70: result vẫn có ≥5 items (do fallback hoạt động)
  Log hoặc debug mode: lần gọi filter thứ 2 xảy ra
```

---

#### USER-SC06 — "New item injection"

> **Mục đích:** Verify new item được chèn vào đúng vị trí index=2.

```
user_id: 106
goal_type: WEIGHT_LOSS
remaining_nutrition:
  calories: 400
  protein:  25
  carbs:    50
  fat:      12
  fiber:    10

total_logs: 15   → moderate tier
allergy: []
repeat_counts: {}

food_id=51 (Bún đậu mắm tôm): createdAt = now - 2 days → is_new = True
  content_score = cosine([400,25,50,12,10], [310,16,38,10,2.5])
               ≈ 0.998 * goal_multiplier * affinity ≈ 0.20+  (≥0.15 ✓)

Expected: food_id=51 xuất hiện tại result.items[2] (0-indexed)
Verify: result.items[2].id == 51
```

---

#### USER-SC07 — "Diversity rerank — category cap"

> **Mục đích:** Verify không quá 2 món cùng category trong top 10.

```
user_id: 107
goal_type: MAINTENANCE
remaining_nutrition: (bình thường)
total_logs: 20
allergy: []

Seed lịch sử để user này có preference mạnh cho category "Bánh & Xôi":
  High CF score cho: food_id=25 (Bánh cuốn), 26 (Xôi gà), 34 (Xôi xéo),
                     45 (Bánh bèo), 63 (Bánh tráng nướng), 64 (Bánh ướt), 65 (Bánh khọt)

  7 món cùng category "Bánh & Xôi" đều có score cao
  → Diversity cap: chỉ 2 món được vào top-10 direct
  → 5 món còn lại vào overflow, điền vào cuối nếu còn slot

Verify:
  items[0..9] chứa tối đa 2 món có category "Bánh & Xôi" trong top 10
  (trừ khi tổng số item < limit × 2/category)
```

---

#### USER-SC08 — "Hybrid strategy with CF"

> **Mục đích:** Verify CF score ảnh hưởng đúng khi có neighbors.

```
user_id: 108  (thuộc Cluster B — Phở, Bún, Mì lovers)
goal_type: MAINTENANCE
remaining_nutrition:
  calories: 700
  protein:  35
  carbs:    90
  fat:      22
  fiber:    15

total_logs: 85   → heavy tier
  → alpha=0.40, beta=0.50, gamma=0.10 khi has_cf=True

Cluster B có 11 user khác với lịch sử ăn Phở/Bún nhiều:
  → CF neighbors tìm được ≥1 user chia sẻ food history
  → collaborative_score > 0 với food_id 1,2,21,22,23,30 (nhóm noodle)

Expected:
  strategy = "hybrid"
  items đầu tiên là Phở/Bún có cả content_score và collaborative_score
  tags chứa "Community Match"

Verify:
  response.data.recommendation_strategy == "hybrid"
  result.items[0].recommendation_context.tags contains "Community Match"
```

---

#### USER-SC09 — "Guest mode"

> **Mục đích:** Verify user_id=null không crash, trả về gợi ý dựa trên content.

```
user_id: null (không truyền)
meal_type: LUNCH

UserContextRecord được tạo với:
  user_id = None
  remaining_nutrition = zeros (không có goal)
  allergy_warnings = []
  repeat_counts = {}
  total_logs = 0

→ cosine với zeros → content_score = 0
→ strategy = "popular-fallback"

Verify:
  HTTP 200 (không phải 404)
  response.data.user.id == null
  strategy == "popular-fallback"
  items được sort theo popularity
```

---

#### USER-SC10 — "STRICT_DIET weight shift"

> **Mục đích:** Verify STRICT_DIET tăng alpha, giảm beta.

```
user_id: 110
goal_type: STRICT_DIET
remaining_nutrition:
  calories: 300  # rất ít còn lại
  protein:  20
  carbs:    35
  fat:       8
  fiber:    10

total_logs: 75   → heavy tier, has_cf=True
  Normal heavy:       alpha=0.40, beta=0.50, gamma=0.10
  STRICT_DIET shift:  alpha=0.50, beta=0.40, gamma=0.10

Cluster E neighbors có CF score → nhưng bị giảm ảnh hưởng
→ Content score (nutrition fit) chiếm ưu thế hơn bình thường

Verify:
  Bằng cách compare với USER-SC08 (heavy, MAINTENANCE):
  SC10 → food fit nutrition gap (low cal) score cao hơn
  SC08 → food được CF recommend score cao hơn
```

---

## 4. Nutrition goals — Reference values

```python
GOAL_CONFIG = {
    #           calories  protein  carbs   fat   fiber
    "WEIGHT_LOSS":  (1600,   120,    160,    50,   25),
    "WEIGHT_GAIN":  (2800,   160,    350,    90,   20),
    "MAINTENANCE":  (2000,   100,    250,    65,   25),
    "STRICT_DIET":  (1500,   130,    140,    45,   30),
}

# Thêm noise ±5% để không giống nhau hoàn toàn giữa các user
# Riêng special users (SC01–SC10) giữ giá trị cố định, KHÔNG thêm noise
```

---

## 5. MealItem history seed — phân bổ theo cluster

```python
# Mỗi user trong cluster seed lịch sử với 70% preferred foods
# Để tạo signal rõ cho CF

CLUSTER_SEED_PLAN = {
    "A": {  # WEIGHT_LOSS — Gỏi, Cháo, Canh
        "preferred_food_ids": [11, 12, 14, 16, 17, 18, 28, 48],
        "meal_distribution":  {"BREAKFAST": 0.20, "LUNCH": 0.45, "DINNER": 0.35},
    },
    "B": {  # MAINTENANCE — Phở, Bún, Mì
        "preferred_food_ids": [1, 2, 21, 22, 23, 30, 38],
        "meal_distribution":  {"BREAKFAST": 0.40, "LUNCH": 0.45, "DINNER": 0.15},
    },
    "C": {  # WEIGHT_GAIN — Cơm, Nướng
        "preferred_food_ids": [3, 4, 5, 31, 33, 38],
        "meal_distribution":  {"BREAKFAST": 0.10, "LUNCH": 0.45, "DINNER": 0.45},
    },
    "D": {  # MAINTENANCE — Snack, Bánh
        "preferred_food_ids": [25, 26, 27, 41, 42, 45, 47],
        "meal_distribution":  {"BREAKFAST": 0.35, "LUNCH": 0.10, "DINNER": 0.05, "SNACK": 0.50},
    },
    "E": {  # STRICT_DIET — Canh, Gỏi
        "preferred_food_ids": [13, 14, 16, 17, 18, 48],
        "meal_distribution":  {"BREAKFAST": 0.20, "LUNCH": 0.50, "DINNER": 0.30},
    },
}
```

---

## 6. Popularity seed — tạo Pareto distribution

Để test `popular-fallback` sort đúng, seed popularity theo phân bổ Pareto (20% foods = 80% lượt ăn):

```python
# Top 24 popular foods (20% of 120) → được ăn nhiều
TOP_POPULAR_FOOD_IDS = [1, 2, 3, 21, 22, 23, 24, 26, 27, 31, 34, 38,
                         4, 5, 11, 12, 17, 25, 29, 30, 37, 41, 43, 47]
# Mỗi food này được seed thêm 200–500 MealItem random từ nhiều users

# Còn lại 96 foods → 5–30 MealItem mỗi món (long tail)
```

---

## 7. Script structure và thứ tự insert

```
seed/
├── 01_nutrients_allergens.sql    # Nutrients (8) + Allergens (12) — master data
├── 02_categories.sql             # 15 food categories
├── 03_foods_fixed.py             # 65 foods với nutrition cố định (groups A–G)
├── 04_foods_random.py            # 55 foods random fill để đủ 120
├── 05_ingredients.py             # 80 ingredients + ingredient_allergens
├── 06_users_special.py           # USER-SC01 đến SC10 (special test cases)
├── 07_users_cluster.py           # 50 users còn lại (3 tiers × 5 clusters)
├── 08_goals.py                   # NutritionGoal — special users dùng fixed values
├── 09_meal_history_global.py     # Seed MealItem để tạo meal affinity signal
├── 10_meal_history_cluster.py    # Seed cluster history cho CF signal
├── 11_popularity_boost.py        # Boost MealItem cho top 24 popular foods
└── run_all.py                    # Orchestrator với dependency check
```

**Thứ tự insert bắt buộc:**

```
nutrients, allergens
  → food_categories
    → foods
      → food_nutrition_profiles → food_nutrition_values
      → ingredients → ingredient_allergens → food_ingredients
users
  → user_profiles → nutrition_goals → user_allergies
  → daily_logs → meals → meal_items
```

---

## 8. Mapping test cases → user IDs

| Test case (từ Test Plan)    | User ID | Mô tả                                       |
| --------------------------- | ------- | ------------------------------------------- |
| Content score đúng thứ hạng | SC01    | Tính tay cosine, verify order               |
| Allergy hard block          | SC02    | Shellfish + Fish allergy                    |
| Repeat penalty              | SC03    | food_id=1 bị penalty=1.0                    |
| Popular fallback            | SC04    | remaining=0, strategy=popular-fallback      |
| Threshold fallback (<5 món) | SC05    | meal_type=SNACK, threshold=0.70             |
| New item injection index=2  | SC06    | food_id=51 xuất hiện ở position 2           |
| Diversity cap 2/category    | SC07    | 7 món Bánh & Xôi, chỉ 2 vào top             |
| Hybrid strategy             | SC08    | Cluster B heavy user, CF active             |
| Guest mode                  | SC09    | user_id=null → 200, popular-fallback        |
| STRICT_DIET weight shift    | SC10    | alpha+0.10, beta-0.10                       |
| User not found              | —       | user_id=9999 → 404, EC=1001                 |
| meal_type case-insensitive  | SC01    | Gửi "lunch" → normalize "LUNCH"             |
| exclude_food_ids            | SC01    | exclude=[1,2] → không có food_id 1,2        |
| targetFiber missing         | —       | Seed goal không có targetFiber → fallback 0 |
| Cache hit/miss/expire       | SC08    | Call 2 lần, verify DB query count           |
| healthcheck DB up           | —       | /health → status=ok                         |

---

## 9. SQL verification queries

```sql
-- Kiểm tra meal affinity phân bổ đúng
SELECT
  mi."foodId",
  m."mealType",
  COUNT(*) AS cnt,
  COUNT(*) * 1.0 / SUM(COUNT(*)) OVER (PARTITION BY mi."foodId") AS ratio
FROM meal_items mi
JOIN meals m ON m.id = mi."mealId"
WHERE mi."foodId" IN (1, 6, 41, 46)
GROUP BY mi."foodId", m."mealType"
ORDER BY mi."foodId", m."mealType";
-- Expected: food_id=6 có BREAKFAST ratio ≈ 0.78+

-- Kiểm tra special users có đúng remaining (consumed phải = target - remaining)
SELECT
  u.id,
  ng."targetCalories",
  COALESCE(SUM(mi.calories), 0) AS consumed_calories,
  ng."targetCalories" - COALESCE(SUM(mi.calories), 0) AS remaining_calories
FROM users u
LEFT JOIN nutrition_goals ng ON ng."userId" = u.id AND DATE(ng."endDate") >= CURRENT_DATE
LEFT JOIN daily_logs dl ON dl."userId" = u.id AND dl."logDate" = CURRENT_DATE
LEFT JOIN meals m ON m."dailyLogId" = dl.id
LEFT JOIN meal_items mi ON mi."mealId" = m.id
WHERE u.id IN (101, 102, 103, 104)
GROUP BY u.id, ng."targetCalories";

-- Kiểm tra allergy blocking (SC02)
SELECT f.id, f."foodName", ARRAY_AGG(a.name) AS allergens
FROM foods f
JOIN food_ingredients fi ON fi."foodId" = f.id
JOIN ingredient_allergens ia ON ia."ingredientId" = fi."ingredientId"
JOIN allergens a ON a.id = ia."allergenId"
WHERE a.name IN ('Shellfish', 'Fish')
GROUP BY f.id, f."foodName";
-- Danh sách này KHÔNG ĐƯỢC xuất hiện trong result của user SC02

-- Kiểm tra top popular foods
SELECT mi."foodId", COUNT(*) AS total_orders
FROM meal_items mi
GROUP BY mi."foodId"
ORDER BY total_orders DESC
LIMIT 10;
-- Expected: food_id trong TOP_POPULAR_FOOD_IDS xuất hiện đầu
```

---

## 10. Known gaps & giả định

| Gap                                      | Ghi chú                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `burned_calories` từ WorkoutLog          | Hiện service đang hardcode `burned_calories = 0.0`, seed WorkoutLog không ảnh hưởng test |
| Feedback persistence                     | `accept_feedback` chỉ trả `trace_id`, không persist → chỉ test contract                  |
| Redis / production cache                 | CacheService hiện là in-memory TTL, reset khi restart service                            |
| ALS / pgvector                           | Ngoài phạm vi test hiện tại                                                              |
| `STRICT_DIET` không có trong Prisma enum | Kiểm tra DB enum trước khi seed `goalType=STRICT_DIET`                                   |

---

_v2 — Cập nhật: Thêm danh sách món Việt Nam đa dạng, nutrition cố định có chủ đích, special user profiles SC01–SC10 với expected output có thể tính tay, meal affinity seed có kiểm soát._
