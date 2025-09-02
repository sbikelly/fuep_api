# FUEP Post-UTME Portal

A comprehensive Post-UTME application and management system for Federal University of Education, Pankshin (FUEP).

## Current Status

### Completed Features

- **Core API Infrastructure** - Express.js with TypeScript, Docker containerization
- **Database Management** - PostgreSQL with Knex.js, simplified and optimized schema design
- **Authentication & Security** - JWT-based auth with refresh tokens, rate limiting, security headers
- **Payment Integration** - Remita payment provider with simplified payment purpose management
- **Candidate Management** - Comprehensive candidate registration and management
- **Advanced Analytics** - Comprehensive reporting and metrics
- **Audit Logging** - Complete audit trail and security monitoring
- **Email Service** - Automated email notifications with professional templates
- **Simplified Candidate Management** - Progressive registration flow with streamlined data model
- **Academic Structure Management** - Faculty, Department, and Program management system
- **Enhanced Application Validation** - Real-time validation against academic entities
- **Token Management** - Secure logout and token invalidation
- **Cloud Deployment** - Production deployment on Render.com using Docker containers
- **Admin Module Integration** - Simplified admin-candidate operations with clean interfaces
- **Docker Hub Integration** - Containerized application available on Docker Hub

### 🚀 **In Progress**

- Advanced reporting dashboard
- Enhanced admin management features

### Planned Features

- SMS notifications
- Advanced candidate verification
- Integration with external systems

## Architecture Overview

### **System Architecture**

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │   (Render.com)  │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Core API      │
                    │   (Node.js)     │
                    └─────────────────┘
                                 │
         ┌─────────────────────────────────────────┐
         │                                         │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │    │     MailHog      │
│   Database      │    │   Cache/Queue   │    │   File Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Technology Stack**

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Knex.js ORM
- **Cache**: Redis for session management and caching
- **Email Service**: MailHog for development email testing
- **Containerization**: Docker & Docker Compose for local development and production deployment
- **Hosting**: Render.com for managed cloud deployment with Docker containers
- **Email**: Nodemailer with MailHog (dev) / SMTP (prod)
- **Security**: JWT with refresh tokens, bcrypt, helmet, rate limiting
- **Monitoring**: Winston logging, metrics collection
- **Validation**: Zod schemas for type-safe API requests

## Docker Container Management

### **Docker Hub Repository**

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

## Simplified Candidate System

### **Key Improvements**

- **Eliminated Complexity**: Removed 35+ redundant fields and complex interfaces
- **Progressive Registration**: Multi-phase registration flow with clear progress tracking
- **Unified Data Model**: Single source of truth for candidate information
- **Better Performance**: Optimized database schema with proper indexing
- **Cleaner Code**: Simplified operations and easier maintenance

### **Registration Flow**

1. **JAMB Verification**: Check JAMB registration and initiate registration
2. **Contact Information**: Complete basic contact details
3. **Biodata**: Personal information and demographics
4. **Education**: Academic background and qualifications
5. **Next of Kin**: Emergency contact information
6. **Sponsor**: Financial sponsor details
7. **Application Submission**: Final application review and submission

### **Database Schema**

- **candidates**: Core profile with progress flags
- **applications**: Application lifecycle and payment status
- **education_records**: Educational background (UTME/DE)
- **next_of_kin**: Emergency contacts
- **sponsors**: Financial sponsors
- **candidates**: Candidate registration and management

## Academic Structure Management

### **Academic Entities**

- **Faculties**: Top-level academic divisions (e.g., Faculty of Education, Faculty of Science)
- **Departments**: Academic units within faculties (e.g., Computer Science, Mathematics)
- **Programs**: Specific degree programs and courses
- **Program-Department Links**: Flexible many-to-many relationships between programs and departments

### **Management Features**

- **CRUD Operations**: Full create, read, update, delete capabilities for all academic entities
- **Validation System**: Ensures data integrity and prevents invalid relationships
- **Active/Inactive Status**: Soft management of academic entities
- **Relationship Management**: Flexible linking of programs to departments
- **Admin Interface**: Comprehensive admin panel for academic structure management

## Enhanced Security Features

### **Authentication & Authorization**

- **JWT Authentication**: Secure token-based authentication with access and refresh tokens
- **Token Refresh**: Automatic token renewal mechanism for seamless user experience
- **Secure Logout**: Token invalidation and session cleanup
- **Role-Based Access Control**: Admin, Candidate, and Staff role management
- **Password Security**: bcrypt hashing with configurable salt rounds
- **Session Management**: Redis-based session management

### **Data Protection**

