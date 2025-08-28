# FUEP Post-UTME Portal - System Architecture

## System Overview

The FUEP Post-UTME Portal is a comprehensive, microservices-based application designed to handle the complete Post-UTME application lifecycle. The system has been significantly simplified and optimized, eliminating unnecessary complexity while maintaining full functionality. Built with modern web technologies, emphasizing security, scalability, user experience, and maintainability.

## Architecture Principles

### **Core Design Principles**

- **Security First**: Comprehensive security measures at every layer
- **Scalability**: Horizontal scaling capabilities with load balancing
- **Maintainability**: Clean code architecture with clear separation of concerns
- **Performance**: Optimized database queries and caching strategies
- **Reliability**: Fault tolerance and error handling throughout the system
- **Observability**: Comprehensive logging, monitoring, and analytics

### **Technology Choices**

- **Backend**: Node.js with Express.js for API development
- **Language**: TypeScript for type safety and developer experience
- **Database**: PostgreSQL for relational data with ACID compliance
- **Cache**: Redis for session management and performance optimization
- **Containerization**: Docker for consistent deployment environments
- **Email**: Nodemailer with configurable SMTP providers

### **Simplified Architecture Benefits**

- **Reduced Complexity**: Eliminated 35+ redundant fields and complex interfaces
- **Better Performance**: Optimized database schema with proper indexing
- **Improved Maintainability**: Cleaner code and easier debugging
- **Enhanced Scalability**: Streamlined data operations and reduced overhead
- **Future-Proof Design**: Easy to extend and modify without breaking existing functionality

## System Architecture

### **High-Level Architecture**

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │   (Render.com)  │
                    └─────────────────┘
                                │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │   (Express.js)  │
                    └─────────────────┘
                                │
         ┌─────────────────────────────────────────────────┐
         │              Service Layer                      │
         ├─────────────────────────────────────────────────┤
         │  Auth  │  Candidates  │  Payments  │  Admin     │
         │  Service│  Service    │  Service   │  Service   │
         └─────────────────────────────────────────────────┘
                                │
         ┌─────────────────────────────────────────────────┐
         │              Infrastructure Layer               │
         ├─────────────────────────────────────────────────┤
         │  PostgreSQL  │  Redis  │  MinIO   │  Email     │
         │  Database    │  Cache  │  Storage │  Service   │
         └─────────────────────────────────────────────────┘
```

### **Service Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  Authentication  │  Rate Limiting  │  Security Headers        │
│  Middleware      │  Middleware     │  Middleware              │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌─────────────────┐
                    │   Router Layer  │
                    │   (Express.js)  │
                    └─────────────────┘
                                │
         ┌─────────────────────────────────────────────────┐
         │              Controller Layer                   │
         ├─────────────────────────────────────────────────┤
         │  Auth Ctrl  │  Candidate Ctrl │  Payment Ctrl │  Admin Ctrl │
         │             │                 │               │             │
         └─────────────────────────────────────────────────┘
                                │
         ┌─────────────────────────────────────────────────┐
         │              Service Layer                      │
         ├─────────────────────────────────────────────────┤
         │  Auth Svc   │  Candidate Svc │  Payment Svc  │  Admin Svc  │
         │             │                 │               │             │
         └─────────────────────────────────────────────────┘
                                │
                    ┌─────────────────┐
                    │   Data Layer    │
                    │   (Knex.js)     │
                    └─────────────────┘
```

## Simplified Candidate System Architecture

### **System Design Principles**

The candidate system has been completely refactored to eliminate unnecessary complexity while maintaining full functionality:

- **Unified Data Model**: Single source of truth for candidate information
- **Progressive Registration**: Multi-phase flow with clear progress tracking
- **Streamlined Database**: Optimized schema with proper relationships
- **Clean Interfaces**: Simplified TypeScript interfaces and validation schemas

