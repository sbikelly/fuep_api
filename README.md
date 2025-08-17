# FUEP Post-UTME Portal

A comprehensive Post-UTME portal for Federal University of Education, Pankshin (FUEP) built with modern web technologies.

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18+ (Recommended: v20+)
- **pnpm**: v8+ (Install with `npm install -g pnpm`)
- **Docker & Docker Compose**: For development services
- **Git**: For version control

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fuep-postutme
   ```

2. **Install all dependencies**
   ```bash
   pnpm install:all
   ```

3. **Start development services**
   ```bash
   docker-compose up -d
   ```

4. **Set up environment variables**
   ```bash
   # Copy the example environment file
cp env.example .env.development
   
   # Edit with your configuration
   nano .env.development
   ```

5. **Run the development servers**
   ```bash
   pnpm dev
   ```

### Development Commands

```bash
# Install dependencies
pnpm install:all          # Install all workspace dependencies
pnpm install               # Install root dependencies only

# Development servers
pnpm dev                   # Run both API and Web servers
pnpm dev:api              # Run only the NestJS API server
pnpm dev:web              # Run only the React frontend server

# Building
pnpm build:types          # Build the shared types package
pnpm build:api            # Build the Express API
pnpm build:web            # Build the React frontend
pnpm build                # Build all packages

# Quality checks
pnpm typecheck            # Run TypeScript type checking
pnpm lint                 # Run ESLint across all packages
pnpm format               # Format code with Prettier

# Testing
pnpm test                 # Run all tests
pnpm test:api            # Run API tests only
pnpm test:web            # Run frontend tests only
```

## 🏗️ Architecture

### Monorepo Structure
```
fuep-postutme/
├── apps/
│   ├── api/              # Express Backend API
│   └── web/              # React Frontend
├── packages/
│   └── types/            # Shared TypeScript types
├── infra/                # Infrastructure configuration
└── docs/                 # Documentation
```

### Tech Stack

#### Backend (Express API)
- **Framework**: Express (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with role-based access
- **File Storage**: S3-compatible object storage (MinIO for development)
- **Caching**: Redis
- **Payment**: Remita, Flutterwave integration
- **Email**: SMTP with MailHog for development

#### Frontend (React)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query + Zustand
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **Icons**: Lucide React

#### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **Object Storage**: MinIO (S3-compatible)
- **Email Testing**: MailHog
- **Reverse Proxy**: Nginx (production)

#### Shared Types
- **Package**: `@fuep/types`
- **Language**: TypeScript
- **Validation**: Zod schemas
- **Build**: TypeScript compiler

## 🔧 Configuration

### Environment Variables

Create a `.env.development` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=4000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=fuep
DB_PASSWORD=fuep
DB_NAME=fuep_portal

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_REFRESH_EXPIRES_IN=7d
SESSION_TTL=86400

# Payment Gateways
REMITA_PUBLIC_KEY=your_remita_public_key
REMITA_SECRET_KEY=your_remita_secret_key
FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key

# File Storage (MinIO for development)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=fuep
MINIO_SECRET_KEY=fuepstrongpassword
MINIO_BUCKET=uploads
MINIO_USE_SSL=false

# Email (MailHog for development)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@fuep.edu.ng

# Redis (optional URL overrides host/port/db)
REDIS_URL=
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Security
CORS_ORIGIN=http://localhost:5173
```

### Docker Services

The development environment includes:

- **PostgreSQL** (Port 5432): Main database
- **Redis** (Port 6379): Caching and job queues
- **MinIO** (Port 9000): S3-compatible object storage
- **MailHog** (Port 1025): Email testing and capture

## 📊 Implementation Status

### ✅ Completed Features

#### Backend (Express API)
- ✅ Basic project structure and configuration
- ✅ Database entities and relationships (TypeORM)
- ✅ Authentication module with JWT and Passport.js
- ✅ Candidate management module with CRUD operations
- ✅ Payment module structure and basic endpoints
- ✅ Database configuration with TypeORM
- ✅ Proper package naming and workspace setup

#### Frontend (React)
- ✅ Basic project structure with Vite
- ✅ Tailwind CSS configuration and design system
- ✅ React Router setup and navigation
- ✅ Core page components (Home, Login, Registration, Dashboard)
- ✅ Responsive design and mobile-friendly layout
- ✅ Icon system with Lucide React

#### Shared Types
- ✅ TypeScript package structure
- ✅ Comprehensive type definitions for all entities
- ✅ Zod validation schemas
- ✅ Proper exports and package configuration

