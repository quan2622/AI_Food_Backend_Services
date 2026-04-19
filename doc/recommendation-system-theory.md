# HỆ THỐNG GỢI Ý MÓN ĂN — CƠ SỞ LÝ THUYẾT VÀ THUẬT TOÁN

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Kiến trúc tổng thể](#2-kiến-trúc-tổng-thể)
3. [Mô hình Hybrid Recommender](#3-mô-hình-hybrid-recommender)
4. [Content-Based Filtering](#4-content-based-filtering)
5. [Collaborative Filtering](#5-collaborative-filtering)
6. [Popular Recommender](#6-popular-recommender)
7. [User Profile Recommender](#7-user-profile-recommender)
8. [Fallback Recommender](#8-fallback-recommender)
9. [Hệ thống trọng số động (Dynamic Weights)](#9-hệ-thống-trọng-số-động-dynamic-weights)
10. [Cơ chế lọc (Hard Filters)](#10-cơ-chế-lọc-hard-filters)
11. [Maximal Marginal Relevance (MMR)](#11-maximal-marginal-relevance-mmr)
12. [Repeat Penalty](#12-repeat-penalty)
13. [Meal Affinity](#13-meal-affinity)
14. [Nutrition Priority](#14-nutrition-priority)
15. [Goal Multiplier](#15-goal-multiplier)
16. [Feature Engineering](#16-feature-engineering)
17. [Caching Strategy](#17-caching-strategy)
18. [Pipeline xử lý hoàn chỉnh](#18-pipeline-xử-lý-hoàn-chỉnh)
19. [Nutrition Notification (Gemini AI)](#19-nutrition-notification-gemini-ai)
20. [AI Food Classification Service](#20-ai-food-classification-service)

---

## 1. Tổng quan hệ thống

Hệ thống gợi ý món ăn (Food Recommendation System) là một **Hybrid Recommender System** kết hợp nhiều phương pháp gợi ý khác nhau để đưa ra danh sách món ăn phù hợp nhất cho người dùng dựa trên:

- **Nhu cầu dinh dưỡng còn lại trong ngày** (calories, protein, carbs, fat, fiber)
- **Mục tiêu dinh dưỡng** (giảm cân, tăng cân, duy trì, ăn kiêng nghiêm ngặt)
- **Lịch sử ăn uống** (tránh lặp món, hiểu sở thích)
- **Dị ứng thực phẩm** (lọc bỏ món chứa dị ứng nguyên)
- **Thời điểm bữa ăn** (sáng, trưa, tối, snack)
- **Hành vi cộng đồng** (người dùng tương tự chọn gì)

---

## 2. Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client (Frontend)                            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTP Request
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Backend Service (NestJS)                          │
│  ┌────────────┐  ┌────────────────┐  ┌─────────────────────────┐    │
│  │ Auth/Guard │  │  Daily Log     │  │ Nutrition Notification   │    │
│  │ Module     │  │  Module        │  │ Module (Gemini AI)       │    │
│  └────────────┘  └────────────────┘  └─────────────────────────┘    │
│  ┌────────────┐  ┌────────────────┐  ┌─────────────────────────┐    │
│  │ Food       │  │  Nutrition     │  │ User Submission          │    │
│  │ Module     │  │  Goal Module   │  │ Module                   │    │
│  └────────────┘  └────────────────┘  └─────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTP Proxy
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
┌──────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐
│  Recommendation  │ │  AI Food        │ │  PostgreSQL / Redis     │
│  Service         │ │  Classification │ │  / Elasticsearch        │
│  (FastAPI)       │ │  Service        │ │                         │
│                  │ │  (FastAPI)      │ │                         │
│  Hybrid          │ │  EfficientNet   │ │                         │
│  Recommender     │ │  B3 / ResNet50  │ │                         │
└──────────────────┘ └─────────────────┘ └─────────────────────────┘
```

### Các service chính

| Service | Công nghệ | Chức năng |
|---------|-----------|-----------|
| **Backend Service** | NestJS + Prisma | API gateway, authentication, CRUD, daily log tracking |
| **Recommendation Service** | FastAPI + SQLAlchemy | Hybrid recommender engine |
| **AI Classification Service** | FastAPI + PyTorch | Nhận diện món ăn từ ảnh |
| **Nutrition Notification** | NestJS + Gemini AI | Thông báo gợi ý dinh dưỡng thông minh |

---

## 3. Mô hình Hybrid Recommender

### 3.1. Lý thuyết

Hybrid Recommender System kết hợp nhiều phương pháp gợi ý để khắc phục nhược điểm của từng phương pháp đơn lẻ:

- **Content-Based Filtering** → giải quyết cold-start cho item mới
- **Collaborative Filtering** → khám phá món mới dựa trên cộng đồng
- **Popularity-Based** → fallback khi thiếu dữ liệu
- **User Profile** → cá nhân hóa dựa trên lịch sử

### 3.2. Công thức tính điểm Hybrid

Điểm cuối cùng của mỗi món ăn được tính theo công thức **weighted linear combination**:

$$S_{final} = \alpha \cdot S_{content} + \beta \cdot S_{collaborative} + \delta \cdot S_{popular} + \epsilon \cdot S_{profile} - \gamma \cdot P_{repeat}$$

Trong đó:
- $S_{content}$ — Điểm Content-Based (tương đồng dinh dưỡng)
- $S_{collaborative}$ — Điểm Collaborative Filtering (hành vi cộng đồng)
- $S_{popular}$ — Điểm Popularity (độ phổ biến)
- $S_{profile}$ — Điểm User Profile (sở thích danh mục)
- $P_{repeat}$ — Hình phạt lặp món
- $\alpha, \beta, \gamma, \delta, \epsilon$ — Trọng số động

Giá trị cuối cùng được clamp trong khoảng $[0, 1]$:

$$S_{final} = \max(0, \min(S_{hybrid}, 1))$$

### 3.3. Ràng buộc trọng số

Các trọng số dương ($\alpha, \beta, \delta, \epsilon$) luôn được **normalize** để tổng bằng 1:

$$\alpha + \beta + \delta + \epsilon = 1$$

Trọng số phạt $\gamma$ được trừ riêng (không nằm trong tổng normalize).

---

## 4. Content-Based Filtering

### 4.1. Lý thuyết

Content-Based Filtering gợi ý món ăn dựa trên **sự tương đồng giữa nội dung** (thuộc tính dinh dưỡng) của món ăn với nhu cầu còn lại của người dùng.

### 4.2. Vector dinh dưỡng

Mỗi món ăn và nhu cầu dinh dưỡng của user được biểu diễn dưới dạng **vector 5 chiều**:

$$\vec{V} = [\text{calories}, \text{protein}, \text{carbs}, \text{fat}, \text{fiber}]$$

- **Remaining Nutrition Vector**: Lượng dinh dưỡng user còn cần nạp trong ngày
  $$\vec{R} = \vec{T}_{target} - \vec{C}_{consumed}$$
  
- **Food Nutrition Vector**: Lượng dinh dưỡng của món ăn (trên 100g)
  $$\vec{F} = [cal_f, pro_f, carb_f, fat_f, fiber_f]$$

### 4.3. Cosine Similarity

Độ tương đồng giữa nhu cầu còn lại và dinh dưỡng món ăn được tính bằng **Cosine Similarity**:

$$\text{cosine}(\vec{R}, \vec{F}) = \frac{\vec{R} \cdot \vec{F}}{||\vec{R}|| \times ||\vec{F}||}$$

Giá trị nằm trong $[0, 1]$ (đã clamp, không cho phép giá trị âm).

### 4.4. Công thức Content Score

$$S_{content} = \text{base\_score} \times M_{goal} \times A_{meal} + B_{priority}$$

Trong đó:
- $\text{base\_score}$ = Cosine Similarity (hoặc 0.3 nếu user đã ăn đủ)
- $M_{goal}$ = Goal Multiplier (xem mục 15)
- $A_{meal}$ = Meal Affinity (xem mục 13)
- $B_{priority}$ = Nutrition Priority Boost (xem mục 14)

---

## 5. Collaborative Filtering

### 5.1. Lý thuyết

Collaborative Filtering (CF) gợi ý món ăn dựa trên **hành vi của những người dùng tương tự**. Hệ thống sử dụng phương pháp **User-Based Collaborative Filtering** với implicit feedback (lịch sử chọn món).

### 5.2. Thuật toán

#### Bước 1: Xây dựng lịch sử user

Truy vấn tần suất chọn món của user hiện tại từ `meal_items`:

$$H_u = \{(food\_id, frequency)\}$$

Giới hạn: `history_limit = 200` món gần nhất.

#### Bước 2: Tìm Neighbors

Tìm các user khác có **lịch sử ăn uống tương tự** dựa trên số món chung:

$$\text{similarity}(u, v) = \sum_{i \in I_{uv}} \log(1 + freq_u(i))$$

Trong đó:
- $I_{uv}$ = tập món ăn chung giữa user $u$ và neighbor $v$
- $freq_u(i)$ = tần suất user $u$ chọn món $i$

Điều kiện lọc neighbors:
- Số món chung tối thiểu: `min_shared_items ≥ 1`
- Giới hạn neighbors: `neighbor_limit = 20`
- Sắp xếp theo `similarity DESC, shared_items DESC`

#### Bước 3: Tính Collaborative Score

Với mỗi món ăn ứng viên, tính điểm dựa trên hành vi của neighbors:

$$S_{cf}(i) = \sum_{v \in N(u)} \log(1 + quantity_v(i)) \times \text{similarity}(u, v)$$

Trong đó:
- $N(u)$ = tập neighbors của user $u$
- $quantity_v(i)$ = số lượng món $i$ mà neighbor $v$ đã chọn

#### Bước 4: Normalize

Điểm CF được normalize về $[0, 1]$ bằng **Min-Max Normalization**:

$$S_{cf\_norm}(i) = \frac{S_{cf}(i) - \min(S_{cf})}{\max(S_{cf}) - \min(S_{cf})}$$

---

## 6. Popular Recommender

### 6.1. Lý thuyết

Gợi ý dựa trên **độ phổ biến** — món được nhiều người chọn nhất.

### 6.2. Công thức

$$S_{popular} = \min\left(\frac{\text{popularity\_count}}{20}, 1.0\right)$$

- `popularity_count` = tổng số lần món ăn xuất hiện trong `meal_items` của tất cả users
- Normalize: 0-20 lần → 0-1 điểm
- Vai trò: Giải quyết **cold-start problem** khi user mới chưa có lịch sử

---

## 7. User Profile Recommender

### 7.1. Lý thuyết

Gợi ý dựa trên **sở thích danh mục** (category preferences) của user, được xây dựng từ lịch sử ăn uống.

### 7.2. Xây dựng User Profile

```
User Profile = {category_name → frequency}
```

Ví dụ: `{"món bún": 12, "cơm": 8, "phở": 5}`

### 7.3. Công thức

$$S_{profile} = \min\left(\frac{\text{category\_frequency}}{5}, 1.0\right)$$

- `category_frequency` = số lần user đã chọn món trong cùng danh mục
- Normalize: 0-5 lần → 0-1 điểm
- Vai trò: **Cá nhân hóa** theo thói quen ăn uống lâu dài

---

## 8. Fallback Recommender

### 8.1. Mục đích

Đảm bảo hệ thống luôn trả về kết quả, kể cả khi tất cả recommender khác thất bại.

### 8.2. Công thức

$$S_{fallback} = \begin{cases} 0.1 & \text{nếu } calories > 0 \\ 0.0 & \text{nếu } calories = 0 \end{cases}$$

### 8.3. Khi nào sử dụng

Khi `all(final_score ≤ 0)` cho mọi ứng viên → chuyển sang strategy `"popular-fallback"`:
- Sắp xếp theo `popularity_count` giảm dần
- Trả về top-N món phổ biến nhất

---

## 9. Hệ thống trọng số động (Dynamic Weights)

### 9.1. Lý thuyết

Trọng số giữa các recommender **thay đổi tự động** dựa trên:
1. **User maturity** (số lượng meal logs)
2. **Sự có mặt của CF signal** (có neighbors hay không)
3. **Nutrition priority** (ưu tiên dinh dưỡng cụ thể)
4. **Goal type** (mục tiêu dinh dưỡng)

### 9.2. Bảng trọng số theo User Maturity

#### Khi KHÔNG có Collaborative Filtering signal:

| User Maturity | $\alpha$ (Content) | $\beta$ (CF) | $\gamma$ (Repeat) |
|:-------------:|:-------------------:|:-------------:|:------------------:|
| < 10 logs | 0.90 | 0.00 | 0.05 |
| 10-60 logs | 0.85 | 0.00 | 0.10 |
| > 60 logs | 0.80 | 0.00 | 0.15 |

#### Khi CÓ Collaborative Filtering signal:

| User Maturity | $\alpha$ (Content) | $\beta$ (CF) | $\gamma$ (Repeat) |
|:-------------:|:-------------------:|:-------------:|:------------------:|
| < 10 logs | 0.85 | 0.05 | 0.05 |
| 10-60 logs | 0.65 | 0.20 | 0.10 |
| > 60 logs | 0.50 | 0.35 | 0.10 |

#### Trọng số cố định ban đầu:
- $\delta$ (Popular) = 0.06
- $\epsilon$ (Profile) = 0.07

### 9.3. Điều chỉnh theo Nutrition Priority

Khi user chọn ưu tiên dinh dưỡng cụ thể (HIGH_PROTEIN, HIGH_FIBER, HIGH_CARBS, HIGH_FAT):

- $\alpha$ tăng thêm 0.25–0.30 (tối đa 0.90)
- $\beta$ giảm tương ứng (tối thiểu 0.03)
- $\delta, \epsilon$ giảm nhẹ

### 9.4. Điều chỉnh theo Goal Type

Khi `goal_type = "STRICT_DIET"`:
- $\alpha$ tăng thêm 0.10 (tối đa 0.95)
- $\beta$ giảm 0.10 (tối thiểu 0.00)
- $\delta, \epsilon$ giảm (tối thiểu 0.03)

### 9.5. Normalization

Sau tất cả điều chỉnh, các trọng số dương được normalize:

$$\alpha' = \frac{\alpha}{\alpha + \beta + \delta + \epsilon}, \quad \beta' = \frac{\beta}{\alpha + \beta + \delta + \epsilon}, \quad ...$$

---

## 10. Cơ chế lọc (Hard Filters)

### 10.1. Mục đích

Loại bỏ các món ăn **không phù hợp tuyệt đối** trước khi scoring.

### 10.2. Các bộ lọc

| Bộ lọc | Điều kiện loại bỏ | Mục đích |
|--------|-------------------|----------|
| **Allergy Filter** | Món chứa allergen mà user dị ứng | An toàn sức khỏe |
| **Meal Affinity Filter** | `meal_affinity < threshold` (mặc định 0.15) | Phù hợp bữa ăn |
| **Nutrition Filter** | `calories ≤ 0` | Loại món thiếu dữ liệu |
| **Exclude Filter** | `food_id ∈ exclude_food_ids` | User chỉ định loại bỏ |

### 10.3. Fallback lọc mềm

Nếu sau hard filter còn **< 5 món**, hệ thống giảm `meal_affinity_threshold` xuống 50% và lọc lại:

```
threshold_retry = meal_affinity_threshold / 2
```

Nếu vẫn rỗng → sử dụng toàn bộ catalog (bỏ qua filter).

---

## 11. Maximal Marginal Relevance (MMR)

### 11.1. Lý thuyết

MMR là thuật toán **re-ranking** nhằm cân bằng giữa **relevance** (điểm cao) và **diversity** (đa dạng):

$$MMR(d_i) = \lambda \cdot \text{Rel}(d_i) - (1 - \lambda) \cdot \max_{d_j \in S} \text{Sim}(d_i, d_j)$$

Trong đó:
- $\lambda = 0.7$ — trade-off (ưu tiên relevance 70%, diversity 30%)
- $\text{Rel}(d_i)$ = `final_score` của món $d_i$
- $S$ = tập các món đã được chọn
- $\text{Sim}(d_i, d_j)$ = Cosine Similarity giữa vector dinh dưỡng 2 món

### 11.2. Thuật toán greedy

```
1. Sắp xếp top 50 ứng viên theo final_score DESC
2. Chọn món đầu tiên (điểm cao nhất)
3. Lặp: Với mỗi ứng viên còn lại:
   a. Tính MMR score = λ × relevance − (1−λ) × max_similarity_to_selected
   b. Chọn món có MMR score cao nhất
   c. Thêm vào danh sách kết quả
4. Lặp cho đến khi đủ limit
```

### 11.3. Mục đích

- Tránh gợi ý nhiều món có dinh dưỡng quá giống nhau
- Đảm bảo đa dạng về danh mục, loại món
- Trải nghiệm phong phú hơn cho người dùng

---

## 12. Repeat Penalty

### 12.1. Lý thuyết

Phạt các món mà user **đã ăn gần đây** để khuyến khích đa dạng hóa.

### 12.2. Công thức — Exponential Decay

$$P_{repeat} = 1 - 0.85^{count}$$

| Số lần ăn trong 7 ngày | Penalty |
|:-----------------------:|:-------:|
| 0 | 0.000 |
| 1 | 0.150 |
| 2 | 0.278 |
| 3 | 0.386 |
| 4 | 0.478 |
| 5 | 0.556 |

### 12.3. Đặc điểm

- **Exponential**: Phạt tăng dần nhưng **giảm tốc** ở giá trị cao
- **Window**: Chỉ đếm trong **7 ngày gần nhất** (`repeat_penalty_window_days = 7`)
- **Clamp**: Giá trị trong $[0, 1]$

---

## 13. Meal Affinity

### 13.1. Lý thuyết

Mỗi món ăn có **mức độ phù hợp** khác nhau với từng bữa ăn (sáng, trưa, tối, snack).

### 13.2. Tính toán Meal Affinity

Dựa trên thống kê thực tế từ toàn bộ lịch sử `meal_items`:

$$A_{meal}(food, type) = \frac{\text{count}(food, type) + 1}{\text{total\_count}(food) + |MEAL\_TYPES|}$$

Sử dụng **Laplace Smoothing** (cộng 1) để:
- Tránh affinity = 0 cho món chưa bao giờ xuất hiện ở bữa đó
- Mặc định phân bố đều: $\frac{1}{4} = 0.25$ cho món chưa có dữ liệu

### 13.3. Ví dụ

| Món ăn | Sáng | Trưa | Tối | Snack |
|--------|------|------|-----|-------|
| Phở | 0.60 | 0.20 | 0.15 | 0.05 |
| Cơm tấm | 0.10 | 0.50 | 0.35 | 0.05 |
| Bánh mì | 0.55 | 0.15 | 0.10 | 0.20 |

---

## 14. Nutrition Priority

### 14.1. Mục đích

Cho phép user **ưu tiên một loại dinh dưỡng cụ thể** khi nhận gợi ý.

### 14.2. Các priority hỗ trợ

| Priority | Mô tả |
|----------|-------|
| `BALANCED` | Cân bằng (mặc định) |
| `HIGH_PROTEIN` | Ưu tiên protein cao |
| `HIGH_CARBS` | Ưu tiên carbs cao |
| `HIGH_FAT` | Ưu tiên chất béo cao |
| `HIGH_FIBER` | Ưu tiên chất xơ cao |

### 14.3. Công thức Boost

$$B_{priority} = (\text{multiplier} - 1) \times 0.4$$

Multiplier được tính dựa trên hàm lượng dinh dưỡng normalized:

$$\text{multiplier}_{HIGH\_PROTEIN} = 1 + 0.5 \times \min\left(\frac{protein}{50}, 1\right)$$

$$\text{multiplier}_{HIGH\_FIBER} = 1 + 0.5 \times \min\left(\frac{fiber}{14}, 1\right)$$

Boost là **additive** (cộng thêm vào content score, không nhân) → kết quả mượt hơn.

---

## 15. Goal Multiplier

### 15.1. Mục đích

Điều chỉnh content score theo **mục tiêu dinh dưỡng** của user.

### 15.2. Bảng điều chỉnh

| Goal Type | Công thức điều chỉnh |
|-----------|---------------------|
| **WEIGHT_LOSS** | $-0.3 \times cal_{norm} + 0.1 \times pro_{norm} + 0.2 \times fiber_{norm} - 0.05 \times fat_{norm}$ |
| **WEIGHT_GAIN** | $+0.1 \times cal_{norm} + 0.4 \times pro_{norm}$ |
| **MAINTENANCE** | $0$ (không điều chỉnh) |
| **STRICT_DIET** | $-0.5 \times cal_{norm} + 0.15 \times pro_{norm} + 0.25 \times fiber_{norm} - 0.10 \times fat_{norm}$ |

Normalized values:
- $cal_{norm} = \min(calories / 700, 1)$
- $pro_{norm} = \min(protein / 50, 1)$
- $fat_{norm} = \min(fat / 35, 1)$
- $fiber_{norm} = \min(fiber / 14, 1)$

### 15.3. Clamp

$$M_{goal} = \max(0.25, 1 + \text{adjustment})$$

Giá trị tối thiểu 0.25 để không bao giờ loại bỏ hoàn toàn một món.

---

## 16. Feature Engineering

### 16.1. User Features

```python
User Context = {
    user_id, user_name, goal_type,
    target_nutrition,     # Mục tiêu dinh dưỡng (NutritionGoal)
    consumed_today,       # Đã ăn hôm nay (từ DailyLog → Meals → MealItems)
    remaining_nutrition,  # = target - consumed
    allergy_warnings,     # Danh sách allergen (UserAllergy → Allergen)
    repeat_counts,        # Tần suất ăn trong 7 ngày (food_id → count)
    total_logs,           # Tổng số meal items (đo user maturity)
    category_scores,      # Sở thích category (category_name → frequency)
}
```

### 16.2. Food Features

```python
Food Candidate = {
    food_id, food_name, description, image_url,
    category,            # CategoryRecord (id, name)
    nutrition,           # NutritionVector (calories, protein, carbs, fat, fiber)
    allergens,           # Set[str] — tên allergen
    meal_affinity,       # Dict[meal_type → float] — mức phù hợp từng bữa
    popularity_count,    # Tổng số lần được chọn bởi mọi user
}
```

### 16.3. Food Tokens (cho text-based matching)

```python
tokens = {category_name, description_words[:20], allergen_names}
```

### 16.4. Context Features

Tự động xác định bữa ăn theo thời gian:

| Giờ | Bữa ăn |
|-----|--------|
| 05:00 – 10:59 | Breakfast |
| 11:00 – 14:59 | Lunch |
| 15:00 – 20:59 | Dinner |
| 21:00 – 04:59 | Snack |

---

## 17. Caching Strategy

### 17.1. In-Memory Cache (TTL-based)

- **Collaborative scores** được cache theo `cf:{user_id}:{sorted_candidate_ids}`
- TTL: `recommendation_cache_ttl_seconds = 120` (2 phút)
- Mục đích: Tránh query SQL nặng cho CF mỗi request

### 17.2. Cấu trúc cache

```python
CacheEntry = {
    value: dict[food_id, float],   # CF scores
    expires_at: float,              # Unix timestamp
}
```

### 17.3. Cache invalidation

- Tự động hết hạn sau TTL
- Không cần invalidation thủ công (dữ liệu thay đổi chậm)

---

## 18. Pipeline xử lý hoàn chỉnh

```
Request (user_id, meal_type, limit, nutrition_priority)
    │
    ▼
┌─────────────────────────────┐
│  1. Load User Context       │  ← PostgreSQL: user, goal, consumed, allergies,
│     (Repository Layer)      │     repeat_counts, total_logs, category_scores
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  2. Load Food Candidates    │  ← PostgreSQL: foods + nutrition + allergens
│     (Random 200 items)      │     + categories (ORDER BY RANDOM())
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  3. Hard Filters            │  ← Loại bỏ: allergen match, meal_affinity thấp,
│                             │     calories = 0, excluded IDs
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  4. Load CF Scores          │  ← Cache hoặc SQL: neighbor-based CF
│     (with caching)          │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  5. Hybrid Scoring          │  ← Tính score cho từng ứng viên:
│     (per candidate)         │     content + CF + popular + profile − repeat
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  6. Strategy Resolution     │  ← "hybrid" / "content-based" / "popular-fallback"
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  7. MMR Re-ranking          │  ← Top 50 → MMR (λ=0.7) → Top N
│     + New Item Injection    │     + Chèn món mới vào vị trí #3
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│  8. Build Response          │  ← RecommendedItem: nutrition, health_analysis,
│                             │     reason, tags, suggested_portion
└─────────────┬───────────────┘
              │
              ▼
Response (items, strategy, user_context, metadata)
```

### Strategy Resolution

| Điều kiện | Strategy |
|-----------|----------|
| Tất cả `final_score ≤ 0` | `popular-fallback` |
| Có ít nhất 1 item với `collaborative_score > 0` | `hybrid` |
| Còn lại | `content-based-filtering` |

### New Item Injection

Sau MMR, hệ thống **chèn 1 món mới** (tạo trong 7 ngày gần đây) vào **vị trí thứ 3** nếu:
- Món có `content_score ≥ 0.15`
- Món chưa nằm trong top 3 hiện tại

---

## 19. Nutrition Notification (Gemini AI)

### 19.1. Mục đích

Sinh thông báo gợi ý dinh dưỡng **realtime** cho user dựa trên trạng thái ăn uống hiện tại, **không lưu vào database**.

### 19.2. Kiến trúc 2 lớp

```
Layer 1: Template tĩnh (luôn có sẵn, đảm bảo consistency)
Layer 2: Gemini AI (sinh thông báo thông minh, cá nhân hóa)
```

- Nếu Gemini API khả dụng → sử dụng AI response
- Nếu Gemini lỗi hoặc rate limit → fallback về template tĩnh

### 19.3. Template System

20 templates tổ hợp từ:

**Thời điểm (4)**: morning | midday | afternoon | evening

**Trạng thái (5)**: no_meals | low | moderate | on_track | over

| Trạng thái | Điều kiện calories |
|-----------|-------------------|
| `no_meals` | Tổng calories = 0 |
| `low` | < 50% mục tiêu |
| `moderate` | 50% – 84% |
| `on_track` | 85% – 110% |
| `over` | > 110% |

### 19.4. Gemini AI Prompt

Prompt được thiết kế để sinh JSON cố định:

```json
{"mainMessage": "...", "subMessage": "..."}
```

- `mainMessage` (≤ 60 ký tự): Trạng thái dinh dưỡng hiện tại
- `subMessage` (≤ 100 ký tự): Gợi ý cụ thể, ngắn gọn

Input context bao gồm: thời điểm, trạng thái, goal type, calories/protein/carbs/fat/fiber hiện tại vs mục tiêu, danh sách thiếu hụt, các bữa đã ăn.

### 19.5. Caching

In-memory cache 30 phút theo `userId:dateKey:timeOfDay`:
- Tối đa **4 lần gọi Gemini/user/ngày** (1 per timeOfDay)
- Giảm thiểu rate limit (free tier: 15 req/phút)

---

## 20. AI Food Classification Service

### 20.1. Mục đích

Nhận diện món ăn Việt Nam từ **ảnh chụp** bằng mô hình Deep Learning.

### 20.2. Mô hình hỗ trợ

| Model | Kiến trúc | Đặc điểm |
|-------|-----------|----------|
| **EfficientNet-B3** | Compound Scaling (depth × width × resolution) | Hiệu suất cao, tham số ít. Freeze 6 layers đầu, fine-tune phần còn lại |
| **ResNet-50** | Residual Connections (skip connections) | Ổn định, dễ train. Freeze layer1-2, fine-tune layer3-4 + fc |
| **Inception V3** | Multi-scale feature extraction | Capture đa kích thước. Freeze all, chỉ train fc + AuxLogits |

### 20.3. Custom Classifier Head

```
EfficientNet-B3:
  Dropout(0.4) → Linear(1536, 512) → ReLU → Dropout(0.3) → Linear(512, num_classes)

ResNet-50:
  Dropout(0.4) → Linear(2048, num_classes)

Inception V3:
  Linear(2048, num_classes)  [+ AuxLogits: Linear(768, num_classes)]
```

### 20.4. Transfer Learning Strategy

- Sử dụng **pretrained weights** (ImageNet) được lưu local tại `pretrained/`
- **Partial freezing**: Giữ nguyên feature extraction layers đầu, chỉ fine-tune layers cuối + classifier
- Lý do: Các layer đầu đã học features tổng quát (edges, textures), chỉ cần điều chỉnh layers cuối cho domain cụ thể (món ăn Việt Nam)

---

## Tài liệu tham khảo

1. **Cosine Similarity** — Salton, G. (1989). *Automatic Text Processing*
2. **Collaborative Filtering** — Koren, Y., Bell, R., & Volinsky, C. (2009). *Matrix Factorization Techniques for Recommender Systems*
3. **MMR** — Carbonell, J., & Goldstein, J. (1998). *The Use of MMR, Diversity-Based Reranking for Reordering Documents and Producing Summaries*
4. **Hybrid Recommender Systems** — Burke, R. (2002). *Hybrid Recommender Systems: Survey and Experiments*
5. **EfficientNet** — Tan, M., & Le, Q. (2019). *EfficientNet: Rethinking Model Scaling for Convolutional Neural Networks*
6. **ResNet** — He, K., et al. (2016). *Deep Residual Learning for Image Recognition*
7. **Inception** — Szegedy, C., et al. (2016). *Rethinking the Inception Architecture for Computer Vision*
8. **Transfer Learning** — Yosinski, J., et al. (2014). *How Transferable Are Features in Deep Neural Networks?*
