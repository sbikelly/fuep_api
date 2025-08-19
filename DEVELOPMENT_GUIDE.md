# Migration Note — Backend moves from NestJS to Express

This project has migrated the backend from NestJS to Express (TypeScript). The OpenAPI contract and sequence diagrams remain authoritative and unchanged; only the framework has changed. Use the steps below to work with the Express backend.

## Express Backend Quickstart (supersedes prior NestJS section)

- Location: apps/api
- Tech: Express, TypeScript, Knex, pg, helmet, cors, cookie-parser, dotenv
- Dev server: pnpm --filter @fuep/api start:dev
- Health: GET http://localhost:4000/health
- JAMB check: POST http://localhost:4000/auth/check-jamb with JSON { "jambRegNo": "TEST123456789" }

## Shared Types Package Quickstart

- Location: packages/types
- Tech: TypeScript, Zod validation schemas
- Build: pnpm build:types
- Dev mode: pnpm --filter @fuep/types dev
- Type checking: pnpm --filter @fuep/types typecheck

### Key Features

- **Comprehensive Type Definitions**: Authentication, candidate, payment, and validation types
- **Zod Validation Schemas**: Runtime validation with Nigerian context patterns
- **Monorepo Integration**: Both API and Web packages import from @fuep/types
- **Custom Validators**: Nigerian phone numbers, JAMB format, states, and academic patterns

### Files

- apps/api/package.json — scripts now target Express
- apps/api/tsconfig.json — TS config for Express
- apps/api/src/main.ts — Express app bootstrap (helmet, cors, cookie-parser), routes
- apps/api/src/db/knex.ts — Knex PG client; configure via env or defaults
- infra/db/001_schema.sql — unchanged (authoritative schema)

### Environment

- .env.development (root): DB_HOST=localhost, DB_PORT=5432, DB_USER=fuep, DB_PASSWORD=fuep, DB_NAME=fuep_portal, PORT=4000, CORS_ORIGIN=http://localhost:5173
- DB_URL is supported as a single Postgres connection URL override (optional)

### Start

```bash
# Ensure Docker services are up (Postgres, Redis, MinIO, MailHog)
docker compose up -d

# Install & run API
pnpm install
pnpm --filter @fuep/api start:dev
```

### Test

```bash
# Health
curl http://localhost:4000/health

# Check JAMB (seed row: TEST123 - note: requires 10-15 characters)
curl -H "Content-Type: application/json" \
     -d '{"jambRegNo":"TEST123456789"}' \
     http://localhost:4000/auth/check-jamb

# Test validation (will fail with "Invalid request data")
curl -H "Content-Type: application/json" \
     -d '{"jambRegNo":"TEST123"}' \
     http://localhost:4000/auth/check-jamb
```

### Using Shared Types

```bash
# Build types package
pnpm build:types

# Import types in your code
import {
  JambVerificationRequestSchema,
  ApiResponse,
  ValidationError
} from '@fuep/types';

# Validate request data
const validationResult = JambVerificationRequestSchema.safeParse(req.body);
if (!validationResult.success) {
  // Handle validation errors
  return res.status(400).json({
    success: false,
    error: 'Invalid request data',
    timestamp: new Date()
  });
}
```

Notes:

- The previous NestJS-specific sections are preserved for reference but superseded by this Express Quickstart for development.
- The OpenAPI 3.0 contract in docs/openapi.yaml and the Mermaid sequence diagrams in docs/sequence-diagrams.md remain the source of truth for endpoints and flows.

