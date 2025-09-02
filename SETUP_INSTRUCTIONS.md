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

## Docker Container Management

### **Docker Hub Repository**

The application is available on Docker Hub at: **https://hub.docker.com/r/sbikelly/fuep-api**

#### **Available Tags**

- `latest` - Latest version (always points to the most recent build)
- `v1.0.0` - Semantic version tag for this release
- `8f9d79f` - Git commit hash tag for specific version tracking

#### **Quick Start with Docker Hub**

```bash
# Pull and run the latest version
docker pull sbikelly/fuep-api:latest
docker run -p 4000:4000 sbikelly/fuep-api:latest

# Or use Docker Compose
docker-compose up -d
```

### **Building and Pushing to Docker Hub**

#### **Prerequisites**

```bash
# Install Docker Desktop or Docker Engine
# Login to Docker Hub
docker login
```

#### **Build Commands**

```bash
# Build the Docker image
docker build -f apps/api/Dockerfile -t fuep-postutme-api .

# Build with specific target
docker build -f apps/api/Dockerfile --target runtime -t fuep-postutme-api .

# Build for different architectures
docker buildx build --platform linux/amd64,linux/arm64 -f apps/api/Dockerfile -t fuep-postutme-api .
```

#### **Tagging Commands**

```bash
# Tag with your Docker Hub username
docker tag fuep-postutme-api sbikelly/fuep-api:latest

# Tag with version
docker tag fuep-postutme-api sbikelly/fuep-api:v1.0.0

# Tag with git commit hash
git rev-parse --short HEAD  # Get commit hash
docker tag fuep-postutme-api sbikelly/fuep-api:$(git rev-parse --short HEAD)
```

#### **Push Commands**

```bash
# Push latest version
docker push sbikelly/fuep-api:latest

# Push versioned tag
docker push sbikelly/fuep-api:v1.0.0

# Push commit hash tag
docker push sbikelly/fuep-api:$(git rev-parse --short HEAD)

# Push all tags
docker push sbikelly/fuep-api --all-tags
```

### **Docker Compose Configuration**

#### **Development Environment**

```bash
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build api
```

#### **Production Environment**

```bash
# Start production environment
docker-compose up -d

# Scale API service
docker-compose up -d --scale api=3

# Update services
docker-compose pull && docker-compose up -d
```

### **Docker Health Checks**

```bash
# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# View health check logs
docker inspect --format='{{json .State.Health}}' fuep_api | jq

# Test health endpoint
curl http://localhost:4000/api/health
```

### **Docker Networking**

```bash
# Create custom network
docker network create fuep-network

# Run with custom network
docker run --network fuep-network -p 4000:4000 sbikelly/fuep-api:latest

# Inspect network
docker network inspect fuep-network
```

### **Docker Volumes**

```bash
# Create persistent volume
docker volume create fuep-data

# Run with volume
docker run -v fuep-data:/app/data -p 4000:4000 sbikelly/fuep-api:latest

# Backup volume
docker run --rm -v fuep-data:/data -v $(pwd):/backup alpine tar czf /backup/fuep-backup.tar.gz -C /data .
```

### **Docker Security**

```bash
# Run as non-root user (already configured in Dockerfile)
docker run --user node -p 4000:4000 sbikelly/fuep-api:latest

# Scan for vulnerabilities
docker scan sbikelly/fuep-api:latest

# Run with security options
docker run --security-opt=no-new-privileges -p 4000:4000 sbikelly/fuep-api:latest
```

### **Docker Monitoring**

```bash
# View container stats
docker stats fuep_api

# Monitor resource usage
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# View container logs
docker logs -f fuep_api

# Export container logs
docker logs fuep_api > api-logs.txt
```

### **Docker Cleanup**

```bash
# Remove unused containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Clean everything
docker system prune -a
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

# Or use Docker Hub image
docker pull sbikelly/fuep-api:latest
docker-compose up -d
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

# Pull latest image and restart
docker-compose pull && docker-compose up -d
```

### **Using Docker Hub Image**

