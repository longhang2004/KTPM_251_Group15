# KTPM_251_Group15 - Hệ thống Quản lý Học tập

Dự án backend monorepo cho hệ thống quản lý học tập, được xây dựng với NestJS, TypeScript, PostgreSQL và Prisma.

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Chạy dự án](#chạy-dự-án)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Database](#database)

## 🎯 Tổng quan

Dự án bao gồm 2 microservices:

- **auth-service** (Task 1): Dịch vụ xác thực và quản lý người dùng
  - Đăng ký/Đăng nhập với JWT
  - Quản lý profile người dùng
  - Phân quyền RBAC (Role-Based Access Control)
  - Audit logging

- **content-service** (Task 4): Dịch vụ quản lý nội dung học tập
  - Quản lý nội dung (Lessons, Quizzes, Assignments)
  - Versioning nội dung
  - Tagging system

## 🛠 Công nghệ sử dụng

- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.7
- **Database**: PostgreSQL
- **ORM**: Prisma 6.x
- **Authentication**: JWT (JSON Web Tokens)
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer
- **Testing**: Jest

## 📁 Cấu trúc dự án

```
KTPM_251_Group15/
├── apps/
│   ├── auth-service/          # Task 1: Auth & User Service
│   │   ├── src/
│   │   │   ├── auth/          # Authentication module
│   │   │   ├── user/          # User management module
│   │   │   ├── common/        # Shared utilities (decorators, guards, filters)
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── test/
│   │
│   └── content-service/       # Task 4: Content Service
│       ├── src/
│       │   ├── app.module.ts
│       │   └── main.ts
│       └── test/
│
├── libs/
│   └── database/              # Shared database library
│       ├── prisma/
│       │   ├── schema.prisma  # Prisma schema
│       │   └── seed.ts        # Database seed script
│       └── src/
│           ├── database.module.ts
│           ├── prisma.service.ts
│           └── audit-log.service.ts
│
├── .env.example               # Environment variables template
├── package.json
├── nest-cli.json
└── tsconfig.json
```

## 🚀 Cài đặt

### Yêu cầu

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm hoặc yarn

### Bước 1: Clone và cài đặt dependencies

```bash
git clone <repository-url>
cd KTPM_251_Group15
npm install
```

### Bước 2: Cấu hình môi trường

Sao chép file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Chỉnh sửa `.env` với thông tin database của bạn:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ktpm_db"
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="1d"
```

### Bước 3: Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Tạo và chạy migrations
npm run prisma:migrate

# Seed database với roles, permissions và admin user
npm run prisma:seed
```

Hoặc chạy tất cả cùng lúc:

```bash
npm run db:setup
```

## ⚙️ Cấu hình

### Environment Variables

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key cho JWT signing | - |
| `JWT_EXPIRES_IN` | Thời gian hết hạn của JWT token | `1d` |
| `AUTH_SERVICE_PORT` | Port cho auth-service | `3001` |
| `CONTENT_SERVICE_PORT` | Port cho content-service | `3002` |
| `ADMIN_EMAIL` | Email cho admin user mặc định | `admin@ktpm.edu.vn` |
| `ADMIN_PASSWORD` | Password cho admin user mặc định | `admin123` |

## 🏃 Chạy dự án

### Development Mode

#### Chạy Auth Service

```bash
npm run start:auth
```

Service sẽ chạy tại: http://localhost:3001

#### Chạy Content Service

```bash
npm run start:content
```

Service sẽ chạy tại: http://localhost:3002

#### Chạy cả hai services (cần terminal riêng)

```bash
# Terminal 1
npm run start:auth

# Terminal 2
npm run start:content
```

### Production Mode

```bash
# Build
npm run build

# Start
npm run start:prod
```

## 📚 API Documentation

### Auth Service Swagger UI

Sau khi chạy auth-service, truy cập:

http://localhost:3001/api-docs

### API Endpoints

#### Authentication

- `POST /api/v1/auth/register` - Đăng ký tài khoản mới
- `POST /api/v1/auth/login` - Đăng nhập

#### User Profile

- `GET /api/v1/user/profile` - Lấy thông tin profile (cần JWT)
- `PUT /api/v1/user/profile` - Cập nhật profile (cần JWT)

### Ví dụ sử dụng API

#### Đăng ký

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "fullName": "Nguyễn Văn A"
  }'
```

#### Đăng nhập

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Lấy profile (với JWT)

```bash
curl -X GET http://localhost:3001/api/v1/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## 🗄️ Database

### Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Tạo migration mới
npm run prisma:migrate

# Deploy migrations (production)
npm run prisma:migrate:deploy

# Mở Prisma Studio (GUI để xem DB)
npm run prisma:studio

# Seed database
npm run prisma:seed
```

### Database Schema

Xem chi tiết schema tại: `libs/database/prisma/schema.prisma`

#### Các Models chính:

- **User**: Người dùng hệ thống
- **Role**: Vai trò (ADMIN, INSTRUCTOR, STUDENT)
- **Permission**: Quyền hạn
- **Content**: Nội dung học tập
- **AuditLog**: Nhật ký kiểm toán
- **RefreshToken**: Token làm mới

## 🔐 Authentication & Authorization

### JWT Authentication

Tất cả các endpoint được bảo vệ yêu cầu JWT token trong header:

```
Authorization: Bearer <token>
```

### Role-Based Access Control (RBAC)

Sử dụng decorator `@Roles()` và `RolesGuard`:

```typescript
@Roles(RoleName.ADMIN, RoleName.INSTRUCTOR)
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('protected')
async protectedRoute() {
  // ...
}
```

### Audit Logging

Mọi hành động quan trọng được ghi vào `AuditLog`:

```typescript
await auditLogService.log(
  userId,
  'UPDATE_CONTENT',
  'CONTENT_ID_123',
  { changes: '...' }
);
```

## 📝 Scripts hữu ích

| Script | Mô tả |
|--------|-------|
| `npm run start:auth` | Chạy auth-service (watch mode) |
| `npm run start:content` | Chạy content-service (watch mode) |
| `npm run db:setup` | Setup database (generate + migrate + seed) |
| `npm run prisma:studio` | Mở Prisma Studio GUI |
| `npm run lint` | Chạy ESLint và tự động fix |
| `npm run format` | Format code với Prettier |

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

UNLICENSED

## 👥 Nhóm 15 - KTPM 251

---

**Lưu ý**: Đảm bảo PostgreSQL đang chạy trước khi start services. Xem thêm `SETUP.md` để biết chi tiết.
