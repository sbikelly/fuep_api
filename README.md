# FUEP Post-UTME Portal

A comprehensive Post-UTME application and management system for Federal University of Education, Pankshin (FUEP).

## 🚀 Current Status

### ✅ **Completed Features**

- **Core API Infrastructure** - Express.js with TypeScript, Docker containerization
- **Database Management** - PostgreSQL with Knex.js, comprehensive schema design
- **Authentication & Security** - JWT-based auth with refresh tokens, rate limiting, security headers
- **Payment Integration** - Remita, Flutterwave, and Paystack payment providers with real database integration
- **Document Management** - MinIO integration for file storage
- **Advanced Analytics** - Comprehensive reporting and metrics
- **Audit Logging** - Complete audit trail and security monitoring
- **Email Service** - Automated email notifications with professional templates
- **Advanced Candidate Management** - Progressive registration flow with email integration
- **Academic Structure Management** - Faculty, Department, and Program management system
- **Enhanced Application Validation** - Real-time validation against academic entities
- **Token Management** - Secure logout and token invalidation

### 🔄 **In Progress**

- Frontend web application development
- Mobile application development
- Advanced reporting dashboard

### 📋 **Planned Features**

- SMS notifications
- Advanced document verification
- Integration with external systems

## 🏗️ Architecture Overview

### **System Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend Web  │    │   Mobile App   │    │   Admin Panel   │
│   (React/Vue)   │    │   (React Native)│    │   (React)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │   (Nginx)       │
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
│   PostgreSQL    │    │     Redis       │    │     MinIO       │
│   Database      │    │   Cache/Queue   │    │   File Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Technology Stack**

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Knex.js ORM
- **Cache**: Redis for session management and caching
- **File Storage**: MinIO for document management
- **Containerization**: Docker & Docker Compose
- **Email**: Nodemailer with MailHog (dev) / SMTP (prod)
- **Security**: JWT with refresh tokens, bcrypt, helmet, rate limiting
- **Monitoring**: Winston logging, metrics collection
- **Validation**: Zod schemas for type-safe API requests

## 🎓 **Academic Structure Management**

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

## 🔐 **Enhanced Security Features**

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

## 💳 **Enhanced Payment System**

### **Payment Providers**

- **Remita**: Primary payment gateway with comprehensive integration
- **Flutterwave**: Secondary payment option for additional flexibility
- **Paystack**: Alternative payment gateway support
- **Mock Provider**: Development and testing support

### **Payment Features**

- **Real Database Integration**: All payment data stored in PostgreSQL with proper relationships
- **Transaction Tracking**: Comprehensive payment history, status, and audit trail
- **Idempotency**: Prevents duplicate payment processing
- **Webhook Support**: Real-time payment status updates from providers
- **Payment Types**: Dynamic payment type management per academic session
- **Receipt Management**: Digital receipt generation and storage
- **Multi-Currency Support**: Flexible currency handling
- **Payment Statistics**: Comprehensive analytics and reporting

## 📊 **Candidate Registration Flow**

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
5. **Document Upload** - Required certificates and identification

### **Phase 4: Registration Finalization**

1. **Profile Validation** - Verify all required information
2. **Application Submission** - Submit completed application with academic validation
3. **Confirmation Email** - Send registration completion notification
4. **Status Tracking** - Monitor application review process

## 📧 **Email Service**

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

## 🗄️ **Database Schema**

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

## 🚀 **Getting Started**

### **Prerequisites**

- Docker and Docker Compose
- Node.js 18+ and pnpm
- Git

### **Quick Start**

```bash
# Clone the repository
git clone https://github.com/sbikelly/fuep-postutme.git
cd fuep-postutme

# Start all services
docker compose up -d

# Access the application
# API: http://localhost:4000
# Web UI: http://localhost:5173
# Admin Panel: http://localhost:5173/admin
# MailHog: http://localhost:8025
```

### **Environment Configuration**

```bash
# Copy environment template
cp .env.example .env

# Configure your environment variables
# Database, payment providers, email settings, etc.
```

## 📚 **API Documentation**

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
- **Documents**: `POST /api/documents/upload`

### **OpenAPI Documentation**

- **Swagger UI**: `http://localhost:4000/docs`
- **OpenAPI Spec**: `http://localhost:4000/api/openapi.json`

## 🧪 **Testing**

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

### **Email Testing**

- Access MailHog at `http://localhost:8025`
- View all sent emails in development
- Test email templates and delivery

## 📈 **Monitoring & Analytics**

### **Performance Metrics**

- HTTP request/response times
- Database query performance
- Cache hit/miss ratios
- System resource utilization

### **Business Analytics**

- Application statistics
- Payment analytics
- Candidate demographics
- Document processing metrics
- Academic structure analytics

### **Security Monitoring**

- Failed authentication attempts
- Suspicious API usage
- Data access patterns
- Security event logging

## 🤝 **Contributing**

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

### **Code Standards**

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits
- Comprehensive testing

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

### **Contact Information**

- **Email**: admissions@fuep.edu.ng
- **Technical Support**: tech-support@fuep.edu.ng
- **Documentation**: [docs/](docs/)

### **Issue Reporting**

- GitHub Issues: [Report a Bug](https://github.com/sbikelly/fuep-postutme/issues)
- Feature Requests: [Request Feature](https://github.com/sbikelly/fuep-postutme/issues/new)

---

**Built with ❤️ for Federal University of Education, Pankshin**

_Last updated: August 2025_
