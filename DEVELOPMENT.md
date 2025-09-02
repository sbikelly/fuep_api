# Development Guide

This guide explains how to set up and use the development environment for the FUEP Post-UTME Portal API.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/sbikelly/fuep_api.git
cd fuep-postutme
```

### 2. Start Development Environment

#### Option A: Using the Development Script (Recommended)

**Linux/Mac:**

```bash
chmod +x scripts/dev.sh
./scripts/dev.sh start
```

**Windows:**

```cmd
scripts\dev.bat start
```

#### Option B: Using Docker Compose Directly

```bash
# Start base services
docker-compose up -d postgres redis mailhog

# Start API in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d api
```

#### Option C: Using npm Scripts

```bash
# Start development environment
npm run docker:dev

# View logs
npm run docker:dev:logs

# Rebuild API
npm run docker:dev:rebuild
```

#### Option D: Using Docker Hub Image (Production)

```bash
# Pull the latest image from Docker Hub
docker pull sbikelly/fuep-api:latest

# Run with Docker Compose
docker-compose up -d

# Or run standalone
docker run -p 4000:4000 sbikelly/fuep-api:latest
```

### 3. Access Services

Once started, you can access:

- **API**: http://localhost:4000
- **API Documentation**: http://localhost:4000/docs
- **Adminer (Database)**: http://localhost:8080
- **Redis Commander**: http://localhost:8081
- **MailHog**: http://localhost:8025
- **MinIO Console**: Removed - documents module no longer exists

## Docker Container Management

### **Docker Hub Integration**

The application is available on Docker Hub at: **https://hub.docker.com/r/sbikelly/fuep-api**

#### **Available Tags**

- `latest` - Latest version (always points to the most recent build)
- `v1.0.0` - Semantic version tag for this release
- `8f9d79f` - Git commit hash tag for specific version tracking

#### **Pull and Run Commands**

```bash
# Pull the latest version
docker pull sbikelly/fuep-api:latest

# Run the container locally
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

## Development Scripts

The development script (`scripts/dev.sh` or `scripts/dev.bat`) provides several commands:

```bash
# Start development environment
./scripts/dev.sh start

# Stop development environment
./scripts/dev.sh stop

# Restart development environment
./scripts/dev.sh restart

# View logs
./scripts/dev.sh logs

# View specific service logs
./scripts/dev.sh logs api

# Rebuild and restart API
./scripts/dev.sh rebuild

# Show status
./scripts/dev.sh status

# Show help
./scripts/dev.sh help
```

## Development Workflow

### 1. Code Changes

The development environment uses volume mounts, so code changes are reflected immediately:

- Source code is mounted from `./apps/api` to `/app/apps/api`
- Types package is mounted from `./packages/types` to `/app/packages/types`
- Documentation is mounted from `./docs` to `/app/docs`

### 2. Rebuilding

When you make changes to dependencies or need to rebuild:

```bash
# Rebuild API container
./scripts/dev.sh rebuild

# Or using npm
npm run docker:dev:rebuild

# Or using Docker directly
docker-compose up -d --build api
```

### 3. Database Changes

Database schema changes require rebuilding the postgres container:

```bash
# Stop services
docker-compose down

# Remove volumes (WARNING: This will delete all data)
docker-compose down -v

# Start fresh
./scripts/dev.sh start
```

### 4. Docker Image Updates

When updating the Docker image:

```bash
# Pull latest image
docker pull sbikelly/fuep-api:latest

# Stop current containers
docker-compose down

# Start with new image
docker-compose up -d

# Or rebuild from source
docker build -f apps/api/Dockerfile -t fuep-postutme-api .
docker-compose up -d
```

## Environment Variables

Development environment variables are set in `docker-compose.dev.yml`:

- `NODE_ENV=development`
- `REMITA_PUBLIC_KEY=test_public_key_123`
- `REMITA_SECRET_KEY=test_secret_key_456`
- `REMITA_WEBHOOK_SECRET=test_webhook_secret_789`
- `REMITA_MERCHANT_ID=2547916`
- `REMITA_BASE_URL=https://remitademo.net`

### **Production Environment Variables**

For production deployment, configure these variables:

```bash
# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name

# JWT Secrets
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Payment Provider
REMITA_PUBLIC_KEY=your-public-key
REMITA_SECRET_KEY=your-secret-key
REMITA_MERCHANT_ID=your-merchant-id
REMITA_BASE_URL=https://remitademo.net

# Email
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
FROM_EMAIL=your-from-email
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

If you get port conflicts:

```bash
# Check what's using the port
lsof -i :4000  # Linux/Mac
netstat -ano | findstr :4000  # Windows

# Stop conflicting services or change ports in docker-compose.dev.yml
```

#### 2. Docker Build Fails

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache api

# Check Dockerfile syntax
docker build --dry-run -f apps/api/Dockerfile .
```

#### 3. Database Connection Issues

```bash
# Check if postgres is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres

# Test database connection
docker-compose exec postgres psql -U fuep -d fuep_portal -c "SELECT version();"
```

#### 4. OpenAPI Specifications Not Loading

The system will automatically try multiple paths and create a fallback specification if needed. Check the logs for details:

```bash
./scripts/dev.sh logs api
```

#### 5. Docker Hub Push Issues

```bash
# Check if logged in
docker login

# Check image tags
docker images | grep fuep-api

# Try pushing with different tag
docker tag fuep-postutme-api sbikelly/fuep-api:test
docker push sbikelly/fuep-api:test
```

#### 6. Container Health Issues

```bash
# Check container status
docker ps -a

# View health check logs
docker inspect fuep_api | grep -A 10 Health

# Test health endpoint manually
docker exec fuep_api curl -f http://localhost:4000/api/health
```

### Reset Everything

If you need to start completely fresh:

```bash
# Stop and remove everything
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v

# Remove all containers and images
docker system prune -a

# Start fresh
./scripts/dev.sh start
```

## Production vs Development

### Development Environment

- Uses `docker-compose.dev.yml` overlay
- Source code mounted as volumes
- Development environment variables
- Hot reloading enabled
- Additional development tools (Adminer, Redis Commander)

### Production Environment

- Uses `docker-compose.yml` only
- Source code copied into container
- Production environment variables
- Optimized for deployment
- Health checks enabled

### Docker Hub Production Image

- Pre-built image available at `sbikelly/fuep-api:latest`
- Optimized for production deployment
- Includes all dependencies and build artifacts
- Ready to run with minimal configuration

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

## Contributing

When contributing to the project:

1. Always test your changes in the development environment
2. Ensure the API builds successfully
3. Verify OpenAPI documentation loads correctly
4. Test database migrations if applicable
5. Update documentation as needed
6. Build and test Docker image before pushing
7. Use semantic versioning for Docker tags

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs: `./scripts/dev.sh logs`
3. Check Docker status: `./scripts/dev.sh status`
4. Verify Docker Hub image: `docker pull sbikelly/fuep-api:latest`
5. Create an issue on GitHub with detailed error information

### **Docker Support Resources**

- **Docker Hub**: https://hub.docker.com/r/sbikelly/fuep-api
- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Container Issues**: Report via GitHub Issues
