# FUEP Post-UTME Portal

A comprehensive, modern **API-only** portal designed to streamline the Post-UTME application process for Federal University of Education, Pankshin (FUEP). This system provides a complete digital solution for candidate registration, payment processing, and administrative management.

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Server    │    │   PostgreSQL    │    │     MinIO       │
│   (Express.js)  │◄──►│   Database      │    │   File Storage  │
│   Port: 4000    │    │   Port: 5432    │    │   Port: 9000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Redis Cache   │    │   MailHog       │    │   Render.com    │
│   Port: 6379    │    │   Port: 1025    │    │   Production    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 **Key Features**

### **Core Functionality**

- **Candidate Registration**: JAMB verification and profile creation
- **Payment Processing**: Multi-provider payment gateway integration
- **Document Management**: Secure file upload and storage
- **Admin Dashboard**: Comprehensive administrative tools
- **Real-time Notifications**: Email and SMS integration

### **Payment Integration**

- **Remita**: Nigerian payment gateway
- **Flutterwave**: International payment processing
- **Webhook Support**: Real-time payment status updates from providers
- **Multi-currency Support**: NGN, USD, EUR, GBP

### **Security & Compliance**

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin, candidate, and system roles
- **Data Encryption**: End-to-end encryption for sensitive data
- **Audit Logging**: Comprehensive action tracking
- **Rate Limiting**: DDoS protection and abuse prevention

## 🛠️ **Technology Stack**

### **Backend**

- **Runtime**: Node.js 20.13.1 LTS
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL 16 with Knex.js ORM
- **Cache**: Redis 7
- **File Storage**: MinIO (S3-compatible)
- **Authentication**: JWT with refresh tokens

### **Development Tools**

- **Package Manager**: pnpm 10.14.0
- **Build Tool**: TypeScript 5.5.4
- **Linting**: ESLint 9.8.0
- **Formatting**: Prettier 3.3.3
- **Containerization**: Docker & Docker Compose

## 📁 **Project Structure**

```
fuep-postutme/
├── apps/
│   └── api/                 # Express.js API server
│       ├── src/
│       │   ├── modules/     # Feature modules (admin, candidates, payments)
│       │   ├── middleware/  # Express middleware
│       │   ├── services/    # Business logic services
│       │   └── db/          # Database configuration
│       └── Dockerfile       # Production container
├── packages/
│   └── types/               # Shared TypeScript types
├── infra/
│   └── db/                  # Database migrations and schemas
├── docs/                    # API documentation
├── docker-compose.yml       # Local development stack
└── render.yaml              # Render.com deployment blueprint
```

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js 20.13.1+
- pnpm 10.14.0+
- Docker & Docker Compose
- PostgreSQL 16

### **Local Development**

1. **Clone and Setup**

   ```bash
   git clone https://github.com/sbikelly/fuep-postutme.git
   cd fuep-postutme
   pnpm install
   ```

2. **Environment Configuration**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Services**

   ```bash
   # Start all services (API, PostgreSQL, Redis, MinIO, MailHog)
   pnpm docker:up

   # Or start API only
   pnpm dev:api
   ```

4. **Access Services**
   - **API**: http://localhost:4000
   - **API Health**: http://localhost:4000/api/health
   - **API Docs**: http://localhost:4000/docs
   - **PostgreSQL**: localhost:5432
   - **Redis**: localhost:6379
   - **MinIO**: localhost:9000
   - **MailHog**: localhost:1025 (SMTP), localhost:8025 (Web UI)

### **Production Deployment**

The project includes a `render.yaml` blueprint for automated deployment to Render.com:

1. **Connect Repository**: Link your GitHub repository to Render
2. **Auto-deploy**: Render will automatically detect the blueprint
3. **Environment Variables**: Configure required environment variables
4. **Database**: Managed PostgreSQL database included

## 📚 **API Documentation**

### **Core Endpoints**

- **Health Check**: `GET /api/health`
- **Authentication**: `POST /api/admin/auth/login`
- **Payment Purposes**: `GET /api/admin/payment-purposes`
- **Candidates**: `GET /api/candidates`
- **Payments**: `POST /api/payments/init`

### **OpenAPI Specification**

- **Swagger UI**: `/docs`
- **OpenAPI JSON**: `/openapi.json`
- **YAML Spec**: `docs/openapi.yaml`

## 🔧 **Development Commands**

```bash
# Build all packages
pnpm build

# Start API development server
pnpm dev:api

# Run tests
pnpm test

# Clean build artifacts
pnpm clean

# Docker operations
pnpm docker:up      # Start services
pnpm docker:down    # Stop services
pnpm docker:logs    # View logs
pnpm docker:ps      # Service status
```

## 📊 **Database Schema**

### **Core Tables**

- **candidates**: Candidate registration and profiles
- **payment_purposes**: Configurable payment types and amounts
- **payments**: Payment transaction records
- **admin_users**: Administrative user accounts
- **documents**: File upload management
- **audit_logs**: Comprehensive action tracking

### **Key Relationships**

- Candidates have multiple payment records
- Payment purposes define fee structures by session
- Documents are linked to candidates and payment purposes
- All actions are logged in audit tables

## 🔒 **Security Features**

- **CORS Configuration**: Configurable cross-origin policies
- **Rate Limiting**: Per-endpoint and global rate limiting
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Parameterized queries with Knex.js
- **XSS Protection**: Helmet.js security headers
- **CSRF Protection**: Token-based CSRF prevention

## 🚀 **Performance Optimizations**

- **Database Indexing**: Optimized queries with proper indexes
- **Caching Strategy**: Redis-based caching for frequently accessed data
- **Connection Pooling**: Efficient database connection management
- **Async Processing**: Non-blocking I/O operations
- **Compression**: Response compression for large payloads

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### **Development Guidelines**

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation for new features
- Follow conventional commit format
- Ensure all tests pass before submitting

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Documentation**: Check the `/docs` directory
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the development team

## 🎯 **Roadmap**

### **Phase 1: Core API** ✅

- [x] Basic API structure and authentication
- [x] Candidate registration and management
- [x] Payment processing integration
- [x] Admin dashboard functionality

### **Phase 2: Enhanced Features** 🚧

- [ ] Advanced payment analytics
- [ ] Bulk operations and data import
- [ ] Enhanced security features
- [ ] Performance optimizations

### **Phase 3: Production Ready** 📋

- [ ] Comprehensive testing suite
- [ ] Monitoring and alerting
- [ ] CI/CD pipeline optimization
- [ ] Production deployment automation

---

**Built with ❤️ for FUEP by the Development Team**
