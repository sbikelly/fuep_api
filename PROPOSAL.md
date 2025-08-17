# FUEP Post-UTME Portal - Project Proposal

## Executive Summary

The FUEP Post-UTME Portal is a comprehensive digital solution designed to streamline the post-UTME examination process for Federal University of Education, Pankshin (FUEP). This system modernizes the traditional paper-based application process, providing a secure, efficient, and user-friendly platform for candidates, administrators, and stakeholders.

## Project Overview

### Background
Federal University of Education, Pankshin (FUEP) currently manages post-UTME applications through manual processes, which are time-consuming, error-prone, and difficult to scale. The existing system lacks proper data management, payment tracking, and real-time communication capabilities.

### Objectives
- **Digital Transformation**: Convert paper-based applications to digital format
- **Efficiency**: Reduce application processing time by 70%
- **Accuracy**: Minimize data entry errors and improve data integrity
- **Accessibility**: Provide 24/7 access to application services
- **Security**: Implement robust data protection and user authentication
- **Analytics**: Enable data-driven decision making through comprehensive reporting

## Functional Requirements

### High-Level Scope

#### Candidate-Facing Features
- **Secure Registration & Login**: JAMB registration number as primary identifier with password reset via email/SMS
- **Post-UTME Payment**: Support multiple payment providers with fallback options
- **Biodata Entry**: Complete candidate, next-of-kin, and sponsor information
- **Passport Upload**: Image cropping and quality check functionality
- **Educational History**: Entry and document upload (WAEC/NECO, degrees, transcripts)
- **Document Management**: Downloadable registration form and receipt
- **Payment Tracking**: Complete payment history and receipt download
- **Admission Status**: Real-time display (Admitted/Not Admitted/Pending)
- **Acceptance Process**: Acceptance fee payment and admission letter generation (PDF)
- **School Fee Management**: School fee payment and matric number assignment
- **Portal Migration**: Final migration to main student portal after validation

#### Admin-Facing Features
- **Role-Based Dashboard**: Super Admin, Admissions Officer, Finance, Registrar roles
- **Candidate Management**: CRUD operations with bulk upload (CSV/Excel)
- **Payment Reconciliation**: Dispute resolution and reconciliation interface
- **Admission Processing**: Manual override and batch admission processing
- **Reporting & Analytics**: Generate reports and analytics (export CSV/PDF)
- **Audit System**: Comprehensive audit logs and activity tracker
- **System Configuration**: Fees, payment channels, document types, deadlines

### Key Non-Functional Requirements (NFRs)

#### Security
- Strong authentication and role-based access control
- Encryption at rest and in transit
- File scanning for uploads
- PCI DSS compliance for payment handling

#### Availability
- 99.9% SLA target during admissions windows
- Graceful degradation outside peak periods

#### Performance
- Page load time < 2s on broadband
- Payment flows < 10s for external interactions

#### Scalability
- Handle concurrent users during peak registration periods
- Horizontal scaling capability

#### Compliance
- Data protection best practices
- Local regulations compliance
- Avoid unnecessary PII storage

#### Maintainability
- Clear modular codebase
- Automated tests
- CI/CD pipelines

## System Architecture

### Proposed Technology Stack

#### Frontend
- **Framework**: React + TypeScript (Create React App / Vite)
- **UI Library**: Component library (Chakra UI / Ant Design) for faster development
- **State Management**: Modern state management solutions

#### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express (Node.js with TypeScript)
- **ORM**: TypeORM/Prisma for database operations

#### Database & Storage
- **Primary Database**: PostgreSQL hosted on cloud (AWS RDS / Aiven / DigitalOcean)
- **File Storage**: S3-compatible object storage (AWS S3, DigitalOcean Spaces, MinIO)
- **Caching**: Redis for caching, rate-limiting, and job queues
- **Backup**: Strong backups with read replicas as needed

#### Authentication & Security
- **JWT + Refresh Tokens**: For API authentication
- **OTP/Email**: For account confirmation
- **OAuth**: For admin SSO (optional)

#### Payment Integration
- **Primary**: Remita
- **Fallbacks**: Flutterwave
- **Purpose**: Redundancy and local ubiquity

#### Additional Services
- **Search/Analytics**: ElasticSearch for fast searching (optional)
- **Admin Analytics**: Metabase or Superset for dashboards
- **Monitoring**: Prometheus + Grafana for metrics
- **Logging**: ELK stack or Loki/Tempo for logs/traces

#### CI/CD & Hosting
- **CI/CD**: GitHub Actions / GitLab CI
- **Frontend Hosting**: CDN (Cloudflare Pages / Netlify) or app server
- **Backend Hosting**: Container platform (ECS, DigitalOcean App Platform, Kubernetes)
- **Local Backup**: Periodic dumps, file sync to on-prem NAS