### **Database Schema Design**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Candidate Core                              │
├─────────────────────────────────────────────────────────────────┤
│  candidates: Core profile with progress flags                  │
│  applications: Application lifecycle and payment status        │
│  education_records: Educational background (UTME/DE)           │
│  next_of_kin: Emergency contacts                              │
│  sponsors: Financial sponsors                                  │
│  uploads: Document management                                  │
└─────────────────────────────────────────────────────────────────┘
```

### **Registration Flow Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   JAMB Check    │ -> │ Contact Info    │ -> │   Biodata       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Education     │ -> │   Next of Kin   │ -> │    Sponsor      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │ -> │   Payment       │ -> │   Submission    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Admin Integration**

The admin module has been fully integrated with the simplified candidate system:

- **Unified Operations**: Single interface for all candidate management
- **Simplified Queries**: Clean database operations with proper indexing
- **Progress Tracking**: Real-time monitoring of registration completion
- **Analytics**: Comprehensive reporting on candidate progress

## Security Architecture

### **Authentication & Authorization**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  JWT Tokens  │  Role-Based Access │  Session Management       │
│               │  Control (RBAC)   │                           │
└─────────────────────────────────────────────────────────────────┘
                                │
         ┌─────────────────────────────────────────────────┐
         │              Protection Layer                   │
         ├─────────────────────────────────────────────────┤
         │  Rate Limiting │  Input Validation │  SQL Injection │
         │                │                  │  Prevention     │
         └─────────────────────────────────────────────────┘
                                │
                    ┌─────────────────┐
                    │   Data Security │
                    │   (Encryption)  │
                    └─────────────────┘
```

### **Security Features**

- **JWT Authentication**: Secure token-based authentication with access and refresh tokens
- **Password Security**: bcrypt hashing with configurable salt rounds
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive request validation and sanitization using Zod schemas
- **SQL Injection Prevention**: Parameterized queries with Knex.js
- **XSS Protection**: Security headers and content sanitization
- **CORS Configuration**: Controlled cross-origin resource sharing
- **Token Refresh**: Secure token renewal mechanism
- **Logout Security**: Token invalidation and session cleanup

## Data Architecture

### **Database Design**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Core Entities                                │
├─────────────────────────────────────────────────────────────────┤
│  candidates  │  profiles    │  applications │  payments       │
│  (accounts)  │  (details)   │  (status)     │  (transactions) │
└─────────────────────────────────────────────────────────────────┘
                                │
         ┌─────────────────────────────────────────────────┐
         │              Academic Structure                  │
         ├─────────────────────────────────────────────────┤
         │  faculties   │  departments │  programs        │  program_departments │
         │  (schools)   │  (divisions) │  (courses)       │  (relationships)     │
         └─────────────────────────────────────────────────┘
                                │
         ┌─────────────────────────────────────────────────┐
         │              Supporting Entities                 │
         ├─────────────────────────────────────────────────┤
         │  documents  │  audit_logs │  email_logs │  users    │
         │  (files)    │  (tracking) │  (notifications) │ (admin) │
         └─────────────────────────────────────────────────┘
```

### **Key Database Features**

- **UUID Primary Keys**: Enhanced security and scalability
- **Proper Indexing**: Optimized query performance
- **Foreign Key Constraints**: Data integrity and referential integrity
- **Enum Types**: Structured status and type management
- **Timestamp Tracking**: Comprehensive audit trail
- **Soft Deletes**: Data preservation and recovery capabilities
- **Academic Hierarchy**: Structured faculty → department → program relationships
- **Many-to-Many Relationships**: Flexible program-department associations

## Academic Structure Management

### **Academic Entity Relationships**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Faculties     │    │   Departments   │    │    Programs     │
│   (Schools)     │    │   (Divisions)   │    │   (Courses)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Program-Department │
                    │   Junction Table   │
                    └─────────────────┘
```

### **Academic Management Features**

- **Faculty Management**: Create, read, update, delete faculty records
- **Department Management**: Manage departments within faculties
- **Program Management**: Handle academic programs and courses
- **Relationship Management**: Link programs to departments with flexible associations
- **Validation System**: Ensure data integrity across academic entities
- **Active/Inactive Status**: Soft management of academic entities

## Payment System Architecture

### **Payment Provider Integration**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Payment Gateway Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  Remita        │
│  (Primary)     │  (Secondary)   │  (Secondary)   │  (Testing)  │
└─────────────────────────────────────────────────────────────────┘
                                │
         ┌─────────────────────────────────────────────────┐
         │              Payment Service Layer               │
         ├─────────────────────────────────────────────────┤
         │  Payment      │  Provider      │  Transaction   │
         │  Initiation   │  Management    │  Processing    │
         └─────────────────────────────────────────────────┘
                                │
                    ┌─────────────────┐
                    │   Database      │
                    │   Integration   │
                    └─────────────────┘