# FUEP Post-UTME Portal - Development Guide

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Infrastructure Setup](#2-infrastructure-setup)
3. [Backend API Development](#3-backend-api-development)
4. [Frontend Development](#4-frontend-development)
5. [Testing & Validation](#5-testing--validation)
6. [Next Steps & Features](#6-next-steps--features)
7. [Quality of Life Improvements](#7-quality-of-life-improvements)
8. [Common Issues & Solutions](#8-common-issues--solutions)

## 1. Project Setup

### 1.1 Repository & Workspace Initialization

```bash
# Create project directory
mkdir fuep-postutme
cd fuep-postutme

# Initialize Git repository
git init

# Initialize pnpm workspace
pnpm init -y
```

### 1.2 Root Configuration Files

#### `package.json` (Root)

```json
{
  "name": "fuep-postutme",
  "private": true,
  "version": "1.0.0",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:api": "pnpm --filter @fuep/api start:dev",
    "dev:web": "pnpm --filter @fuep/web dev",
    "dev": "concurrently -n API,WEB -c auto \"pnpm dev:api\" \"pnpm dev:web\"",
    "lint": "eslint .",
    "typecheck": "tsc -b",
    "format": "prettier -w ."
  },
  "devDependencies": {
    "concurrently": "^9.0.0",
    "prettier": "^3.3.3",
    "typescript": "^5.5.4",
    "@types/node": "^22.1.0",
    "eslint": "^9.8.0"
  }
}
```

#### `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

#### `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@fuep/types/*": ["packages/types/*"]
    }
  }
}
```

#### `.gitignore`

```gitignore
node_modules
dist
build
.env
.env.*
apps/**/.env
infra/db/*.log
infra/db/backups
```

### 1.3 Directory Structure

```bash
# Create project structure
mkdir -p apps/api apps/web packages/types infra/db infra/nginx
```

**Resulting Structure:**

```
fuep-postutme/
├── apps/
│   ├── api/          # NestJS Backend
│   └── web/          # React Frontend
├── packages/
│   └── types/        # Shared TypeScript types
├── infra/
│   ├── db/           # Database schemas and migrations
│   └── nginx/        # Nginx configuration
├── docs/             # OpenAPI spec and other docs (openapi.yaml)
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .gitignore
```

## 2. Infrastructure Setup

### 2.1 Docker Compose Configuration

#### `docker-compose.yml`

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16
    container_name: fuep_pg
    environment:
      POSTGRES_USER: fuep
      POSTGRES_PASSWORD: fuep
      POSTGRES_DB: fuep_portal
    ports: ['5432:5432']
    volumes:
      - ./infra/db:/docker-entrypoint-initdb-d:ro
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U fuep -d fuep_portal']
      interval: 5s
      timeout: 3s
      retries: 30

  redis:
    image: redis:7
    container_name: fuep_redis
    ports: ['6379:6379']

  minio:
    image: minio/minio:latest
    container_name: fuep_minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: fuep
      MINIO_ROOT_PASSWORD: fuepstrongpassword
    ports: ['9000:9000', '9001:9001']
    volumes:
      - miniodata:/data

  mailhog:
    image: mailhog/mailhog
    container_name: fuep_mailhog
    ports: ['1025:1025', '8025:8025']

volumes:
  pgdata:
  miniodata:
```

### 2.2 Database Schema

#### `infra/db/001_schema.sql`

```sql

-- ============================================
-- Post-UTME Portal — PostgreSQL Schema
-- ============================================

-- Extensions (UUIDs + cryptographic functions)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- Enums ----------

DO $$ BEGIN
    CREATE TYPE payment_purpose AS ENUM ('post_utme', 'acceptance', 'school_fee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_provider AS ENUM ('remita', 'flutterwave');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('initiated', 'pending', 'success', 'failed', 'reconciled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE decision_status AS ENUM ('pending', 'admitted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE migration_status AS ENUM ('pending', 'success', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE upload_type AS ENUM ('passport', 'ssce', 'alevel', 'transcript', 'utme_result', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE scan_status AS ENUM ('pending', 'clean', 'infected', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- Utility: updated_at trigger ----------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- Reference / Preload ----------

CREATE TABLE IF NOT EXISTS jamb_prelist (
  jamb_reg_no          varchar(20) PRIMARY KEY,
  surname              varchar(100) NOT NULL,
  firstname            varchar(100) NOT NULL,
  othernames           varchar(100),
  gender               varchar(10),
  programme_code       varchar(32),
  department_code      varchar(32),
  faculty              varchar(64),
  state_of_origin      varchar(64),
  lga_of_origin        varchar(64),
  email                varchar(160),
  phone                varchar(32),
  utme_score           integer,
  session              varchar(16) NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);

-- ---------- Core Identity ----------

CREATE TABLE IF NOT EXISTS candidates (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jamb_reg_no          varchar(20) NOT NULL UNIQUE,
  username             varchar(50) NOT NULL UNIQUE,  -- equals jamb_reg_no
  email                varchar(160) NOT NULL,
  phone                varchar(32) NOT NULL,
  password_hash        text,
  temp_password_flag   boolean NOT NULL DEFAULT true,
  is_active            boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER candidates_set_updated_at
BEFORE UPDATE ON candidates
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS profiles (
  candidate_id         uuid PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
  surname              varchar(100),
  firstname            varchar(100),
  othernames           varchar(100),
  gender               varchar(10),
  dob                  date,
  address              text,
  state                varchar(64),
  lga                  varchar(64),
  city                 varchar(64),
  nationality          varchar(64),
  marital_status       varchar(32),
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS next_of_kin (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  name                 varchar(160) NOT NULL,
  relation             varchar(64),
  phone                varchar(32),
  email                varchar(160),
  address              text,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_nok_candidate ON next_of_kin(candidate_id);

CREATE TABLE IF NOT EXISTS sponsors (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  name                 varchar(160) NOT NULL,
  phone                varchar(32),
  email                varchar(160),
  address              text,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sponsors_candidate ON sponsors(candidate_id);

-- ---------- Academic Records & Uploads ----------

CREATE TABLE IF NOT EXISTS education_records (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  level_type           varchar(32) NOT NULL,     -- 'ssce' | 'alevel' | 'undergrad' etc.
  exam_type            varchar(32),              -- 'waec' | 'neco' | 'gce' etc.
  year                 varchar(10),
  school_name          varchar(160),
  certificate_no       varchar(64),
  grade_summary        text,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_edu_candidate ON education_records(candidate_id);

CREATE TABLE IF NOT EXISTS uploads (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  type                 upload_type NOT NULL,
  s3_url               text NOT NULL,
  checksum_sha256      varchar(64),
  size_bytes           bigint,
  mime_type            varchar(128),
  scan_status          scan_status NOT NULL DEFAULT 'pending',
  created_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_uploads_candidate ON uploads(candidate_id);
CREATE INDEX IF NOT EXISTS idx_uploads_type ON uploads(type);

-- ---------- Application & Admission ----------

CREATE TABLE IF NOT EXISTS applications (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
  session              varchar(16) NOT NULL,
  programme_code       varchar(32),
  department_code      varchar(32),
  status               decision_status NOT NULL DEFAULT 'pending',
  submitted_at         timestamptz,
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER applications_set_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS admissions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
  decision             decision_status NOT NULL DEFAULT 'pending',
  decided_at           timestamptz,
  decided_by           uuid,                      -- admin user id (if you add admin_users table)
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER admissions_set_updated_at
BEFORE UPDATE ON admissions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- Payments & Receipts ----------

CREATE TABLE IF NOT EXISTS payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  purpose              payment_purpose NOT NULL,
  provider             payment_provider,
  provider_ref         varchar(128),    -- e.g., Remita RRR or transaction ref
  amount               numeric(14,2) NOT NULL,
  currency             varchar(8) NOT NULL DEFAULT 'NGN',
  status               payment_status NOT NULL DEFAULT 'initiated',
  idempotency_key      varchar(128),    -- (candidate_id + purpose + session)
  raw_payload          jsonb,
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_payments_provider_ref ON payments(provider_ref);
CREATE INDEX IF NOT EXISTS idx_payments_candidate ON payments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_purpose ON payments(purpose);
CREATE TRIGGER payments_set_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS receipts (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id           uuid NOT NULL UNIQUE REFERENCES payments(id) ON DELETE CASCADE,
  serial               varchar(32) NOT NULL,
  qr_token             varchar(64) NOT NULL,
  pdf_url              text NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_receipts_serial ON receipts(serial);
CREATE UNIQUE INDEX IF NOT EXISTS ux_receipts_qr_token ON receipts(qr_token);

-- ---------- Matriculation & Students ----------

CREATE TABLE IF NOT EXISTS matric_counters (
  session              varchar(16) NOT NULL,
  dept_code            varchar(32) NOT NULL,
  last_seq             integer NOT NULL DEFAULT 0,
  PRIMARY KEY (session, dept_code)
);

CREATE TABLE IF NOT EXISTS students (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid NOT NULL UNIQUE REFERENCES candidates(id) ON DELETE CASCADE,
  matric_no            varchar(32) NOT NULL UNIQUE,
  dept_code            varchar(32),
  session              varchar(16),
  created_at           timestamptz NOT NULL DEFAULT NOW()
);

-- ---------- Migration to Main Portal ----------

CREATE TABLE IF NOT EXISTS migrations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id           uuid NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  status               migration_status NOT NULL DEFAULT 'pending',
  attempts             integer NOT NULL DEFAULT 0,
  last_error           text,
  pushed_at            timestamptz,
  created_at           timestamptz NOT NULL DEFAULT NOW(),
  updated_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE TRIGGER migrations_set_updated_at
BEFORE UPDATE ON migrations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- Audit Logs ----------

CREATE TABLE IF NOT EXISTS audit_logs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id             uuid,                   -- candidate or admin id
  actor_role           varchar(32),
  action               varchar(64) NOT NULL,
  entity               varchar(64),
  entity_id            uuid,
  data                 jsonb,
  ip                   inet,
  created_at           timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ---------- Helpful Views (optional) ----------

CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
  c.id AS candidate_id,
  c.jamb_reg_no,
  c.username,
  a.status AS admission_status,
  s.matric_no,
  ap.programme_code,
  ap.department_code
FROM candidates c
LEFT JOIN admissions a ON a.candidate_id = c.id
LEFT JOIN students  s ON s.candidate_id = c.id
LEFT JOIN applications ap ON ap.candidate_id = c.id;

-- ---------- Minimal seed (optional) ----------
-- INSERT INTO matric_counters(session, dept_code, last_seq) VALUES ('2025', 'CSC', 0) ON CONFLICT DO NOTHING;


-- Add more tables as needed for your complete schema
```

### 2.3 Infrastructure Startup

```bash
# Start all services
docker compose up -d

# Wait 10-20 seconds for PostgreSQL to initialize schema
sleep 15

# Verify services are running
docker compose ps
```

### 2.4 MinIO Bucket Setup

1. **Access MinIO Console**: Open `http://localhost:9001`
2. **Login**: Username: `fuep`, Password: `fuepstrongpassword`
3. **Create Bucket**: Name it `uploads` for file storage

## 3. Backend API Development

### 3.1 NestJS Project Setup

```bash
# Create NestJS project
pnpm dlx @nestjs/cli new api

# Move to apps directory
mv api apps/api
cd apps/api

# Install dependencies
pnpm i
```

### 3.2 Package Configuration

#### Update `apps/api/package.json`

```json
{
  "name": "@fuep/api",
  "version": "0.0.1",
  "description": "FUEP Post-UTME Portal API",
  "author": "",
  "private": true,
  "license": "UNLICENSED"
}
```

### 3.3 Dependencies Installation

```bash
# Core NestJS dependencies
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt

# Validation and transformation
pnpm add class-validator class-transformer

# Database and ORM
pnpm add pg knex objection

# AWS SDK for S3/MinIO
pnpm add aws-sdk @aws-sdk/client-s3

# Redis and job queue
pnpm add ioredis bullmq

# Utilities
pnpm add axios uuid zod dotenv cookie-parser helmet @nestjs/serve-static dayjs

# Development dependencies
pnpm add -D @types/bcrypt @types/uuid @types/cookie-parser
```

### 3.4 Environment Configuration

#### `apps/api/.env`

```env
NODE_ENV=development
PORT=4000

# Postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=fuep
DB_PASSWORD=fuep
DB_NAME=fuep_portal

# Redis
REDIS_URL=redis://localhost:6379

# S3 (MinIO)
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=fuep
S3_SECRET_ACCESS_KEY=fuepstrongpassword
S3_BUCKET=uploads
S3_FORCE_PATH_STYLE=true

# JWT
JWT_SECRET=super-secret-change
JWT_EXPIRES=15m
JWT_REFRESH_SECRET=another-secret-change
JWT_REFRESH_EXPIRES=30d

# Mail (Mailhog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

# Payments
REMITA_KEY=changeme
REMITA_SECRET=changeme
REMITA_BASE_URL=https://remita.net/api
```

### 3.5 Main Application Files

#### `apps/api/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(helmet());
  app.use(cookieParser());

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}
bootstrap();
```

#### `apps/api/src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { CandidateModule } from './modules/candidate/candidate.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, CandidateModule, PaymentModule],
})
export class AppModule {}
```

### 3.6 Database Configuration

#### `apps/api/src/db/knex.ts`

```typescript
import knex, { Knex } from 'knex';

export const db: Knex = knex({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    port: +(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  pool: { min: 2, max: 10 },
});
```

### 3.7 Authentication Module

#### `apps/api/src/modules/auth/auth.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES || '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
```

#### `apps/api/src/modules/auth/auth.service.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { db } from '../../db/knex';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) {}

  async checkJamb(jambRegNo: string) {
    const row = await db('jamb_prelist').where({ jamb_reg_no: jambRegNo }).first();
    if (!row) return { exists: false };

    const biodata = {
      jambRegNo: row.jamb_reg_no,
      surname: row.surname,
      firstname: row.firstname,
      othernames: row.othernames,
      programmeCode: row.programme_code,
      departmentCode: row.department_code,
      session: row.session,
    };
    return { exists: true, biodata };
  }

  async login(username: string, password: string) {
    const c = await db('candidates').where({ username }).first();
    if (!c || !c.password_hash) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, c.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const accessToken = await this.jwt.signAsync({ sub: c.id, role: 'candidate' });
    const refreshToken = await this.jwt.signAsync(
      { sub: c.id, role: 'candidate', type: 'refresh' },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d',
      }
    );

    return { accessToken, refreshToken, tempPasswordFlag: c.temp_password_flag };
  }

  async changePassword(candidateId: string, oldPassword: string, newPassword: string) {
    const c = await db('candidates').where({ id: candidateId }).first();
    if (!c || !c.password_hash) throw new UnauthorizedException();

    const ok = await bcrypt.compare(oldPassword, c.password_hash);
    if (!ok) throw new UnauthorizedException('Old password mismatch');

    const hash = await bcrypt.hash(newPassword, 12);
    await db('candidates').where({ id: candidateId }).update({
      password_hash: hash,
      temp_password_flag: false,
    });
    return;
  }
}
```

#### `apps/api/src/modules/auth/auth.controller.ts`

```typescript
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private svc: AuthService) {}

  @Post('check-jamb')
  checkJamb(@Body('jambRegNo') jambRegNo: string) {
    return this.svc.checkJamb(jambRegNo?.trim());
  }

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.svc.login(body.username?.trim(), body.password);
  }

  @Post('change-password')
  async change(@Req() req: any, @Body() body: { oldPassword: string; newPassword: string }) {
    // In production: guard + get candidateId from JWT
    const candidateId = req.user?.sub || '00000000-0000-0000-0000-000000000000';
    await this.svc.changePassword(candidateId, body.oldPassword, body.newPassword);
    return {};
  }
}
```

### 3.8 Payment Module

#### `apps/api/src/modules/payment/payment.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
```

#### `apps/api/src/modules/payment/payment.service.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { db } from '../../db/knex';
import { v4 as uuid } from 'uuid';

@Injectable()
export class PaymentService {
  async initPayment(
    purpose: 'post_utme' | 'acceptance' | 'school_fee',
    jambRegNo: string,
    amount: number,
    session: string,
    email?: string,
    phone?: string
  ) {
    if (!jambRegNo) throw new BadRequestException('jambRegNo required');

    // Ensure candidate exists (partial)
    let candidate = await db('candidates').where({ jamb_reg_no: jambRegNo }).first();
    if (!candidate) {
      const username = jambRegNo;
      [candidate] = await db('candidates')
        .insert({ jamb_reg_no: jambRegNo, username, email, phone, temp_password_flag: true })
        .returning('*');
    }

    // Create payment (status=initiated)
    const idempotency = `${candidate.id}-${purpose}-${session}`;
    const [payment] = await db('payments')
      .insert({
        candidate_id: candidate.id,
        purpose,
        amount,
        currency: 'NGN',
        status: 'initiated',
        idempotency_key: idempotency,
      })
      .returning('*');

    // Call Remita init here (stub)
    const providerRef = uuid(); // replace with Remita RRR response
    await db('payments').where({ id: payment.id }).update({
      provider: 'remita',
      provider_ref: providerRef,
      status: 'pending',
    });

    return {
      paymentId: payment.id,
      provider: 'remita',
      providerRef,
      redirectUrl: `https://payments.example/redirect/${providerRef}`,
      status: 'pending',
    };
  }
}
```

#### `apps/api/src/modules/payment/payment.controller.ts`

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private svc: PaymentService) {}

  @Post('init')
  init(
    @Body()
    body: {
      purpose: 'post_utme' | 'acceptance' | 'school_fee';
      jambRegNo: string;
      amount: number;
      session: string;
      email?: string;
      phone?: string;
    }
  ) {
    return this.svc.initPayment(
      body.purpose,
      body.jambRegNo,
      body.amount,
      body.session,
      body.email,
      body.phone
    );
  }
}
```

### 3.9 Start Backend API

```bash
# From apps/api directory
pnpm start:dev

# API will be available at http://localhost:4000
```

## 4. Frontend Development

### 4.1 React + Vite Setup

```bash
# From repo root
pnpm dlx create-vite@latest apps/web -- --template react-ts

# Navigate to web app
cd apps/web

# Install dependencies
pnpm i axios react-router-dom zod
```

### 4.2 Package Configuration

#### Update `apps/web/package.json`

```json
{
  "name": "@fuep/web",
  "private": true,
  "version": "0.0.0"
}
```

### 4.3 Environment Configuration

#### `apps/web/.env`

```env
VITE_API_URL=http://localhost:4000
```

### 4.4 API Client Setup

#### `apps/web/src/lib/api.ts`

```typescript
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export function setAuth(token?: string) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}
```

### 4.5 Routing Configuration

#### `apps/web/src/main.tsx`

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Apply from './pages/Apply'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import './index.css'

const router = createBrowserRouter([
  { path: '/', element: <Apply/> },
  { path: '/login', element: <Login/> },
  { path: '/dashboard', element: <Dashboard/> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><RouterProvider router={router} /></React.StrictMode>
)
```

### 4.6 Page Components

#### `apps/web/src/pages/Apply.tsx`

```typescript
import { useState } from 'react';
import { api } from '../lib/api';

export default function Apply() {
  const [jamb, setJamb] = useState('');
  const [result, setResult] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const check = async () => {
    const { data } = await api.post('/auth/check-jamb', { jambRegNo: jamb.trim() });
    setResult(data);
  };

  const initPayment = async () => {
    const { data } = await api.post('/payments/init', {
      purpose: 'post_utme',
      jambRegNo: jamb.trim(),
      amount: 2000,
      session: '2025',
      email,
      phone
    });
    alert(`Payment started. Redirect (mock): ${data.redirectUrl}`);
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto' }}>
      <h2>Post-UTME Application</h2>
      <input placeholder="JAMB Reg No" value={jamb} onChange={e=>setJamb(e.target.value)} />
      <button onClick={check}>Check</button>

      {result && (result.exists ? (
        <div>
          <p>Found: {result.biodata?.surname} {result.biodata?.firstname}</p>
          <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input placeholder="Phone" value={phone} onChange={(e)=>setPhone(e.target.value)} />
          <button onClick={initPayment}>Pay Post-UTME Fee</button>
        </div>
      ) : <p style={{color:'crimson'}}>JAMB No not found.</p>)}
    </div>
  );
}
```

#### `apps/web/src/pages/Login.tsx`

```typescript
import { useState } from 'react';
import { api, setAuth } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const nav = useNavigate();

  const login = async () => {
    const { data } = await api.post('/auth/login', { username: u.trim(), password: p });
    setAuth(data.accessToken);
    nav('/dashboard');
  };

  return (
    <div style={{ maxWidth: 360, margin: '40px auto' }}>
      <h2>Login</h2>
      <input placeholder="JAMB Reg No" value={u} onChange={e=>setU(e.target.value)} />
      <input placeholder="Password" type="password" value={p} onChange={e=>setP(e.target.value)} />
      <button onClick={login}>Login</button>
    </div>
  );
}
```

#### `apps/web/src/pages/Dashboard.tsx`

```typescript
export default function Dashboard() {
  return (
    <div style={{maxWidth:800, margin:'40px auto'}}>
      <h2>Dashboard</h2>
      <p>Passport, Name, Programme, Department, Admission Status, Matric No, and Tabs will go here.</p>
    </div>
  );
}
```

### 4.7 Start Frontend

```bash
# From apps/web directory
pnpm dev

# Frontend will be available at http://localhost:5173
```

## 5. Testing & Validation

### 5.1 Sanity Test Steps

1. **Start Infrastructure**

   ```bash
   docker compose up -d
   ```

2. **Start Backend API**

   ```bash
   pnpm --filter @fuep/api start:dev
   # API at :4000
   ```

3. **Start Frontend**

   ```bash
   pnpm --filter @fuep/web dev
   # Web at :5173
   ```

4. **Test JAMB Verification**
   - Load Apply page at `http://localhost:5173`
   - Enter a JAMB Reg No that exists in `jamb_prelist` table
   - Insert test data if needed:

   ```sql
   INSERT INTO jamb_prelist (jamb_reg_no, surname, firstname, session)
   VALUES ('TEST123', 'DOE', 'JOHN', '2025');
   ```

5. **Test Payment Flow**
   - Check JAMB number → should return `exists: true`
   - Enter email/phone → Pay Post-UTME → see mock redirect URL

6. **Test Login**
   - Set password manually for testing:

   ```sql
   UPDATE candidates SET password_hash = crypt('pass1234', gen_salt('bf')) WHERE jamb_reg_no='TEST123';
   UPDATE candidates SET temp_password_flag=false WHERE jamb_reg_no='TEST123';
   ```

   - Use `/auth/login` → reach dashboard placeholder

## 6. Next Steps & Features

### 6.1 Immediate Development Priorities

- **Payment Success Webhook**: Create account with JAMB Reg No + temp password
- **Password Change Enforcement**: JWT guard + middleware for `temp_password_flag`
- **Biodata Forms**: PUT `/profile` endpoint with JAMB prefill
- **File Uploads**: MinIO integration with presigned URLs
- **Education Records**: Document management system

### 6.2 Advanced Features

- **Registration PDF**: Puppeteer HTML → PDF generation
- **Acceptance/School Fees**: Extend payment system
- **Matric Number Generation**: Background job with counters
- **Admission Letters**: PDF generation gated by payment status
- **Portal Migration**: Worker for main portal API integration

### 6.3 Integration Points

- **Remita Payment Gateway**: Real payment processing
- **Email System**: SMTP integration for notifications
- **File Processing**: Virus scanning and document conversion
- **Background Jobs**: Queue management with BullMQ

## 7. Quality of Life Improvements

### 7.1 Development Tools

- **ESLint/Prettier**: Root config shared across apps
- **Zod Validation**: DTO validation on frontend and backend
- **Type Generation**: Shared types between frontend and backend

### 7.2 Security & Monitoring

- **S3 Antivirus**: ClamAV container integration
- **Error Tracking**: Sentry integration
- **API Documentation**: OpenAPI/Swagger generation

### 7.3 Testing & Quality

- **Unit Tests**: Jest configuration for both apps
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Playwright for user flows

## 8. Common Issues & Solutions

### 8.1 CORS Configuration

```typescript
// In main.ts
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
```

### 8.2 MinIO Configuration

```typescript
// S3 SDK config
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for MinIO
});
```

### 8.3 Database Initialization

- **Schema File**: Must be in `infra/db/` before first `docker compose up`
- **Volume Issues**: Restart with fresh volume if schema doesn't load
- **Health Checks**: Wait for PostgreSQL to be ready before starting API

### 8.4 Security Best Practices

- **Password Hashing**: Always hash passwords with bcrypt
- **JWT Storage**: Store only access token in memory
- **Input Validation**: Server-side validation for all inputs
- **Environment Variables**: Never commit sensitive data

### 8.5 Development Workflow

```bash
# Quick start commands
pnpm dev                    # Start both API and frontend
pnpm dev:api              # Start only API
pnpm dev:web              # Start only frontend
pnpm lint                 # Lint all code
pnpm typecheck            # Type check all code
pnpm format               # Format all code
```

---

## Quick Reference

### Ports

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:4000`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **MinIO**: `localhost:9000` (API), `localhost:9001` (Console)
- **MailHog**: `localhost:1025` (SMTP), `localhost:8025` (Web UI)

### Default Credentials

- **PostgreSQL**: `fuep` / `fuep`
- **MinIO**: `fuep` / `fuepstrongpassword`

### Key Commands

```bash
# Start everything
docker compose up -d && pnpm dev

# Test API
curl http://localhost:4000/auth/check-jamb -X POST -H "Content-Type: application/json" -d '{"jambRegNo":"TEST123"}'
```

## API Documentation (OpenAPI)

- Spec file: [docs/openapi.yaml](docs/openapi.yaml)
- Preview with Redocly:
  ```bash
  npx @redocly/cli@latest preview-docs docs/openapi.yaml
  ```
- Preview with Swagger UI (Docker for Windows cmd):
  ```bash
  docker run -p 8080:8080 -e SWAGGER_JSON=/openapi.yaml -v %cd%/docs/openapi.yaml:/openapi.yaml swaggerapi/swagger-ui
  ```
  Then open http://localhost:8080

_This development guide provides a complete setup for the FUEP Post-UTME Portal development environment. Follow the steps sequentially to get a working development setup._

## Sequence Diagrams (Mermaid)

- Diagrams source: [docs/sequence-diagrams.md](docs/sequence-diagrams.md)
- These flows are authoritative and must be strictly followed during implementation, reviews, and testing.
- Viewers:
  - Paste into any Markdown engine that supports Mermaid (e.g., GitHub, GitLab).
  - Online previewer: https://mermaid.live

Coverage:

- Step 1 — Apply & Verify JAMB Number
- Step 2 — Initiate Post-UTME Payment
- Step 3 — Payment Confirmation & Account Creation
- Step 4 — Login & Password Change Prompt
- Step 5 — Biodata Form
- Step 6 — Educational Records & Uploads
- Step 7 — Next-of-Kin & Sponsor
- Step 8 — Registration Form Preview & Print
- Step 9 — Candidate Dashboard
- Step 10 — Admission → Acceptance/School Fees → Matric → Letter → Migration

Conformance:

- Payment orchestration, candidate lifecycle, document processing, admissions/matric/migration must match these sequences.
