# FUEP Post-UTME Portal

A comprehensive digital solution for Federal University of Education, Pankshin (FUEP) to streamline the post-UTME examination process. The system modernizes traditional paper-based applications, providing secure, efficient, and user-friendly platforms for candidates and administrators.

## 🚀 **Current Status: Phase 8 Complete + Docker Implementation**

**Latest Achievement**: Documents & Uploads System + Full Docker Containerization ✅  
**Next Phase**: Candidate Portal Features (Phase 9)

### ✅ **Completed Features**

- **Phase 1-3**: Repository setup, infrastructure, backend bootstrap
- **Phase 4-5**: Frontend bootstrap, shared types package
- **Phase 6**: Core authentication and profile management flows
- **Phase 7**: **Payment Gateway Integration** - Remita + Flutterwave with webhook processing
- **Phase 8**: **Documents & Uploads System** - MinIO S3 integration with comprehensive file management
- **Docker Implementation**: **Full Containerization** - Multi-stage Dockerfiles, Docker Compose orchestration

### 🔄 **Current Capabilities**

- **Authentication**: JAMB verification, login, profile management
- **Applications**: Complete application lifecycle management
- **Payments**: Real payment gateway integration with Remita (primary) and Flutterwave (fallback)
- **Security**: Webhook signature verification, audit trails, file validation
- **Receipts**: PDF generation with tamper detection
- **Documents**: Comprehensive file upload, storage, and management with MinIO S3
- **File Security**: MIME type validation, size limits, checksum verification
- **Containerization**: Full Docker deployment with multi-stage builds and service orchestration

## 🏗️ **Architecture**

- **Backend**: Express.js API with TypeScript
- **Frontend**: React + TypeScript + Vite
- **Database**: PostgreSQL with comprehensive schema
- **Payment**: Multi-provider gateway integration with explicit module initialization
- **Types**: Shared TypeScript types across monorepo
- **Validation**: Zod schemas for runtime validation
- **Containerization**: Docker multi-stage builds with pnpm workspace support

### **Docker Architecture**

The system is fully containerized using Docker Compose with the following services:

1. **API Service**: Node.js Express backend with TypeScript compilation
2. **Web Service**: React frontend built with Vite, served via Nginx
3. **Infrastructure Services**: PostgreSQL, Redis, MinIO, MailHog
4. **Multi-stage Builds**: Optimized Docker images with separate build and runtime stages
5. **Workspace Support**: pnpm monorepo with shared types package integration

**Port Configuration:**

- **Frontend**: http://localhost:5173 (accessible from host)
- **Backend API**: http://localhost:4000 (accessible from host)
- **Database**: localhost:5432 (accessible from host)
- **MinIO Console**: http://localhost:9001 (accessible from host)
- **MailHog**: http://localhost:8025 (accessible from host)

**Known Issues:**

- **Environment Variable Substitution**: Frontend build process has issues with environment variable substitution during Docker build (see TODO.md for details)
- **Current Workaround**: Frontend uses hardcoded API URLs that need manual updating

### **Payments Module Architecture**

The payments system uses an explicit initialization pattern to ensure proper dependency injection and module loading:

1. **Module Initializer**: `createPaymentsModule()` creates all dependencies in the correct order
2. **Provider Registry**: Manages Remita (primary) and Flutterwave (fallback) providers
3. **Service Layer**: Handles business logic with injected dependencies
4. **Controller Layer**: Manages HTTP requests with injected service
5. **Router**: Express router with bound controller methods

This architecture ensures:

- Deterministic initialization order
- Proper dependency injection
- Clear separation of concerns
- Easy testing and mocking
- No circular dependencies
- Robust payment operations

### **Documents Module Architecture**

The documents system provides comprehensive file management capabilities:

1. **MinIO Integration**: S3-compatible object storage with automatic bucket management
2. **File Validation**: MIME type whitelist, size limits, and security checks
3. **Document Service**: Business logic for file operations and metadata management
4. **Controller Layer**: HTTP request handling with proper error responses
5. **Security Features**: File checksums, access control, and audit logging

This architecture ensures:

- Secure file uploads and storage
- Scalable object storage solution
- Comprehensive file validation
- Easy integration with candidate workflows
- Foundation for advanced features (scanning, conversion)

## 🚀 **Quick Start**

### 1. Clone and Setup

```bash
git clone <repository-url>
cd fuep-postutme
pnpm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory with the following configuration:

```bash
# Server Configuration
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/fuep_postutme
POSTGRES_DB=fuep_postutme
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# API Configuration
API_BASE_URL=http://localhost:4000
FRONTEND_BASE_URL=http://localhost:5173
PAYMENT_CALLBACK_URL=http://localhost:5173/payment/callback

# Payment Gateway Configuration

# Remita Configuration (Primary Provider)
REMITA_PUBLIC_KEY=your_remita_public_key
REMITA_SECRET_KEY=your_remita_secret_key
REMITA_WEBHOOK_SECRET=your_remita_webhook_secret
REMITA_MERCHANT_ID=2547916
REMITA_BASE_URL=https://remitademo.net