```

### **Payment Features**

- **Remita Integration**: Comprehensive payment gateway integration
- **Real Database Integration**: All payment data stored in PostgreSQL
- **Transaction Tracking**: Comprehensive payment history and status
- **Idempotency**: Prevents duplicate payment processing
- **Webhook Support**: Real-time payment status updates
- **Payment Types**: Dynamic payment type management per session
- **Receipt Management**: Digital receipt generation and storage

## Email Service Architecture

### **Email Service Design**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Email Service Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  Email Service  │  Template Engine │  Transport Layer         │
│  (Core Logic)   │  (HTML/Text)    │  (SMTP/Nodemailer)       │
└─────────────────────────────────────────────────────────────────┘
                                │
         ┌─────────────────────────────────────────────────┐
         │              Email Templates                     │
         ├─────────────────────────────────────────────────┤
         │  Temporary    │  Registration │  Payment       │
         │  Password     │  Completion   │  Confirmation  │
         └─────────────────────────────────────────────────┘
                                │
                    ┌─────────────────┐
                    │   Email Storage │
                    │   (MailHog/DB) │
                    └─────────────────┘
```

### **Email Features**

- **Professional Templates**: Branded HTML and plain text emails
- **Dynamic Content**: Personalized email content generation
- **Error Handling**: Comprehensive error logging and retry mechanisms
- **Development Support**: MailHog integration for testing
- **Production Ready**: Configurable SMTP providers
- **Template Management**: Centralized email template system

## Candidate Registration Flow

### **Phase 1: JAMB Verification & Account Creation**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   JAMB Number   │───▶│  Verification   │───▶│  Account        │
│   Input         │    │  Service        │    │  Creation       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
         ┌─────────────────────────────────────────────────┐
         │              Email Notification                 │
         ├─────────────────────────────────────────────────┤
         │  Generate     │  Send Email    │  Log Activity   │
         │  Temp Password│  with Creds    │                 │
         └─────────────────────────────────────────────────┘
```

### **Phase 2: Payment & Authentication**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Payment       │───▶│  Payment        │───▶│  Account        │
│   Initiation    │    │  Processing     │    │  Activation     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
         ┌─────────────────────────────────────────────────┐
         │              Security Setup                     │
         ├─────────────────────────────────────────────────┤
         │  Password      │  Session      │  Access         │
         │  Enforcement   │  Management   │  Control        │
         └─────────────────────────────────────────────────┘
```

### **Phase 3: Progressive Profile Completion**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Biodata       │───▶│  Education      │───▶│  Next of Kin    │
│   Completion    │    │  Background     │    │  Information    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
         ┌─────────────────────────────────────────────────┐
         │              Document Upload                    │
         ├─────────────────────────────────────────────────┤
         │  File         │  Validation    │  Storage       │
         │  Upload       │  & Processing  │  Management    │
         └─────────────────────────────────────────────────┘
```

### **Phase 4: Registration Finalization**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Profile       │───▶│  Application    │───▶│  Confirmation   │
│   Validation    │    │  Submission     │    │  & Notification │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
         ┌─────────────────────────────────────────────────┐
         │              Status Tracking                    │
         ├─────────────────────────────────────────────────┤
         │  Review        │  Updates       │  Progress       │
         │  Process       │  & Notifications│  Monitoring     │
         └─────────────────────────────────────────────────┘
```

## Performance Architecture

### **Caching Strategy**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Multi-Tier Caching                          │
├─────────────────────────────────────────────────────────────────┤
│  Fast Cache    │  Standard Cache │  Slow Cache   │  Static     │
│  (Redis)       │  (Redis)        │  (Redis)      │  (Files)    │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌─────────────────┐
                    │   Cache         │
                    │   Warming       │
                    └─────────────────┘
```

### **Performance Features**

- **Multi-Tier Caching**: Fast, standard, and slow cache layers
- **Database Query Optimization**: Indexed queries and connection pooling
- **Connection Management**: Efficient database and Redis connections
- **Response Compression**: Gzip compression for API responses
- **Static Asset Optimization**: CDN-ready static file serving

## Monitoring & Observability

### **Logging Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Logging Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  Application   │  Database      │  Performance  │  Security    │
│  Logs          │  Logs          │  Metrics      │  Events      │
└─────────────────────────────────────────────────────────────────┘
                                │
         ┌─────────────────────────────────────────────────┐
         │              Centralized Logging                │
         ├─────────────────────────────────────────────────┤
         │  Winston      │  Structured    │  Correlation   │
         │  Logger       │  Logging       │  IDs           │
         └─────────────────────────────────────────────────┘
```

