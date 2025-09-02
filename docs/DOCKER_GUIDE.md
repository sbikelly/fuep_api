# Docker Guide - FUEP Post-UTME Portal

This comprehensive guide covers all aspects of Docker container management for the FUEP Post-UTME Portal API.

## Table of Contents

1. [Docker Hub Repository](#docker-hub-repository)
2. [Quick Start](#quick-start)
3. [Building Images](#building-images)
4. [Running Containers](#running-containers)
5. [Docker Compose](#docker-compose)
6. [Health Checks](#health-checks)
7. [Networking](#networking)
8. [Volumes](#volumes)
9. [Security](#security)
10. [Monitoring](#monitoring)
11. [Troubleshooting](#troubleshooting)
12. [Deployment Workflows](#deployment-workflows)

## Docker Hub Repository

### **Repository Information**

- **Repository**: https://hub.docker.com/r/sbikelly/fuep-api
- **Username**: sbikelly
- **Image Name**: fuep-api

### **Available Tags**

| Tag       | Description           | Use Case                    |
| --------- | --------------------- | --------------------------- |
| `latest`  | Latest stable version | Production deployment       |
| `v1.0.0`  | Semantic version      | Version-specific deployment |
| `8f9d79f` | Git commit hash       | Specific build tracking     |

### **Pull Commands**

```bash
# Pull latest version
docker pull sbikelly/fuep-api:latest

# Pull specific version
docker pull sbikelly/fuep-api:v1.0.0

# Pull by commit hash
docker pull sbikelly/fuep-api:8f9d79f

# Pull all tags
docker pull sbikelly/fuep-api --all-tags
```

## Quick Start

### **Prerequisites**

```bash
# Install Docker Desktop or Docker Engine
# Verify installation
docker --version
docker-compose --version

# Login to Docker Hub
docker login
```

### **Run with Docker Hub Image**

```bash
# Quick start - run latest version
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

### **Verify Installation**

```bash
# Check if container is running
docker ps

# Test health endpoint
curl http://localhost:4000/api/health

# View container logs
docker logs fuep_api
```

## Building Images

### **Build Commands**

```bash
# Basic build
docker build -f apps/api/Dockerfile -t fuep-postutme-api .

# Build with specific target
docker build -f apps/api/Dockerfile --target runtime -t fuep-postutme-api .

# Build for different architectures
docker buildx build --platform linux/amd64,linux/arm64 -f apps/api/Dockerfile -t fuep-postutme-api .

# Build without cache
docker build --no-cache -f apps/api/Dockerfile -t fuep-postutme-api .

# Build with build arguments
docker build -f apps/api/Dockerfile \
  --build-arg NODE_ENV=production \
  --build-arg PORT=4000 \
  -t fuep-postutme-api .
```

### **Multi-Stage Build**

The Dockerfile uses multi-stage builds for optimization:

```dockerfile
# Base stage
FROM node:20.13.1-alpine AS base

# Dependencies stage
FROM base AS deps
# Install dependencies

# Build stage
FROM deps AS build
# Build application

# Runtime stage
FROM base AS runtime
# Production runtime
```

### **Build Optimization**

```bash
# Use BuildKit for faster builds
export DOCKER_BUILDKIT=1

# Build with parallel processing
docker build --build-arg BUILDKIT_INLINE_CACHE=1 -f apps/api/Dockerfile -t fuep-postutme-api .

# Build and push in one command
docker buildx build --platform linux/amd64 -f apps/api/Dockerfile \
  -t sbikelly/fuep-api:latest \
  --push .
```

## Running Containers

### **Basic Run Commands**

```bash
# Run in foreground
docker run -p 4000:4000 sbikelly/fuep-api:latest

# Run in background
docker run -d -p 4000:4000 --name fuep_api sbikelly/fuep-api:latest

# Run with custom name
docker run -d -p 4000:4000 --name fuep-api-prod sbikelly/fuep-api:latest

# Run with restart policy
docker run -d -p 4000:4000 --restart unless-stopped --name fuep_api sbikelly/fuep-api:latest
```

### **Environment Variables**

```bash
# Run with environment file
docker run -d -p 4000:4000 --env-file .env --name fuep_api sbikelly/fuep-api:latest

# Run with specific environment variables
docker run -d -p 4000:4000 \
  -e NODE_ENV=production \
  -e PORT=4000 \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_USER=fuep \
  -e DB_PASSWORD=fuep \
  -e DB_NAME=fuep_portal \
  --name fuep_api \
  sbikelly/fuep-api:latest
```

### **Port Mapping**

```bash
# Map to different host port
docker run -d -p 8080:4000 --name fuep_api sbikelly/fuep-api:latest

# Map to all interfaces
docker run -d -p 0.0.0.0:4000:4000 --name fuep_api sbikelly/fuep-api:latest

# Map multiple ports
docker run -d -p 4000:4000 -p 4001:4001 --name fuep_api sbikelly/fuep-api:latest
```

## Docker Compose

### **Development Environment**

```bash
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build api

# Scale services
docker-compose up -d --scale api=3
```

### **Production Environment**

```bash
# Start production environment
docker-compose up -d

# Update services
docker-compose pull && docker-compose up -d

# Stop all services
docker-compose down

# Remove volumes
docker-compose down -v
```

### **Docker Compose Commands**

```bash
# View running services
docker-compose ps

# View service logs
docker-compose logs api

# Execute command in container
docker-compose exec api sh

# Restart specific service
docker-compose restart api

# Check service status
docker-compose top
```

## Health Checks

### **Container Health Monitoring**

```bash
# Check container health status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# View health check logs
docker inspect --format='{{json .State.Health}}' fuep_api | jq

# View health check history
docker inspect --format='{{json .State.Health.Log}}' fuep_api | jq

# Test health endpoint manually
docker exec fuep_api curl -f http://localhost:4000/api/health
```

### **Health Check Configuration**

The Dockerfile includes built-in health checks:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1
```

### **Custom Health Checks**

```bash
# Run with custom health check
docker run -d -p 4000:4000 \
  --health-cmd="curl -f http://localhost:4000/api/health || exit 1" \
  --health-interval=30s \
  --health-timeout=3s \
  --health-retries=3 \
  --name fuep_api \
  sbikelly/fuep-api:latest
```

## Networking

### **Default Networking**

```bash
# List networks
docker network ls

# Inspect default bridge network
docker network inspect bridge

# Run container on default network
docker run -d -p 4000:4000 --name fuep_api sbikelly/fuep-api:latest
```

### **Custom Networks**

```bash
# Create custom network
docker network create fuep-network

# Run container on custom network
docker run -d -p 4000:4000 \
  --network fuep-network \
  --name fuep_api \
  sbikelly/fuep-api:latest

# Inspect custom network
docker network inspect fuep-network

# Connect container to network
docker network connect fuep-network fuep_api

# Disconnect container from network
docker network disconnect fuep-network fuep_api
```

### **Network Configuration**

```bash
# Run with specific IP
docker run -d -p 4000:4000 \
  --network fuep-network \
  --ip 172.20.0.10 \
  --name fuep_api \
  sbikelly/fuep-api:latest

# Run with DNS configuration
docker run -d -p 4000:4000 \
  --dns 8.8.8.8 \
  --dns 8.8.4.4 \
  --name fuep_api \
  sbikelly/fuep-api:latest
```

## Volumes

### **Data Persistence**

```bash
# Create named volume
docker volume create fuep-data

# Run with volume
docker run -d -p 4000:4000 \
  -v fuep-data:/app/data \
  --name fuep_api \
  sbikelly/fuep-api:latest

# Run with bind mount
docker run -d -p 4000:4000 \
  -v $(pwd)/data:/app/data \
  --name fuep_api \
  sbikelly/fuep-api:latest
```

### **Volume Management**

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect fuep-data

# Remove volume
docker volume rm fuep-data

# Remove unused volumes
docker volume prune
```

### **Backup and Restore**

```bash
# Backup volume
docker run --rm -v fuep-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/fuep-backup.tar.gz -C /data .

# Restore volume
docker run --rm -v fuep-data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/fuep-backup.tar.gz -C /data
```

## Security

### **Non-Root User**

The container already runs as non-root user:

```bash
# Verify user
docker exec fuep_api whoami

# Run as specific user
docker run -d -p 4000:4000 \
  --user node \
  --name fuep_api \
  sbikelly/fuep-api:latest
```

### **Security Scanning**

```bash
# Scan for vulnerabilities
docker scan sbikelly/fuep-api:latest

# Scan with specific policy
docker scan --policy security-policy.json sbikelly/fuep-api:latest

# Scan and export results
docker scan --json sbikelly/fuep-api:latest > scan-results.json
```

### **Security Options**

```bash
# Run with security options
docker run -d -p 4000:4000 \
  --security-opt=no-new-privileges \
  --cap-drop=ALL \
  --name fuep_api \
  sbikelly/fuep-api:latest

# Run with read-only filesystem
docker run -d -p 4000:4000 \
  --read-only \
  --tmpfs /tmp \
  --name fuep_api \
  sbikelly/fuep-api:latest
```

## Monitoring

### **Container Statistics**

```bash
# View container stats
docker stats fuep_api

# Monitor specific containers
docker stats fuep_api postgres redis

# Monitor with custom format
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# Monitor continuously
docker stats --no-stream
```

### **Resource Usage**

```bash
# Check memory usage
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}"

# Check CPU usage
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}"

# Check network usage
docker stats --no-stream --format "table {{.Container}}\t{{.NetIO}}"
```

### **Log Management**

```bash
# View container logs
docker logs fuep_api

# Follow logs
docker logs -f fuep_api

# View logs with timestamps
docker logs -t fuep_api

# Export logs
docker logs fuep_api > api-logs.txt

# View logs since specific time
docker logs --since="2024-12-01T10:00:00" fuep_api
```

## Troubleshooting

### **Common Issues**

#### **Container Won't Start**

```bash
# Check container status
docker ps -a

# View container logs
docker logs fuep_api

# Check container configuration
docker inspect fuep_api

# Restart container
docker restart fuep_api
```

#### **Port Conflicts**

```bash
# Check what's using the port
lsof -i :4000  # Linux/Mac
netstat -ano | findstr :4000  # Windows

# Change port mapping
docker run -d -p 4001:4000 --name fuep_api sbikelly/fuep-api:latest
```

#### **Network Issues**

```bash
# Check network connectivity
docker exec fuep_api ping google.com

# Check DNS resolution
docker exec fuep_api nslookup google.com

# Inspect network configuration
docker network inspect bridge
```

#### **Resource Issues**

```bash
# Check resource usage
docker stats fuep_api

# Check disk space
docker system df

# Clean up unused resources
docker system prune -a
```

### **Debugging Commands**

```bash
# Execute shell in container
docker exec -it fuep_api sh

# Check container processes
docker exec fuep_api ps aux

# Check container environment
docker exec fuep_api env

# Check container filesystem
docker exec fuep_api ls -la
```

## Deployment Workflows

### **Development to Production**

1. **Local Development**

   ```bash
   # Start development environment
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

   # Make changes and test
   curl http://localhost:4000/api/health
   ```

2. **Build Production Image**

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

```yaml
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

### **Rollback Strategy**

```bash
# Rollback to previous version
docker pull sbikelly/fuep-api:v1.0.0
docker-compose down
docker-compose up -d

# Or rollback to specific commit
docker pull sbikelly/fuep-api:8f9d79f
docker-compose down
docker-compose up -d
```

## Best Practices

### **Image Management**

- Always use specific tags for production
- Keep `latest` tag updated
- Use multi-stage builds for optimization
- Scan images for vulnerabilities
- Regularly update base images

### **Container Management**

- Use restart policies for production
- Implement health checks
- Monitor resource usage
- Use named volumes for data persistence
- Run as non-root user

### **Security**

- Scan images regularly
- Use minimal base images
- Implement proper access controls
- Keep secrets out of images
- Use Docker secrets for sensitive data

### **Monitoring**

- Implement comprehensive logging
- Monitor container health
- Track resource usage
- Set up alerts for issues
- Regular backup of volumes

---

**For more information, visit:**

- [Docker Hub Repository](https://hub.docker.com/r/sbikelly/fuep-api)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
