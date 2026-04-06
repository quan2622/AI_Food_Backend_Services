# API — Xác thực & hệ thống

Dùng cho màn đăng nhập admin, làm mới token và kiểm tra trạng thái server.

**Prefix thực tế:** `/api/v1` (hoặc `v2`).

---

## 1. Auth

Base path: `/auth`

### 1.1 Đăng ký (public)

```
POST /auth/register
```

**Body:** giống `POST /users` — xem [admin-user-management-api.md](./admin-user-management-api.md) (CreateUserDto).

**Lưu ý:** `@Public()` — không cần JWT.

---

### 1.2 Đăng nhập (public)

```
POST /auth/login
```

**Content-Type:** `application/json`

**Body (JSON):** `email`, `password` (Passport local dùng `usernameField: 'email'`).

**Response:** object chứa access token và refresh token; server set cookie `refresh_token` (httpOnly, 7 ngày).

---

### 1.3 Làm mới token

```
POST /auth/refresh-token
```

**Cách gửi refresh token:** cookie `refresh_token` (ưu tiên) hoặc parse từ header `Cookie`.

**Response:** token mới; cookie được set lại.

---

### 1.4 Đăng xuất

```
POST /auth/logout
```

**Yêu cầu:** JWT hợp lệ.

**Hành vi:** xóa cookie `refresh_token`; xóa token trong DB (theo `AuthService`).

---

## 2. Trạng thái server

```
GET /server-status
```

**Yêu cầu:** JWT (không `@Public()` trên `AppController`).

**Mô tả:** thông tin process (port, env) và trạng thái kết nối PostgreSQL.

---

## 3. Mã lỗi thường gặp

| HTTP | Ý nghĩa |
|------|---------|
| 401 | Thiếu/sai JWT hoặc refresh token |
| 403 | Có JWT nhưng không phải admin (`AdminGuard`) |
| 400 | Validation (body/query) — thường kèm chi tiết field |

---

*Cập nhật: tháng 4/2026*
