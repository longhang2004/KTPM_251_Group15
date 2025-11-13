# KTPM_251_Group15 - Learning Management System

Backend monorepo project for a learning management system, built with NestJS, TypeScript, PostgreSQL, and Prisma.

## 📋 Table of Contents

- [Overview](#overview)
- [Technologies](#technologies)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Database](#database)

## 🎯 Overview

The project consists of 2 microservices:

- **auth-service** (Task 1): Authentication and user management service
  - Register/Login with JWT
  - User profile management
  - RBAC (Role-Based Access Control)
  - Audit logging

- **content-service** (Task 4): Learning content management service
  - Content management (Lessons, Quizzes, Assignments)
  - Content versioning
  - Tagging system

## 🛠 Technologies

- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.7
- **Database**: PostgreSQL
- **ORM**: Prisma 6.x
- **Authentication**: JWT (JSON Web Tokens)
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer
- **Testing**: Jest

## 📁 Project Structure

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

## 🚀 Installation

### Requirements

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm or yarn

### Step 1: Clone and install dependencies

```bash
git clone <repository-url>
cd KTPM_251_Group15
npm install
```

### Step 2: Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your database information:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/ktpm_db"
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="1d"
```

### Step 3: Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and run migrations
npm run prisma:migrate

# Seed database with roles, permissions, and admin user
npm run prisma:seed
```

Or run all at once:

```bash
npm run db:setup
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key for JWT signing | - |
| `JWT_EXPIRES_IN` | JWT token expiration time | `1d` |
| `AUTH_SERVICE_PORT` | Port for auth-service | `3001` |
| `CONTENT_SERVICE_PORT` | Port for content-service | `3002` |
| `ADMIN_EMAIL` | Email for default admin user | `admin@ktpm.edu.vn` |
| `ADMIN_PASSWORD` | Password for default admin user | `admin123` |

## 🏃 Running the Project

### Development Mode

#### Run Auth Service

```bash
npm run start:auth
```

Service will run at: http://localhost:3001

#### Run Content Service

```bash
npm run start:content
```

Service will run at: http://localhost:3002

#### Run both services (requires separate terminals)

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

After running auth-service, access:

http://localhost:3001/api-docs

### API Endpoints

#### Authentication

- `POST /api/v1/auth/register` - Register new account
- `POST /api/v1/auth/login` - Login

#### User Profile

- `GET /api/v1/user/profile` - Get profile information (requires JWT)
- `PUT /api/v1/user/profile` - Update profile (requires JWT)

### API Usage Examples

#### Register

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "fullName": "John Doe"
  }'
```

#### Login

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

#### Get Profile (with JWT)

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

# Create new migration
npm run prisma:migrate

# Deploy migrations (production)
npm run prisma:migrate:deploy

# Open Prisma Studio (GUI to view DB)
npm run prisma:studio

# Seed database
npm run prisma:seed
```

### Database Schema

View detailed schema at: `libs/database/prisma/schema.prisma`

#### Main Models:

- **User**: System users
- **Role**: Roles (ADMIN, INSTRUCTOR, STUDENT)
- **Permission**: Permissions
- **Content**: Learning content
- **AuditLog**: Audit trail
- **RefreshToken**: Refresh token

## 🔐 Authentication & Authorization

### JWT Authentication

All protected endpoints require JWT token in header:

```
Authorization: Bearer <token>
```

### Role-Based Access Control (RBAC)

Use `@Roles()` decorator and `RolesGuard`:

```typescript
@Roles(RoleName.ADMIN, RoleName.INSTRUCTOR)
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('protected')
async protectedRoute() {
  // ...
}
```

### Audit Logging

All important actions are logged to `AuditLog`:

```typescript
await auditLogService.log(
  userId,
  'UPDATE_CONTENT',
  'CONTENT_ID_123',
  { changes: '...' }
);
```

## 📝 Useful Scripts

| Script | Description |
|--------|-------------|
| `npm run start:auth` | Run auth-service (watch mode) |
| `npm run start:content` | Run content-service (watch mode) |
| `npm run db:setup` | Setup database (generate + migrate + seed) |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run lint` | Run ESLint and auto-fix |
| `npm run format` | Format code with Prettier |

## 🤝 Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

UNLICENSED

## 👥 Group 15 - KTPM 251

---

**Note**: Ensure PostgreSQL is running before starting services. See `SETUP.md` for more details.