### Core Components

#### 1. Public Web Frontend (React/TS)
- Candidate registration flows, payments, file upload UI, status pages
- Communicates with Backend APIs over HTTPS

#### 2. Admin Web App (React/TS)
- Role-based interfaces, batch operations, reconciliation tools

#### 3. API Gateway / Backend (Express)
- RESTful APIs for all operations: auth, profile, payments, documents, admin
- Handles webhooks from payment providers and queues background tasks

#### 4. Payments Service
- Module within backend to orchestrate payment provider calls
- Webhook processing and reconciliation jobs

#### 5. Worker Queue
- Background workers for document conversions, virus scans, email sending
- Matric generation and admission batch jobs

#### 6. Database (PostgreSQL)
- Normalized schema for candidates, applications, payments, admissions, students

#### 7. Object Storage (S3)
- Store uploaded documents with lifecycle rules and encrypted buckets

#### 8. Monitoring & Logging
- Comprehensive system monitoring and logging

#### 9. Local Backup Node
- On-prem server for nightly DB dumps and file sync
- Acts as cold standby

## Data Model

### Key Entities

#### Core Entities
- **Candidate**: `id`, `jamb_no` (unique), `email`, `phone`, `password_hash`, `created_at`
- **Profile**: `candidate_id`, `surname`, `firstname`, `othernames`, `gender`, `dob`, `address`, `state`, `lga`
- **NextOfKin**: `candidate_id`, `name`, `relationship`, `phone`, `address`
- **Sponsor**: `candidate_id`, `name`, `phone`, `email`, `relationship`, `address`

#### Academic & Documents
- **EducationRecord**: `candidate_id`, `exam_type` (WAEC/NECO), `year`, `results_file_id`
- **Upload**: `id`, `candidate_id`, `type` (passport, result, transcript), `url`, `checksum`, `virus_scan_status`

#### Application & Payment
- **Application**: `id`, `candidate_id`, `programme_applied`, `session`, `status` (pending, screened, admitted, rejected), `date_applied`
- **Payment**: `id`, `candidate_id`, `amount`, `provider`, `provider_ref`, `status` (initiated, success, failed), `metadata`

#### Student & Audit
- **Student**: `id`, `matric_no`, `candidate_id`, `date_matriculated`, `department_id`
- **AuditLog**: `actor_id`, `action`, `resource`, `timestamp`, `data`

## Design Artifacts (Authoritative)

- OpenAPI 3.0 contract: [docs/openapi.yaml](docs/openapi.yaml:1)
- Sequence Diagrams (Mermaid): [docs/sequence-diagrams.md](docs/sequence-diagrams.md:1)

These artifacts are normative and must be strictly adhered to during design, implementation, and reviews.

## System Flows

### Registration Flow

#### Step 1: JAMB Verification
- Candidate clicks Apply → enters JAMB Reg No
- Frontend calls backend to check JAMB number in pre-uploaded dataset
- If exists: Request Email & Phone Number
- If not found: Display error and contact admissions office

#### Step 2: Payment Initialization
- Backend creates local Payment record (status=initiated)
- Calls Remita API to initialize Post-UTME payment

#### Step 3: Account Creation
- After successful payment, backend creates Post-UTME account
- Username = JAMB Reg No
- Generates temporary random password (secure, 10-12 chars)
- Sends password to candidate's email with login instructions

#### Step 4-6: Login & Password Management
- Candidate logs in using JAMB Reg No and temporary password
- System prompts password change on first login
- Clear warning to change password

#### Step 7-9: Data Entry
- Biodata Form (pre-filled with JAMB data, additional fields editable)
- Educational Record Form for entry & uploads
- Next-of-kin and Sponsor forms

#### Step 10: Dashboard Access
- Registration Form Preview for review & printing
- Candidate Dashboard with tabs:
  - Payments (view, initiate, print receipts)
  - Admission Letter (view/print if admitted & acceptance fee paid)
  - Biodata (view/edit)
  - SSCE, A-Level, Transcript (uploads)
  - UTME (JAMB result)

### Algorithm & Data Flow Integration

#### 1. Pre-Registration Verification Flow
- Dataset from JAMB CAPS uploaded by admin
- Backend maintains `jamb_prelist` table
- Verification against JAMB number on registration

#### 2. Payment Initialization Flow
- Create payment record linked to `jamb_reg_no`
- Call Remita API with orderId, amount, purpose
- Save `remita_rrr` & status=initiated
- Webhook verification success → update status=paid, trigger account creation

#### 3. Account Creation Flow
- Username = JAMB Reg No
- Password = secureRandom(12) (hashed in DB)
- Email with login details & force password change

