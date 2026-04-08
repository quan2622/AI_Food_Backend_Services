# Tài liệu API — Admin & thiết kế frontend

Bộ tài liệu mô tả các HTTP API của backend NestJS dùng cho **trang quản trị** (dashboard, CRUD, tra cứu). Mỗi file tập trung một nhóm nghiệp vụ.

---

## Chuẩn URL

| Thành phần | Giá trị |
|------------|---------|
| Global prefix | `api` |
| Phiên bản (URI) | `v1` hoặc `v2` (cùng route; mặc định trong code: `1`, `2`) |
| Ví dụ base | `{origin}/api/v1` |

**Ví dụ đầy đủ:** `GET https://localhost:8080/api/v1/users/admin`

Trong các file con, đường dẫn chỉ ghi **path sau phiên bản** (ví dụ `/users/admin`). Khi gọi thực tế, ghép: `/api/v{version}` + path.

---

## Định dạng response (envelope)

Hầu hết response JSON có dạng:

```json
{
  "metadata": {
    "statusCode": 200,
    "message": "Success",
    "EC": 0,
    "timestamp": "2026-04-06T12:00:00.000Z",
    "path": "/api/v1/..."
  },
  "data": { }
}
```

Một số endpoint admin trả về object có sẵn `EC`, `EM`, `meta`, `result` (pagination); interceptor vẫn bọc thêm `metadata` / `data` tùy luồng.

---

## Xác thực

| Cơ chế | Mô tả |
|--------|--------|
| JWT | Header `Authorization: Bearer <access_token>` (global guard trừ route `@Public()`) |
| Refresh | Cookie `refresh_token` (httpOnly) khi login; dùng cho `POST /auth/refresh-token` |
| Admin | `AdminGuard`: payload JWT phải có `isAdmin: true` |

**Public (không cần JWT):** `POST /auth/register`, `POST /auth/login`.

Chi tiết: [admin-auth-and-system-api.md](./admin-auth-and-system-api.md).

---

## Danh sách tài liệu theo module

| File | Nội dung |
|------|----------|
| [admin-auth-and-system-api.md](./admin-auth-and-system-api.md) | Đăng nhập, refresh, logout, health server |
| [admin-user-management-api.md](./admin-user-management-api.md) | Users, user-profiles, user-allergies (kèm endpoint admin phân trang) |
| [admin-allcode-management-api.md](./admin-allcode-management-api.md) | AllCode — quản lý mã tham chiếu (CRUD, bulk, phân trang admin) |
| [admin-dashboard-api.md](./admin-dashboard-api.md) | Dashboard admin — KPI, hoạt động, dinh dưỡng nền tảng, top món, user & nội dung |
| [admin-food-management-api.md](./admin-food-management-api.md) | Foods, food-categories, food-images |
| [admin-ingredients-management-api.md](./admin-ingredients-management-api.md) | Allergens, ingredient-allergens, dish ingredients, dinh dưỡng nguyên liệu |
| [admin-nutrition-management-api.md](./admin-nutrition-management-api.md) | Nutrition components (nutrients), nutrition-goals |
| [admin-logs-tracking-api.md](./admin-logs-tracking-api.md) | Daily logs, workout logs, meals |
| [admin-meal-items-api.md](./admin-meal-items-api.md) | Meal items (món trong bữa) |
| [admin-recommend-and-user-reports-api.md](./admin-recommend-and-user-reports-api.md) | Gợi ý món, báo cáo xu hướng (user) |

---

## Module trong code nhưng chưa có route REST

Các controller sau **chưa định nghĩa handler** (chỉ class rỗng), không có API để ghi trong tài liệu admin:

- `ReportController` (`/report`)
- `AiModelController` (`/ai-model`)
- `AiTrainingJobController` (`/ai-training-job`)

Khi backend bổ sung endpoint, nên cập nhật lại file trong `api_doc/`.

---

## Gợi ý map màn hình admin

| Màn hình | API chính |
|----------|-----------|
| Đăng nhập | `auth` |
| Danh sách user | `GET /users/admin` |
| Danh sách profile | `GET /user-profiles/admin` |
| Dị ứng (toàn hệ thống) | `GET /user-allergies/admin` (kèm `severityInfo` từ AllCode) |
| Thực phẩm & danh mục | `GET /foods/admin`, `GET /food-categories/admin` |
| Nguyên liệu / allergen | `GET /ingredients/admin`, `GET /allergens/admin`, `GET /ingredient-allergens/admin`, `foods/:id/ingredients` |
| Dinh dưỡng & mục tiêu | `nutrition-components`, `GET /nutrition-goals/admin` (goalType/status đã map AllCode), `nutrition-goals/all` |
| Nhật ký & bữa ăn | `GET /daily-logs/admin` (`statusInfo`), `GET /meals/admin` (`mealTypeInfo`), `meal-items/...` |
| Ảnh bữa ăn | `GET /food-images/admin` (`mealTypeInfo`) |
| Cấu hình hệ thống | `GET /allcodes/admin` |
| Dashboard tổng quan | `GET /admin/dashboard/overview` hoặc từng nhóm `/admin/dashboard/kpi`, … |

### Pattern phân trang admin (aqp)

**Query bắt buộc thường dùng:** `current` (số trang, thường bắt đầu từ `1`), `pageSize` (số bản ghi/trang).

**Lọc & sort:** theo [api-query-params](https://github.com/koajs/aqp) — tham số lọc đưa vào `filter`, sort theo quy ước aqp (giống `GET /users/admin`).

**Mặc định khi không truyền `sort`:** đa số endpoint `GET .../admin` sắp xếp theo `updatedAt` giảm dần; riêng `GET /food-images/admin` dùng `uploadedAt` giảm dần.

**Ví dụ:** `GET /api/v1/foods/admin?current=1&pageSize=20&filter[foodName][$regex]=phở`

**Payload trong `data` (sau envelope)** thường có dạng:

```json
{
  "EC": 0,
  "EM": "...",
  "meta": {
    "current": 1,
    "pageSize": 10,
    "pages": 5,
    "total": 48
  },
  "result": [ ]
}
```

Chi tiết từng module: xem các mục **`[Admin] ... /admin`** trong tài liệu tương ứng (bảng dưới).

### Bảng endpoint `GET .../admin` (phân trang)

| Endpoint | AllCode / ý nghĩa thêm |
|----------|------------------------|
| `/users/admin` | — |
| `/user-profiles/admin` | `genderData`, `activityLevelData` |
| `/user-allergies/admin` | `severityInfo` trên từng allergy (nhóm theo user) |
| `/nutrition-goals/admin` | `goalTypeInfo`, `statusInfo` |
| `/daily-logs/admin` | `statusInfo` (trạng thái ngày) |
| `/meals/admin` | `mealTypeInfo` (+ tổng macro như API meal) |
| `/foods/admin` | `foodCategory` + `foodIngredients[]` (kèm `ingredient`) |
| `/food-categories/admin` | `parent`, `children[]`, `foodCount` |
| `/ingredients/admin` | — |
| `/allergens/admin` | — |
| `/ingredient-allergens/admin` | — |
| `/food-images/admin` | `mealTypeInfo` theo `meal.mealType` |
| `/allcodes/admin` | — (bản thân là bảng mã) |

---

*Cập nhật: tháng 4/2026 — đồng bộ với `src/modules/*.controller.ts`.*
