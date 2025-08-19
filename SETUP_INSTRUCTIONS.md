# FUEP Post-UTME Portal - Setup Instructions

## Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** package manager
- **Docker Desktop** (for database and services)
- **Git**

## Project Structure

```
fuep-postutme/
├── apps/
│   ├── api/          # Backend Express API
│   └── web/          # Frontend React App
├── packages/
│   └── types/        # Shared TypeScript types
├── infra/            # Infrastructure configuration
├── docs/             # Documentation (OpenAPI: docs/openapi.yaml)
└── docker-compose.yml
```

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd fuep-postutme
pnpm install:all
```

### 2. Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, MinIO, and MailHog
docker-compose up -d
```

**Services:**

- **PostgreSQL**: `localhost:5432` (user: `fuep`, password: `fuep`, db: `fuep_portal`)
- **Redis**: `localhost:6379`
- **MinIO**: `localhost:9000` (Console: `localhost:9001`, user: `fuep`, password: `fuepstrongpassword`)
- **MailHog**: `localhost:1025` (Web UI: `localhost:8025`)

### 3. Environment Configuration

Create a `.env.development` file in the root directory:

```env
# Application Configuration
NODE_ENV=development
PORT=4000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=fuep
DB_PASSWORD=fuep
DB_NAME=fuep_portal

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_REFRESH_EXPIRES_IN=7d
SESSION_TTL=86400

# File Storage Configuration (MinIO)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=fuep
MINIO_SECRET_KEY=fuepstrongpassword
MINIO_BUCKET=uploads
MINIO_USE_SSL=false

# Redis Configuration
# Optional: when REDIS_URL is set, it overrides host/port/db below
REDIS_URL=
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Security Configuration
CORS_ORIGIN=http://localhost:5173
```

### 4. Start Applications

#### Option A: Start Both Together

```bash
pnpm dev
```

#### Option B: Start Separately

```bash
# Terminal 1 - Backend API
pnpm dev:api

# Terminal 2 - Frontend
pnpm dev:web
```

**Ports:**

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:4000`

## Development Commands

### Backend API (Express)

```bash
cd apps/api

# Development (tsx watch)
pnpm start:dev

# Build
pnpm build

# Production (run compiled dist)
pnpm start
```

### Frontend

```bash
cd apps/web

# Development
pnpm dev

# Build
pnpm build

# Preview build
pnpm preview
```

### Root Level

```bash
# Install all dependencies
pnpm install:all

# Build all packages
pnpm build

# Lint all code
pnpm lint

# Type check
pnpm typecheck
```

## Database Management

### Access PostgreSQL

```bash
# Connect to database (container created by docker-compose)
docker exec -it fuep-postgres psql -U fuep -d fuep_portal

# View tables
\dt

# Exit
\q
```

### Reset Database

```bash
# Stop and remove containers
docker-compose down

# Remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

- Ensure Docker Desktop is running
- Check if containers are healthy: `docker ps`
- Verify database credentials in `.env` file
- Restart containers: `docker-compose restart`

#### 2. Port Already in Use

```bash
# Find process using ports
netstat -ano | findstr :4000   # API
netstat -ano | findstr :5173   # Frontend

# Kill process
taskkill /PID <process-id> /F
```

#### 3. Dependencies Issues

```bash
# Clear cache and reinstall
pnpm store prune
pnpm install:all
```

#### 4. TypeScript Errors

```bash
# Check for type errors
pnpm typecheck

# Fix linting issues
pnpm lint --fix
```

### Environment Testing

Use the provided test script to verify environment variables:

```bash
cd apps/api
node test-env.js
```

This will output your current environment configuration.

## Production Deployment

### Environment Variables

- Set `NODE_ENV=production`
- Use strong, unique `JWT_SECRET`
- Configure production database credentials
- Set up SSL certificates
- Configure production MinIO/S3 credentials

### Security Checklist

- [ ] Change default passwords
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Enable HTTPS
- [ ] Set up backup strategies

## Additional Resources

- **OpenAPI Spec**: [docs/openapi.yaml](docs/openapi.yaml)
- **Preview (Redocly)**:
  ```bash
  npx @redocly/cli@latest preview-docs docs/openapi.yaml
  ```
- **Preview (Swagger UI)**:
  ```bash
  docker run -p 8080:8080 -e SWAGGER_JSON=/openapi.yaml -v %cd%/docs/openapi.yaml:/openapi.yaml swaggerapi/swagger-ui
  ```
  Then open http://localhost:8080
- **Sequence Diagrams (Mermaid)**: [docs/sequence-diagrams.md](docs/sequence-diagrams.md)
  - Paste each code block into a Markdown engine that supports Mermaid, or use https://mermaid.live for quick previews
- **MinIO Console**: `http://localhost:9001` (development)
- **MailHog**: `http://localhost:8025` (development)
- **Database Schema**: `infra/db/001_schema.sql`

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review Docker container logs: `docker-compose logs <service-name>`
3. Check application logs in the terminal
4. Verify all prerequisites are met