- **Input Validation**: Comprehensive request validation using Zod schemas
- **SQL Injection Prevention**: Parameterized queries with Knex.js
- **XSS Protection**: Security headers and content sanitization
- **CORS Configuration**: Controlled cross-origin resource sharing
- **Data Encryption**: Encryption for sensitive information

### **API Security**

- **Request Rate Limiting**: Protection against abuse and brute force attacks
- **API Key Validation**: Secure API access control
- **Request Logging**: Comprehensive request monitoring and logging
- **Suspicious Activity Detection**: Security event monitoring
- **Audit Logging**: Complete audit trail for compliance

## Enhanced Payment System

### **Payment Providers**

- **Remita**: Primary payment gateway with comprehensive integration

### **Payment Features**

- **Real Database Integration**: All payment data stored in PostgreSQL with proper relationships
- **Transaction Tracking**: Comprehensive payment history, status, and audit trail
- **Idempotency**: Prevents duplicate payment processing
- **Webhook Support**: Real-time payment status updates from providers
- **Payment Types**: Dynamic payment type management per academic session
- **Receipt Management**: Digital receipt generation and storage
- **Multi-Currency Support**: Flexible currency handling
- **Payment Statistics**: Comprehensive analytics and reporting

## Candidate Registration Flow

### **Phase 1: JAMB Verification & Account Creation**

1. **JAMB Number Verification** - Validate JAMB registration number
2. **Account Creation** - Generate temporary account with secure credentials
3. **Email Notification** - Send temporary password email to candidate
4. **Database Setup** - Initialize candidate and profile records

### **Phase 2: Payment & Authentication**

1. **Post-UTME Payment** - Complete required payment for application
2. **Account Activation** - Enable full access to portal features
3. **Password Management** - Enforce password change on first login
4. **Session Management** - Establish secure user sessions with JWT tokens

### **Phase 3: Progressive Profile Completion**

1. **Biodata Completion** - Personal information and contact details
2. **Educational Background** - Academic history and qualifications
3. **Next of Kin Information** - Emergency contact and guardian details
4. **Sponsor Information** - Financial sponsor and payment details
5. **Profile Completion** - Required personal and academic information

### **Phase 4: Registration Finalization**

1. **Profile Validation** - Verify all required information
2. **Application Submission** - Submit completed application with academic validation
3. **Confirmation Email** - Send registration completion notification
4. **Status Tracking** - Monitor application review process

## Email Service

### **Email Templates**

- **Temporary Password** - Secure login credentials with security notices
- **Registration Completion** - Confirmation of successful registration
- **Payment Confirmation** - Payment receipt and next steps
- **Status Updates** - Application progress notifications

### **Email Features**

- Professional HTML and plain text templates
- Branded with FUEP colors and logo
- Responsive design for mobile devices
- Automated sending with error handling
- Development testing with MailHog

## Database Schema

### **Core Tables**

- `candidates` - Candidate account information
- `profiles` - Detailed candidate profiles
- `applications` - Application records and status
- `payments` - Payment transactions and history
- `documents` - File uploads and metadata
- `audit_logs` - Comprehensive audit trail

### **Academic Tables**

- `faculties` - Academic faculty information
- `departments` - Department details within faculties
- `programs` - Academic program information
- `program_departments` - Program-department relationships

### **Key Features**

- UUID primary keys for security
- Proper foreign key relationships
- Indexed fields for performance
- Enum types for status management
- Timestamp tracking for all records
- Academic hierarchy management

## Getting Started

### **Prerequisites**

- Docker and Docker Compose
- Node.js 18+ and pnpm
- Git

### **Quick Start**

```bash
# Clone the repository
git clone https://github.com/sbikelly/fuep_api.git
cd fuep-postutme

# Start all services
docker compose up -d

# Access the application
# API: http://localhost:4000
# MailHog: http://localhost:8025
```

### **Using Docker Hub Image**

```bash
# Pull and run the latest version
docker run -p 4000:4000 sbikelly/fuep-api:latest

# Or use Docker Compose with the image
docker-compose up -d
```

### **Production Deployment**

The application is automatically deployed to production on Render.com using Docker containers:

#### **API Service (fuep-api)**

- **Service Type**: Web service with Docker deployment
- **Plan**: Free tier with automatic scaling
- **Dockerfile**: `./apps/api/Dockerfile`
- **Health Check**: `/api/health` endpoint
- **Auto-deploy**: Enabled for continuous deployment from main branch
- **URL**: https://fuep-api.onrender.com

#### **Database Service (fuep-postgres)**

- **Name**: `fuep_postgres`
- **Database**: `fuep_portal`
- **User**: `fuep_user`
- **Plan**: Free tier managed PostgreSQL
- **Connection**: Automatically managed via `DATABASE_URL` environment variable