```bash
# Pull the latest version
docker pull sbikelly/fuep-api:latest

# Run standalone
docker run -p 4000:4000 sbikelly/fuep-api:latest

# Run with environment variables
docker run -p 4000:4000 \
  -e NODE_ENV=production \
  -e DB_HOST=your-db-host \
  -e DB_PORT=5432 \
  -e DB_USER=your-db-user \
  -e DB_PASSWORD=your-db-password \
  -e DB_NAME=your-db-name \
  sbikelly/fuep-api:latest

# Run with Docker Compose
docker-compose up -d
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

### **Docker Hub Deployment**

```bash
# Pull latest image
docker pull sbikelly/fuep-api:latest

# Run with production environment
docker run -d \
  --name fuep-api \
  -p 4000:4000 \
  -e NODE_ENV=production \
  -e DB_HOST=your-db-host \
  -e DB_PORT=5432 \
  -e DB_USER=your-db-user \
  -e DB_PASSWORD=your-db-password \
  -e DB_NAME=your-db-name \
  sbikelly/fuep-api:latest

# Or use Docker Compose
docker-compose up -d
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

### **Docker Testing**

```bash
# Test container health
docker exec fuep_api curl -f http://localhost:4000/api/health

# Test container logs
docker logs fuep_api

# Test container performance
docker stats fuep_api

# Test container networking
docker exec fuep_api ping postgres
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

### **Docker Development Commands**

```bash
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f api

# Rebuild container
docker-compose up -d --build api

# Stop services
docker-compose down

# Pull latest image
docker pull sbikelly/fuep-api:latest
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

# Test database connection
docker compose exec postgres psql -U fuep -d fuep_portal -c "SELECT version();"
```

#### **API Build Issues**

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build

# Check TypeScript errors
pnpm type-check

# Rebuild Docker image
docker-compose up -d --build api
```

#### **Docker Issues**

```bash
# Check Docker status
docker ps -a

# View container logs
docker logs fuep_api

# Restart container
docker restart fuep_api

# Rebuild container
docker-compose up -d --build api

# Clean Docker cache
docker system prune -a
```

#### **Docker Hub Issues**

```bash
# Check if logged in
docker login

# Check image tags
docker images | grep fuep-api

# Try pushing with different tag
docker tag fuep-postutme-api sbikelly/fuep-api:test
docker push sbikelly/fuep-api:test

# Pull latest image
docker pull sbikelly/fuep-api:latest
```

### **Logs and Debugging**

```bash
# View API logs
docker compose logs -f api

# View all service logs
docker compose logs -f

# Check API health
curl http://localhost:4000/api/health

# View container logs
docker logs fuep_api

# Export logs
docker logs fuep_api > api-logs.txt
```

### **Container Health Issues**

```bash
# Check container status
docker ps -a

# View health check logs
docker inspect fuep_api | grep -A 10 Health

# Test health endpoint manually
docker exec fuep_api curl -f http://localhost:4000/api/health

# Check container resources
docker stats fuep_api
```

## Deployment Workflow

### **Local Development to Production**

1. **Develop Locally**

   ```bash
   ./scripts/dev.sh start
   # Make changes and test
   ```

2. **Build and Test**

   ```bash
   # Build production image
   docker build -f apps/api/Dockerfile -t fuep-postutme-api .

   # Test locally
   docker run -p 4000:4000 fuep-postutme-api
   ```

3. **Tag and Push**

   ```bash
   # Tag with version
   docker tag fuep-postutme-api sbikelly/fuep-api:v1.0.0
   docker tag fuep-postutme-api sbikelly/fuep-api:latest

   # Push to Docker Hub
   docker push sbikelly/fuep-api:v1.0.0
   docker push sbikelly/fuep-api:latest
   ```

4. **Deploy**
   ```bash
   # Pull and run on production server
   docker pull sbikelly/fuep-api:latest
   docker-compose up -d
   ```

### **Continuous Deployment**

For automated deployment:

```bash
# GitHub Actions workflow
name: Build and Deploy
on:
  push:
    branches: [main]
jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and push
        run: |
          docker build -f apps/api/Dockerfile -t sbikelly/fuep-api:${{ github.sha }} .
          docker push sbikelly/fuep-api:${{ github.sha }}
```

## Support

- **Documentation**: Check the `/docs` directory
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Docker Hub**: https://hub.docker.com/r/sbikelly/fuep-api
- **Docker Support**: Report Docker-related issues via GitHub Issues

---

**Happy coding!**
