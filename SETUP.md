# Hướng dẫn Thiết lập Dự án KTPM_251_Group15

## 📋 Yêu cầu

- Node.js (v18 trở lên)
- PostgreSQL
- npm hoặc yarn

## 🚀 Các bước thiết lập

### 1. Cài đặt Dependencies

```bash
npm install
```

### 2. Tạo file `.env`

Tạo file `.env` ở thư mục gốc với nội dung:

```env
# --- Database ---
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/ktpm_db"

# --- JWT (Task 1) ---
JWT_SECRET="DAY_LA_KHOA_BI_MAT_CUC_KY_AN_TOAN_CHO_KTPM"
JWT_EXPIRES_IN="1d"
```

**Lưu ý:** Thay đổi `DATABASE_URL` theo thông tin PostgreSQL của bạn.

### 3. Tạo Database

Đảm bảo PostgreSQL đang chạy và tạo database:

```sql
CREATE DATABASE ktpm_db;
```

### 4. Chạy Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate --schema=libs/database/prisma/schema.prisma

# Tạo migration và apply vào database
npx prisma migrate dev --name init --schema=libs/database/prisma/schema.prisma
```

### 5. Chạy Services

#### Auth Service (Task 1) - Port 3001

```bash
npm run start:dev auth-service
```

Hoặc:

```bash
nest start auth-service --watch
```

**Swagger UI:** http://localhost:3001/api-docs

**API Base URL:** http://localhost:3001/api/v1

#### Content Service (Task 4) - Port 3002

```bash
npm run start:dev content-service
```

Hoặc:

```bash
nest start content-service --watch
```

**API Base URL:** http://localhost:3002/api/v2

## 📁 Cấu trúc Dự án

```
KTPM_251_Group15/
├── apps/
│   ├── auth-service/     # Task 1: Auth & User Service
│   │   ├── src/
│   │   │   ├── auth/     # Login, Register, JWT
│   │   │   ├── user/     # CRUD Profile
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   └── content-service/  # Task 4: Content Service
│       ├── src/
│       │   ├── app.module.ts
│       │   └── main.ts
├── libs/
│   └── database/
│       ├── prisma/
│       │   └── schema.prisma
│       └── src/
│           ├── database.module.ts
│           └── prisma.service.ts
└── .env
```

## 🧪 Test API

### Đăng ký (Register)

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "fullName": "Nguyễn Văn A"
  }'
```

### Đăng nhập (Login)

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response sẽ trả về `access_token` để sử dụng cho các API được bảo vệ.

## 📝 Lưu ý

- File `.env` đã được thêm vào `.gitignore`, không commit lên git
- Prisma schema nằm tại `libs/database/prisma/schema.prisma`
- Sau khi thay đổi Prisma schema, cần chạy lại `prisma generate` và `prisma migrate`

