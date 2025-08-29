# FUEP Post-UTME Portal - Setup Instructions

## Quick Start Guide

This guide will help you set up the FUEP Post-UTME Portal API for local development and production deployment.

## Prerequisites

- **Node.js**: 20.13.1 or higher
- **pnpm**: 10.14.0 or higher
- **Docker**: 24.0 or higher
- **Docker Compose**: 2.20 or higher
- **Git**: Latest version

## Project Structure

```
fuep-postutme/
├── apps/
│   └── api/                 # Express.js API server
│       ├── src/             # Source code
│       ├── package.json     # API dependencies
│       └── Dockerfile       # Production container
├── packages/
│   └── types/               # Shared TypeScript types
├── infra/
│   └── db/                  # Database migrations and schemas
├── docs/                    # API documentation
├── docker-compose.yml       # Local development stack
└── render.yaml              # Render.com deployment blueprint
```

## Local Development Setup

### **Step 1: Clone Repository**

```bash
git clone https://github.com/sbikelly/fuep_api.git
cd fuep-postutme
```

### **Step 2: Install Dependencies**

```bash
# Install pnpm if not already installed
npm install -g pnpm@10.14.0

# Install project dependencies
pnpm install
```

### **Step 3: Environment Configuration**

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Key variables to configure:
# - Database credentials
# - Payment provider keys
# - Email settings
# - JWT secrets
```

### **Step 4: Start Development Services**

```bash
# Start all services (API, PostgreSQL, Redis, MailHog)
pnpm docker:up

# Or start API only in development mode
pnpm dev:api
```

### **Step 5: Verify Setup**

```bash
# Test API health
curl http://localhost:4000/api/health

# Test database connection
curl http://localhost:4000/api/health/db

# Access API documentation
# Open: http://localhost:4000/docs
```

## Docker Services

### **Available Services**

- **API Server**: http://localhost:4000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MinIO**: Removed - documents module no longer exists
- **MailHog**: localhost:1025 (SMTP), localhost:8025 (Web UI)

### **Docker Commands**

```bash
# Start all services
pnpm docker:up

# Stop all services
pnpm docker:down

# View service logs
pnpm docker:logs

# Check service status
pnpm docker:ps

# Rebuild and start API
docker compose up -d --build api
```

## Database Setup

### **Automatic Setup**

The database is automatically initialized when you run `pnpm docker:up`. This includes:

- Database creation
- Schema migrations
- Seed data insertion
- Admin user creation

### **Manual Database Access**

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U fuep -d fuep_portal

# View tables
\dt

# View admin users
SELECT * FROM admin_users;
```

### **Default Admin Account**

- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `super_admin`

## Authentication Setup

### **JWT Configuration**

```bash
# Generate secure JWT secrets
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For JWT_REFRESH_SECRET
```

### **Admin Login**

```bash
# Login as admin
curl -X POST http://localhost:4000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## Payment Provider Setup

### **Remita Integration**

```bash
# Set in .env file
REMITA_PUBLIC_KEY=your_public_key
REMITA_SECRET_KEY=your_secret_key
REMITA_MERCHANT_ID=your_merchant_id
REMITA_BASE_URL=https://remitademo.net  # Sandbox
```

## Email Configuration

### **Development (MailHog)**

```bash
# MailHog is automatically configured for development
# Access web interface at: http://localhost:8025
# SMTP port: 1025
```

### **Production (SMTP)**

```bash
# Set in .env file
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## Production Deployment

### **Render.com Deployment**

1. **Connect Repository**
   - Link your GitHub repository to Render
   - Render will automatically detect `render.yaml`

2. **Environment Variables**
   - Configure required environment variables
   - Set production database and API keys

3. **Auto-deploy**
   - Render will automatically build and deploy
   - Database will be provisioned automatically

### **Manual Deployment**

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Or use Docker
docker compose -f docker-compose.prod.yml up -d
```

## Testing

### **API Testing**

```bash
# Test health endpoints
curl http://localhost:4000/api/health
curl http://localhost:4000/api/health/db

# Test admin endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/admin/payment-purposes

# Test payment endpoints
curl -X POST http://localhost:4000/api/payments/init \
  -H "Content-Type: application/json" \
  -d '{"purpose":"POST_UTME","amount":2500,"session":"2025/2026"}'
```

### **Database Testing**

```bash
# Test database connection
docker compose exec postgres psql -U fuep -d fuep_portal -c "SELECT version();"

# Test admin user
docker compose exec postgres psql -U fuep -d fuep_portal -c "SELECT username, role FROM admin_users;"
```

## Development Commands

```bash
# Build all packages
pnpm build

# Start API development server
pnpm dev:api

# Run tests
pnpm test

# Clean build artifacts
pnpm clean

# Type checking
pnpm type-check

# Linting
pnpm lint

# Formatting
pnpm format
```

## API Documentation

### **OpenAPI Specification**

- **Swagger UI**: http://localhost:4000/docs
- **OpenAPI JSON**: http://localhost:4000/openapi.json
- **YAML Spec**: `docs/openapi.yaml`

### **Key Endpoints**

- **Health**: `GET /api/health`
- **Admin Auth**: `POST /api/admin/auth/login`
- **Payment Purposes**: `GET /api/admin/payment-purposes`
- **Candidates**: `GET /api/candidates`
- **Payments**: `POST /api/payments/init`

## Troubleshooting

### **Common Issues**

#### **Port Already in Use**

```bash
# Check what's using port 4000
netstat -ano | findstr :4000  # Windows
lsof -i :4000                 # macOS/Linux

# Kill process or change port in .env
PORT=4001
```

#### **Database Connection Issues**

```bash
# Check PostgreSQL status
docker compose ps postgres

# View PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres
```

#### **API Build Issues**

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build

# Check TypeScript errors
pnpm type-check
```

### **Logs and Debugging**

```bash
# View API logs
docker compose logs -f api

# View all service logs
docker compose logs -f

# Check API health
curl http://localhost:4000/api/health
```

## Support

- **Documentation**: Check the `/docs` directory
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions

---

**Happy coding!**