# Flutterwave Configuration (Fallback Provider)
FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key
FLUTTERWAVE_WEBHOOK_SECRET=your_flutterwave_webhook_secret
FLUTTERWAVE_BASE_URL=https://api.flutterwave.com/v3

# Redis Configuration
REDIS_URL=redis://localhost:6379

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_BUCKET_NAME=fuep-documents

# Mail Configuration
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USER=test@example.com
MAIL_PASS=test

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json

# Development Configuration
ENABLE_MOCK_DATA=true
ENABLE_DEBUG_LOGGING=true
```

### 3. Start Services

```bash
# Start all services with Docker Compose (Recommended)
docker compose up -d

# OR start infrastructure services only
docker compose up -d postgres redis minio mailhog

# Build shared types package (if not using Docker)
pnpm build:types

# OR individual types
pnpm --filter @fuep/types build:types
pnpm --filter @fuep/api build:types
pnpm --filter @fuep/web build:types

# Start development servers (if not using Docker)
pnpm dev                    # Both API and Web
# OR
pnpm dev:api               # API only
pnpm dev:web               # Web only

# OR start dev server from the api directory
pnpm --filter @fuep/api start:dev

# OR start dev server from the web directory
pnpm --filter @fuep/web dev

# Stop services
docker compose down -v

# Stop development servers
pnpm stop
# or
pnpm stop:api
pnpm stop:web

#or
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
```

### 4. Verify Setup

```bash
# Check API health
curl http://localhost:4000/health

# Check payment providers status
curl http://localhost:4000/payments/providers/status

# Open web app
# http://localhost:5173

# Check Docker services status
docker compose ps
```

## 🐳 **Docker Deployment**

### **Service Architecture**

The application is fully containerized using Docker Compose with the following services:

```yaml
# Core Application Services
api: # Express.js backend on port 4000
web: # React frontend on port 5173

# Infrastructure Services
postgres: # PostgreSQL database on port 5432
redis: # Redis cache on port 6379
minio: # S3-compatible storage on ports 9000/9001
mailhog: # Email testing on ports 1025/8025
```

### **Port Configuration**

| Service       | Internal Port | External Port | URL                   |
| ------------- | ------------- | ------------- | --------------------- |
| Frontend      | 80            | 5173          | http://localhost:5173 |
| Backend API   | 4000          | 4000          | http://localhost:4000 |
| PostgreSQL    | 5432          | 5432          | localhost:5432        |
| Redis         | 6379          | 6379          | localhost:6379        |
| MinIO API     | 9000          | 9000          | localhost:9000        |
| MinIO Console | 9001          | 9001          | http://localhost:9001 |
| MailHog SMTP  | 1025          | 1025          | localhost:1025        |
| MailHog Web   | 8025          | 8025          | http://localhost:8025 |

### **Docker Commands**

```bash
# Start all services
docker compose up -d

# Start specific services
docker compose up -d postgres redis

# View service logs
docker compose logs -f api
docker compose logs -f web

# Access running containers
docker compose exec api sh
docker compose exec web sh
docker compose exec postgres psql -U fuep -d fuep_portal

# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Rebuild and restart
docker compose up -d --build

# View service status
docker compose ps
```

### **Multi-stage Builds**

Both API and Web services use multi-stage Docker builds:

1. **Base Stage**: Node.js Alpine with pnpm installation
2. **Deps Stage**: Dependencies installation and types package building
3. **Build Stage**: Application compilation and bundling
4. **Runtime Stage**: Optimized runtime image (Node.js for API, Nginx for Web)

### **Environment Variables**

Environment variables are configured in `docker-compose.yml` and passed to containers:

- **API Service**: Database, MinIO, CORS, and application configuration
- **Web Service**: API endpoint URLs and branding configuration
- **Infrastructure**: Database credentials, MinIO settings, Redis configuration

### **Known Issues & Limitations**

1. **Environment Variable Substitution**: Frontend build process has issues with environment variable substitution during Docker build
   - **Impact**: API URLs are hardcoded in the frontend bundle
   - **Workaround**: Manual URL updates required after rebuilds
   - **Status**: Under investigation (see TODO.md for details)

2. **Build Context**: Docker build context is set to root directory to handle pnpm workspace dependencies
   - **Impact**: Larger build context, longer build times
   - **Mitigation**: Comprehensive `.dockerignore` files to exclude unnecessary files

3. **Port Conflicts**: Ensure ports 4000, 5173, 5432, 6379, 9000, 9001, 1025, 8025 are available on the host

## 📚 **API Documentation**

### **Public Endpoints**

#### Authentication

- `POST /auth/check-jamb` - Verify JAMB registration number
- `POST /auth/login` - Candidate login
- `POST /auth/change-password` - Change password

#### Profile Management

- `PUT /profile` - Update candidate profile

#### Applications

- `POST /applications` - Create new application
- `GET /applications/:id` - Get application details

#### Payments

- `POST /payments/init` - Initialize payment
- `GET /payments/:id` - Get payment status
- `POST /payments/:id/verify` - Verify payment manually
- `GET /payments/:id/receipt` - Get payment receipt
- `POST /payments/webhook/remita` - Remita webhook
- `POST /payments/webhook/flutterwave` - Flutterwave webhook
- `GET /payments/providers/status` - Provider health check

#### Documents

- `POST /documents/upload` - Upload document with validation
- `GET /documents/:id` - Get document details
- `GET /documents/candidate/:id` - List candidate documents
- `GET /documents/:id/download` - Download document
- `GET /documents/:id/secure-url` - Generate secure download URL
- `DELETE /documents/:id` - Delete document
- `GET /documents/health/status` - Documents service health check
- `POST /documents/:id/scan-status` - Update document scan status

#### System

- `GET /health` - API health check

### **Testing Examples**

```bash
# Health check
curl http://localhost:4000/health