### 🚧 In Progress
- 🔄 Payment gateway integration (Remita, Flutterwave)
- 🔄 File upload functionality with virus scanning
- 🔄 Admin modules for user management
- 🔄 Form validation and error handling
- 🔄 State management for user sessions

### ❌ Pending
- ⏳ Testing framework setup (Jest, React Testing Library)
- ⏳ Email service implementation
- ⏳ SMS integration
- ⏳ Admin portal development
- ⏳ Production deployment configuration

## 🚀 Running the Application

### 1. Start Development Services
```bash
# Start all Docker services
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 2. Install Dependencies
```bash
# Install all workspace dependencies
pnpm install:all
```

### 3. Set Environment Variables
```bash
# Copy and configure environment file
cp .env.example .env.development
# Edit .env.development with your configuration
```

### 4. Start Development Servers
```bash
# Run both frontend and backend
pnpm dev

# Or run separately:
pnpm dev:api    # Backend (Express) on http://localhost:4000
pnpm dev:web    # Frontend on http://localhost:5173
```

### 5. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **OpenAPI Spec**: [docs/openapi.yaml](docs/openapi.yaml)
- **Sequence Diagrams (Mermaid)**: [docs/sequence-diagrams.md](docs/sequence-diagrams.md)
- **MinIO Console**: http://localhost:9001 (fuep/fuepstrongpassword)
- **MailHog**: http://localhost:8025

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Frontend (Vite) default
netstat -ano | findstr :5173

# Backend (API)
netstat -ano | findstr :4000

# Kill the process by PID
taskkill /PID <PID> /F
```

#### 2. Docker Services Not Starting
```bash
# Check Docker status
docker-compose ps
docker-compose logs

# Restart services
docker-compose down
docker-compose up -d
```

#### 3. Database Connection Issues
```bash
# Check PostgreSQL container
docker-compose logs postgres

# Connect to database manually
docker-compose exec postgres psql -U fuep -d fuep_portal
```

#### 4. Dependency Issues
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules
pnpm install:all
```

#### 5. TypeScript Errors
```bash
# Check types
pnpm typecheck

# Build types package first
pnpm build:types
```

### Development Tips

1. **Always start with Docker services**: `docker-compose up -d`
2. **Build types first**: `pnpm build:types` before `pnpm dev`
3. **Check logs**: Use `docker-compose logs` for service debugging
4. **Use workspace commands**: `pnpm --filter @fuep/api <command>`

## 📐 Design Artifacts (Authoritative)

- OpenAPI 3.0 contract: [docs/openapi.yaml](docs/openapi.yaml)
- Sequence Diagrams (Mermaid): [docs/sequence-diagrams.md](docs/sequence-diagrams.md)

These artifacts are normative and must be strictly adhered to in design, implementation, and reviews.

## 📚 API Documentation (OpenAPI 3.0)

- Source of truth: [docs/openapi.yaml](docs/openapi.yaml)
- Preview locally (Redoc):
  ```bash
  npx @redocly/cli@latest preview-docs docs/openapi.yaml
  ```
- Preview locally (Swagger UI via Docker):
  ```bash
  docker run -p 8080:8080 -e SWAGGER_JSON=/openapi.yaml -v %cd%/docs/openapi.yaml:/openapi.yaml swaggerapi/swagger-ui
  ```
  Then open http://localhost:8080

### Public
- POST /auth/check-jamb — verify JAMB number
- POST /auth/login — candidate login
- POST /auth/change-password — change password
- POST /payments/init — initialize payment
- POST /payments/webhook/remita — Remita webhook

### Candidate
- GET /me — composite profile
- PUT /profile — update biodata
- POST /education-records — create education record
- PUT /education-records/{id} — update education record
- POST /uploads — upload document (multipart)
- GET /registration-form — registration form JSON
- GET /registration-form.pdf — registration form PDF
- GET /dashboard — candidate dashboard summary
- GET /admission-letter.pdf — admission letter (eligible only)

### Admin
- POST /admin/prelist/upload — upload JAMB prelist (CSV/Excel)
- GET /admin/candidates — list candidates (filters)
- PATCH /admin/admissions/{candidateId} — admission decision
- POST /admin/matric/{candidateId} — assign matric number
- POST /admin/reconcile/{paymentId} — re-verify payment
- POST /admin/migrate/{studentId} — push to main portal

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is proprietary software developed for Federal University of Education, Pankshin.

## 🆘 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section above

---

**Built with ❤️ for FUEP**