#### **External Services**

- **Redis**: External Redis service via `REDIS_URL` environment variable
- **MinIO**: External MinIO service for file storage
- **Email**: External SMTP service for production emails

#### **Deployment Features**

- **Container Management**: Docker-based deployment with automatic scaling
- **SSL/TLS**: Automatic HTTPS certificate management
- **Scaling**: Automatic horizontal scaling of Docker containers based on load
- **Environment Variables**: Secure configuration with automatic secret generation
- **Health Monitoring**: Built-in health checks and monitoring

### **Environment Configuration**

```bash
# Copy environment template
cp .env.example .env

# Configure your environment variables
# Database, payment providers, email settings, etc.
```

### **Render.com Configuration**

The production deployment is configured via `render.yaml` in the root directory:

```yaml
services:
  - type: web
    name: fuep-api
    env: docker
    plan: free
    dockerfilePath: ./apps/api/Dockerfile
    dockerContext: .
    healthCheckPath: /api/health
    autoDeploy: true

databases:
  - name: fuep-postgres
    databaseName: fuep_portal
    user: fuep_user
    plan: free
```

**Key Configuration Points:**

- **Docker Deployment**: Uses `./apps/api/Dockerfile` for containerization
- **Health Checks**: Monitors `/api/health` endpoint for service health
- **Auto-deploy**: Automatically deploys from main branch
- **Free Tier**: Cost-effective deployment with managed PostgreSQL
- **Environment Variables**: Automatically configured from Render.com dashboard

## API Documentation

### **Available Endpoints**

- **Health Check**: `GET /api/health`
- **Authentication**:
  - `POST /api/auth/login` - User login
  - `POST /api/auth/refresh-token` - Token refresh
  - `POST /api/auth/logout` - Secure logout
  - `PUT /api/auth/change-password` - Password change
- **Candidates**: `POST /api/candidates/check-jamb`
- **Payments**: `POST /api/payments/initiate`
- **Admin Academic Management**:
  - `GET /api/admin/faculties` - List faculties
  - `POST /api/admin/faculties` - Create faculty
  - `GET /api/admin/departments` - List departments
  - `POST /api/admin/departments` - Create department
  - `GET /api/admin/programs` - List programs
  - `POST /api/admin/programs` - Create program
- **Candidates**: `POST /api/candidates/register`

### **OpenAPI Documentation**

- **Swagger UI**: `http://localhost:4000/docs`
- **OpenAPI Spec**: `http://localhost:4000/api/openapi.json`

## Testing

### **API Testing**

```bash
# Test health endpoint
curl http://localhost:4000/api/health

# Test candidate registration
curl -X POST http://localhost:4000/api/candidates/check-jamb \
  -H "Content-Type: application/json" \
  -d '{"jambRegNo":"JAMB123","email":"test@example.com","phone":"+2341234567890"}'

# Test authentication
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"JAMB123","password":"temp123"}'
```

### **Docker Testing**

```bash
# Test container health
docker exec fuep_api curl -f http://localhost:4000/api/health

# Test container logs
docker logs fuep_api

# Test container performance
docker stats fuep_api
```

### **Email Testing**

- Access MailHog at `http://localhost:8025`
- View all sent emails in development
- Test email templates and delivery

## Monitoring & Analytics

### **Performance Metrics**

- HTTP request/response times
- Database query performance
- Cache hit/miss ratios
- System resource utilization

### **Business Analytics**

- Application statistics
- Payment analytics
- Candidate demographics
- Candidate processing metrics
- Academic structure analytics

### **Security Monitoring**

- Failed authentication attempts
- Suspicious API usage
- Data access patterns
- Security event logging

## Contributing

### **Development Setup**

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

### **Docker Development**

```bash
# Start development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f api

# Rebuild container
docker-compose up -d --build api

# Stop services
docker-compose down
```

### **Code Standards**

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits
- Comprehensive testing

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

### **Contact Information**

- **Email**: admissions@fuep.edu.ng
- **Technical Support**: tech-support@fuep.edu.ng
- **Documentation**: [docs/](docs/)

### **Issue Reporting**

- GitHub Issues: [Report a Bug](https://github.com/sbikelly/fuep_api/issues)
- Feature Requests: [Request Feature](https://github.com/sbikelly/fuep_api/issues/new)

### **Docker Support**

- **Docker Hub**: https://hub.docker.com/r/sbikelly/fuep-api
- **Container Issues**: Report Docker-related issues via GitHub Issues
- **Deployment Help**: Check the [DEVELOPMENT.md](DEVELOPMENT.md) for detailed Docker instructions

---

**Built with dedication for Federal University of Education, Pankshin**

_Last updated: December 2024_
