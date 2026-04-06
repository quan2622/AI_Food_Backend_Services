# API — Gợi ý món & báo cáo người dùng

Các endpoint này phục vụ **ứng dụng người dùng**; admin có thể dùng cho màn **giám sát** hoặc **test tích hợp**, không phải CRUD dữ liệu master.

**Prefix:** `/api/v1`

---

## 1. Recommend (`/recommend`)

### 1.1 Health

```
GET /recommend/health
```

Kiểm tra dịch vụ gợi ý phía sau (nội bộ gọi HTTP tới recommend service).

---

### 1.2 Lấy gợi ý (theo user trong JWT)

```
GET /recommend/recommendations
```

Query params theo `GetRecommendationsQueryDto`; `user_id` được service gắn từ token.

---

### 1.3 Query gợi ý (POST)

```
POST /recommend/recommendations/query
```

Body theo `QueryRecommendationsBodyDto`; `user_id` bổ sung từ token.

---

### 1.4 Feedback

```
POST /recommend/feedback
```

Body `FeedbackBodyDto` — dùng cải thiện mô hình gợi ý.

---

## 2. User reports (`/user-reports`)

Controller dùng `JwtAuthGuard` — mỗi user chỉ xem báo cáo của chính mình.

### 2.1 Xu hướng dinh dưỡng

```
POST /user-reports/nutrition-trend
```

Body có `option` (xem `NutritionTrendDto`).

---

### 2.2 Xu hướng metric

```
POST /user-reports/metric-trend
```

Body: `type`, `metric` (xem `NutritionMetricTrendDto`).

---

*Cập nhật: tháng 4/2026*