### **Monitoring Features**

- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Performance Metrics**: HTTP, database, and system metrics
- **Security Monitoring**: Authentication attempts and security events
- **Business Analytics**: Application statistics and user behavior
- **Error Tracking**: Comprehensive error logging and alerting

## Deployment Architecture

### **Cloud Deployment Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Render.com Platform                         │
├─────────────────────────────────────────────────────────────────┤
│  API Service   │  Database      │  Cache        │  Storage     │
│  (Docker)      │  (PostgreSQL)  │  (Redis)      │  (MinIO)     │
│  fuep-api      │  fuep-postgres │  External     │  External    │
└─────────────────────────────────────────────────────────────────┘
                                │
         ┌─────────────────────────────────────────────────┐
         │              Development Tools                   │
         ├─────────────────────────────────────────────────┤
         │  MailHog      │  Health        │  Monitoring    │
         │  (Email)      │  Checks        │  Tools         │
         └─────────────────────────────────────────────────┘
```

### **Deployment Configuration**

#### **API Service (fuep-api)**

- **Type**: Web service with Docker deployment
- **Plan**: Free tier with automatic scaling
- **Dockerfile**: `./apps/api/Dockerfile`
- **Context**: Root directory for build context
- **Health Check**: `/api/health` endpoint
- **Auto-deploy**: Enabled for continuous deployment

#### **Database Service (fuep-postgres)**

- **Name**: `fuep_postgres`
- **Database**: `fuep_portal`
- **User**: `fuep_user`
- **Plan**: Free tier managed PostgreSQL
- **Connection**: Automatically provided via `DATABASE_URL` environment variable

#### **External Services**

- **Redis**: External Redis service via `REDIS_URL` environment variable
- **MinIO**: External MinIO service for file storage
- **Email**: External SMTP service for production emails

### **Deployment Features**

- **Docker-Based Deployment**: Containerized application deployment on Render.com
- **Managed Cloud Platform**: Render.com handles infrastructure management and scaling
- **Automatic Scaling**: Built-in horizontal scaling capabilities for Docker containers
- **Health Checks**: Comprehensive service health monitoring via `/api/health`
- **Environment Management**: Configurable environment variables with secure defaults
- **Service Discovery**: Internal service communication with managed database
- **SSL/TLS Management**: Automatic HTTPS certificate management
- **Global CDN**: Built-in content delivery network
- **Auto-deployment**: Git-based continuous deployment from Docker images
- **Container Registry**: Integrated Docker image management
- **Free Tier Support**: Cost-effective deployment with managed services

## **API Design Patterns**

### **RESTful API Design**

- **Resource-Based URLs**: Clear, hierarchical endpoint structure
- **HTTP Method Semantics**: Proper use of GET, POST, PUT, DELETE
- **Status Code Standards**: Consistent HTTP response codes
- **Error Handling**: Standardized error response format
- **Pagination**: Efficient data pagination for large datasets

### **API Security Patterns**

- **Authentication**: JWT-based token authentication with refresh mechanism
- **Authorization**: Role-based access control
- **Rate Limiting**: Request throttling and abuse prevention
- **Input Validation**: Comprehensive request validation using Zod schemas
- **Output Sanitization**: Safe response data formatting

## Future Architecture Considerations

### **Scalability Improvements**

- **Microservices**: Service decomposition for better scalability
- **Message Queues**: Asynchronous processing with Redis or RabbitMQ
- **Database Sharding**: Horizontal database scaling
- **CDN Integration**: Global content delivery optimization
- **Load Balancing**: Advanced load balancing strategies

### **Advanced Features**

- **Real-time Updates**: WebSocket integration for live updates
- **Push Notifications**: Mobile push notification system
- **Advanced Analytics**: Machine learning and predictive analytics
- **Multi-tenancy**: Support for multiple institutions
- **API Versioning**: Backward-compatible API evolution

---

_This architecture document reflects the current state of the FUEP Post-UTME Portal as of August 2025._
