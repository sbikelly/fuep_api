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
docker-compose up -d postgres redis minio mailhog

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

### 3. Access Services

Once started, you can access:

- **API**: http://localhost:4000
- **API Documentation**: http://localhost:4000/docs
- **Adminer (Database)**: http://localhost:8080
- **Redis Commander**: http://localhost:8081
- **MailHog**: http://localhost:8025
- **MinIO Console**: http://localhost:9001

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

## Environment Variables

Development environment variables are set in `docker-compose.dev.yml`:

- `NODE_ENV=development`
- `REMITA_PUBLIC_KEY=test_public_key_123`
- `REMITA_SECRET_KEY=test_secret_key_456`
- `REMITA_WEBHOOK_SECRET=test_webhook_secret_789`
- `REMITA_MERCHANT_ID=2547916`
- `REMITA_BASE_URL=https://remitademo.net`

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
```

#### 3. Database Connection Issues

```bash
# Check if postgres is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Restart postgres
docker-compose restart postgres
```

#### 4. OpenAPI Specifications Not Loading

The system will automatically try multiple paths and create a fallback specification if needed. Check the logs for details:

```bash
./scripts/dev.sh logs api
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

## Contributing

When contributing to the project:

1. Always test your changes in the development environment
2. Ensure the API builds successfully
3. Verify OpenAPI documentation loads correctly
4. Test database migrations if applicable
5. Update documentation as needed

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs: `./scripts/dev.sh logs`
3. Check Docker status: `./scripts/dev.sh status`
4. Create an issue on GitHub with detailed error information