# JAMB verification
curl -X POST http://localhost:4000/auth/check-jamb \
  -H "Content-Type: application/json" \
  -d '{"jambRegNo":"TEST123456789"}'

# Payment initiation
curl -X POST http://localhost:4000/payments/init \
  -H "Content-Type: application/json" \
  -d '{"purpose":"postutme","amount":2500,"currency":"NGN","session":"2024/2025"}'

# Check payment status
curl http://localhost:4000/payments/{payment-id}

# Get provider status
curl http://localhost:4000/payments/providers/status

# Check documents service health
curl http://localhost:4000/documents/health/status

# List candidate documents
curl http://localhost:4000/documents/candidate/{candidate-id}
```

## 🛠️ **Development Commands**

### **Build & Test**

```bash
# Build all packages
pnpm build

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Formatting
pnpm format
```

### **Package-Specific**

```bash
# Types package
pnpm build:types
pnpm --filter @fuep/types typecheck

# API package
pnpm --filter @fuep/api typecheck
pnpm --filter @fuep/api start:dev

# Web package
pnpm --filter @fuep/web typecheck
pnpm --filter @fuep/web dev
```

### **Database Operations**

```bash
# Access PostgreSQL
docker compose exec postgres psql -U postgres -d fuep_postutme

# Reset database
docker compose down -v
docker compose up -d
```

## 🔐 **Payment Gateway Integration**

### **Supported Providers**

- **Remita** (Primary): Nigerian payment gateway with RRR system
- **Flutterwave** (Fallback): Pan-African payment platform

### **Features**

- **Secure Webhooks**: HMAC-SHA256 signature verification
- **Idempotency**: Prevents duplicate payment processing with Idempotency-Key header
- **Request Hash Validation**: Ensures identical requests return the same response
- **Conflict Detection**: Returns 422 for same key with different request body
- **Audit Trail**: Complete payment event logging with deduplication
- **Provider Fallback**: Automatic failover between providers
- **Receipt Generation**: PDF receipts with tamper detection

### **Configuration**

1. Set provider credentials in `.env`
2. Configure webhook URLs in provider dashboards
3. Test with sandbox credentials
4. Deploy with production credentials

## 📁 **Project Structure**

```
fuep-postutme/
├── apps/
│   ├── api/                 # Express.js backend
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── documents/    # Document management system
│   │       │   └── payment/      # Payment gateway integration
│   │       └── main.ts           # API entry point
│   └── web/                 # React frontend
├── packages/
│   └── types/               # Shared TypeScript types
├── infra/
│   ├── db/                  # Database schema
│   └── docker/              # Docker configurations
├── docs/                    # API documentation
└── scripts/                 # Build and deployment scripts
```

## 🧪 **Testing**

### **Test Coverage**

- Unit tests for payment providers
- Integration tests for payment flows
- Frontend tests for payment UI
- Security tests for webhook validation

### **Running Tests**

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:unit
pnpm test:integration
pnpm test:e2e
```

## 🚀 **Deployment**

### **Development**

- Local development with hot reload
- Docker Compose for infrastructure
- Sandbox payment credentials

### **Production**

- Environment-specific configurations
- Production payment credentials
- Monitoring and alerting
- Backup and disaster recovery

## 📊 **Monitoring & Health**

### **Health Checks**

- API endpoint health monitoring
- Database connectivity checks
- Payment provider status monitoring
- Service uptime tracking

### **Logging**

- Structured JSON logging
- Payment event audit trails
- Error tracking and alerting
- Performance metrics

## 🤝 **Contributing**

1. Follow the established code style and patterns
2. Add tests for new features
3. Update documentation as needed
4. Use conventional commit messages
5. Ensure all checks pass before submitting

## 📄 **License**

This project is proprietary software for Federal University of Education, Pankshin.

## 🆘 **Support**

For technical support or questions:

- Check the documentation in `/docs`
- Review the development guide
- Contact the development team

---

**Last Updated**: 2025-01-19  
**Version**: 1.0.0 + Docker  
**Status**: Phase 8 Complete + Docker Implementation - Ready for Phase 9 (Candidate Portal Features)