#### 4. Matric Number Generation (Post-Admit)
- Triggered when admission status = admitted
- Requires acceptance_fee & school_fee payment
- Calls matric generator algorithm

### Payment Flow

#### Recommended Pattern
1. **Payment Initiation**: Candidate clicks pay → frontend calls backend
2. **Payment Record Creation**: Backend creates local Payment record (status=initiated)
3. **Provider Integration**: Calls payment provider API (Primarily Remita)
4. **User Payment**: User completes payment on provider UI or inline modal
5. **Webhook Processing**: Payment provider sends webhook to backend
6. **Verification**: Webhook handler verifies provider signature
7. **Status Update**: Updates Payment status to success/failed
8. **Reconciliation**: Queues job to reconcile and send receipt
9. **Final Validation**: Worker validates payment with provider's verify API
10. **Process Completion**: Updates Application status or triggers downstream processes

#### Resilience & UX Improvements
- Clear progress UI and guidance for failed payments
- Polling + webhook combination to reduce user uncertainty
- Idempotency keys on initialize calls to avoid double-charging
- Automatic retries and manual dispute resolution in admin panel

### Matriculation & Auto-Account Provisioning

#### Business Rules
- When candidate status becomes "Admitted" and fees are paid
- Generate matric number using university format (e.g., FUEP/2025/CSC/0123)
- Create Student record and provision portal account

#### Auto-Provisioning Steps
1. Generate matric number according to agreed algorithm
2. Create Student record linking Candidate
3. Provision portal account with username = matric_no
4. Temporary password or OTP flow
5. Force password reset on first login
6. JAMB number as secondary recovery field (not password)

## Technical Implementation

### Document Upload & Validation
- **File Restrictions**: PDF, JPG, JPEG, PNG formats
- **Size Limits**: 5-10MB depending on document type
- **Security**: Virus/malware scan (ClamAV or commercial)
- **Processing**: Background workers for conversion and normalization
- **Storage**: Generate thumbnails for admin previews
- **Audit**: Store checksum and original file metadata

### Admin Tools & Operational Flows
- **Bulk Operations**: CSV upload with schema matching and preview
- **Payment Resolution**: Dispute resolution, manual verification, refunds
- **Batch Processing**: Upload admitted JAMB numbers or selection tools
- **Reporting**: Daily counts, success rates, statistics, exports
- **Audit**: Immutable audit logs for key actions

### Security & Compliance Checklist
- **Transport**: TLS everywhere, HSTS
- **Validation**: Server-side input validation, strict content-type checks
- **Protection**: Rate limiting, brute-force protection on auth endpoints
- **Encryption**: Strong hashing (argon2/bcrypt), sensitive data encryption
- **Verification**: Webhook verification for payment providers
- **Testing**: Regular vulnerability scans and pen testing
- **Access Control**: RBAC with fine-grained permissions
- **Backup Security**: Backup encryption and key management

### Operational Considerations

#### Backup Strategy
- **Database**: Nightly pg_dump with WAL archiving
- **Retention**: 30 days on cloud, replicate to local server nightly
- **Files**: Sync to cloud and nightly replication to on-prem storage
- **Testing**: Annual disaster recovery testing

#### Local Backup Strategy
- Local server as cold standby
- Documented failover procedures
- Maintain operational readiness

### Deployment & CI/CD
- **Repository**: GitHub/GitLab with branch protection rules
- **CI Pipeline**: Test → build → deploy to staging using GitHub Actions
- **Infrastructure**: IaC (Terraform) for provisioning
- **Deployment**: Blue/green or rolling deployments

### Testing Strategy
- **Unit Tests**: Backend and frontend (60-80% coverage on critical modules)
- **Integration Tests**: API endpoints, payment provider mocks
- **End-to-End**: Cypress/Playwright for major flows
- **Performance**: Load testing before admissions window

### Monitoring & Observability
- **Metrics**: Request rates, latency, error rates
- **Alerting**: Payment webhook failures, DB errors, high error rates
- **Health Checks**: Endpoints and synthetic monitoring
- **Critical Flows**: Payment initiation to verification monitoring

## API Design

- OpenAPI 3.0 contract: [docs/openapi.yaml](docs/openapi.yaml)
- Preview locally (Redoc):
  ```bash
  npx @redocly/cli@latest preview-docs docs/openapi.yaml
  ```
- Preview locally (Swagger UI):
  ```bash
  docker run -p 8080:8080 -e SWAGGER_JSON=/openapi.yaml -v %cd%/docs/openapi.yaml:/openapi.yaml swaggerapi/swagger-ui
  ```
  Then open http://localhost:8080

### Sample API Endpoints

#### Authentication
- `POST /api/auth/register` — Candidate signup
- `POST /api/auth/login` — Login
- `POST /api/auth/forgot-password` — Password reset

#### Application Management
- `GET /api/application/:id` — Application status
- `POST /api/application/:id/pay` — Initiate payment

#### File Management
- `POST /api/uploads` — Upload document (multipart)

#### Payment Processing
- `POST /api/payments/webhook` — Provider webhook

#### Admin Operations
- `POST /api/admin/candidates/import` — Bulk CSV upload
- `POST /api/admin/admissions/batch` — Batch admit
- `POST /api/migrate/:candidateId` — Migrate to main student portal

## Implementation Timeline

### Phase 1: Core Development (Weeks 1-8)
- [ ] Project setup and infrastructure
- [ ] Database design and implementation
- [ ] Backend API development
- [ ] Basic candidate portal (signup, biodata, file upload)
- [ ] Authentication system
- [ ] Admin CRUD + basic reports
- [ ] User management
- [ ] Payment integration (1 provider i.e., Remita) + payment records
- [ ] Acceptance letter PDF generation and basic matric assignment
- [ ] Local backup configuration

### Phase 2: Feature Development (Weeks 9-16)
- [ ] Application submission system
- [ ] Document upload and management
- [ ] Second Payment provider integration (Flutterwave)
- [ ] Add virus-scan & document conversion pipeline
- [ ] Performance testing and security hardening

### Phase 3: Features & Automations (4 weeks)
- [ ] Auto-provisioning student accounts & migration tools
- [ ] Advanced reports & analytics
- [ ] Acceptance/Matric workflow polishing and printing support

### Phase 4: Enhancement & Testing (Weeks 17-20)
- [ ] Advanced features
- [ ] Performance optimization
- [ ] Security testing
- [ ] User acceptance testing
- [ ] Documentation

### Phase 5: Deployment & Training (Weeks 21-24)
- [ ] Production deployment
- [ ] Staff training
- [ ] Go-live support
- [ ] Post-deployment monitoring

## Risk Assessment

### Technical Risks
- **Integration Complexity**: Payment gateway integration challenges
- **Performance Issues**: High concurrent user load
- **Security Vulnerabilities**: Data breach potential
- **Scalability Limitations**: System growth constraints

### Mitigation Strategies
- **Phased Implementation**: Incremental feature rollout
- **Load Testing**: Comprehensive performance testing
- **Security Audits**: Regular security assessments
- **Cloud Infrastructure**: Scalable hosting solutions

## Success Metrics

### Quantitative Metrics
- **Application Processing Time**: Reduce from 2 weeks to 3 days
- **Error Rate**: Reduce data entry errors by 90%
- **User Satisfaction**: Achieve 85%+ satisfaction rating
- **System Uptime**: Maintain 99.9% availability
- **Processing Capacity**: Handle 5000+ applications per session

### Qualitative Metrics
- **User Experience**: Intuitive and responsive interface
- **Data Quality**: Improved accuracy and completeness
- **Operational Efficiency**: Streamlined administrative processes
- **Compliance**: Adherence to data protection regulations

## Budget Considerations

### Development Costs
- **Backend Development**: 40% of total budget
- **Frontend Development**: 25% of total budget
- **Database & Infrastructure**: 20% of total budget
- **Testing & Quality Assurance**: 10% of total budget
- **Documentation & Training**: 5% of total budget

### Operational Costs
- **Hosting & Infrastructure**: Monthly operational expense
- **Maintenance & Updates**: Ongoing system maintenance
- **Support & Training**: User support and training programs

## Deliverables

- **Functional Web Portal**: Complete candidate and admin interfaces
- **Documentation**: API docs, deployment runbook, admin manual
- **CI/CD Pipelines**: Automated deployment and testing
- **Infrastructure Code**: IaC for provisioning and management
- **Testing Artifacts**: Test results and performance metrics
- **Training Materials**: Handover and training materials for ICT staff

## Conclusion

The FUEP Post-UTME Portal represents a significant step forward in digital transformation for the university. By implementing this comprehensive solution, FUEP will:

- **Improve Efficiency**: Streamline application processes
- **Enhance User Experience**: Provide better service to candidates
- **Increase Data Quality**: Reduce errors and improve accuracy
- **Enable Growth**: Scale operations to handle increased demand
- **Modernize Operations**: Align with digital-first approaches

This project will position FUEP as a leader in educational technology adoption and provide a foundation for future digital initiatives.

## Next Steps

1. **Stakeholder Approval**: Secure project approval and budget allocation
2. **Team Assembly**: Form development and project management teams
3. **Detailed Planning**: Develop comprehensive project plan
4. **Infrastructure Setup**: Prepare development and testing environments
5. **Development Kickoff**: Begin Phase 1 implementation

---

*This proposal outlines the vision and implementation strategy for the FUEP Post-UTME Portal. For additional details or clarification, please contact the project team.*
