# FUEP Post-UTME Portal - System Architecture

## Table of Contents

1. [System Architecture (Big Picture)](#1-system-architecture-big-picture)
2. [Data Architecture (Key Tables)](#2-data-architecture-key-tables)
3. [API Surface (Selected)](#3-api-surface-selected)
4. [Background Jobs (Queues)](#4-background-jobs-queues)
5. [Observability](#5-observability)
6. [Detailed Step-by-Step Architectures](#6-detailed-step-by-step-architectures)
7. [Admin Architecture (Highlights)](#7-admin-architecture-highlights)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Payment Orchestrator (Inside API)](#9-payment-orchestrator-inside-api)
10. [Document Service](#10-document-service)
11. [Shared Types Architecture](#11-shared-types-architecture)

## Sequence Diagrams (Mermaid)

- Diagrams: [docs/sequence-diagrams.md](docs/sequence-diagrams.md)
- These diagrams are authoritative and must be strictly followed in design, implementation, and reviews.

## 1. System Architecture (Big Picture)

### 1.1 Core Components

#### **Web Frontend (React + TypeScript)**

- **Candidate App**: Public + authenticated interfaces
- **Admin App**: RBAC, protected routes
- **Communication**: Talks to API over HTTPS (JWT in Authorization header)

#### **API (Express, Node.js + TypeScript)**

- **Services (by feature)**:
  - **Auth**: OTP, login, password change
  - **Candidate**: Biodata, NOK, sponsor, education
  - **Payment Orchestrator**: Remita primary; Flutterwave fallback
  - **Document**: Uploads, ClamAV scan, PDF conversion, QR codes
  - **Admission**: Decisions, letters
  - **Matriculation**: ID generation, student provisioning
  - **Migration**: Push to main student portal
  - **Notification**: Email/SMS
  - **Admin**: Bulk upload, reconciliation, reports, audit logs
- **Background Workers**: BullMQ + Redis queues

#### **PostgreSQL (Managed)**

- OLTP store for all transactional/relational data

#### **Object Storage (S3-compatible)**

- Candidate uploads (passport, SSCE, A-Level, transcripts)
- Generated PDFs (registration form, receipts, admission letters)

#### **Redis**

- Caching, rate-limiting, queues (payments, scans, emails, PDFs, migration)

#### **Observability**

- **Logs**: Structured JSON
- **Metrics**: Prometheus
- **Tracing**: OpenTelemetry
- **Alerts**: Webhook/webmail

#### **Secrets Management**

- Provider secrets & JWT keys (cloud secrets manager or vault)

### 1.2 Infra Topology (Typical)

- **VPC**: Public subnets (LB/CDN) + private subnets (API, workers)
- **Load Balancer/CDN**: HTTPS + WAF
- **Autoscaled API**: Pods/containers, separate Worker deployment
- **Managed PostgreSQL**: HA + automated backups + PITR
- **Managed Redis**: High availability
- **S3 Bucket**: Versioning + lifecycle + SSE encryption
- **Bastion/Jump**: Admin DB access (IP allow-list)

### 1.3 Security Posture

- **TLS everywhere + HSTS**
- **JWT**: Access + refresh tokens (short TTL access, longer refresh)
- **Password hashing**: Argon2/bcrypt
- **Field-level encryption**: For sensitive PII
- **Webhook signature verification**: Remita & others
- **RBAC**: Admin roles (SuperAdmin, Admissions, Finance, Registrar)
- **Rate limiting**: On auth, uploads, and payment init
- **File security**: Strict MIME + size limits; ClamAV scanning; content-disposition headers

### 1.4 State Machines

#### **Candidate Lifecycle**

```
pre-listed → (paid Post-UTME) → account_created → biodata_complete →
education_complete → nok_sponsor_complete → form_printed → screening →
(admitted|rejected) → (acceptance_paid) → (school_fee_paid) →
matric_assigned → migrated_to_main_portal
```

#### **Payment Lifecycle**

```
initiated → (provider_pending) → success|failed → reconciled → receipted
```

## 2. Data Architecture (Key Tables)

### **Core Tables Structure**

#### **JAMB Prelist**

```sql
jamb_prelist(
  jamb_reg_no PK,
  surname,
  firstname,
  othernames,
  gender,
  programme_code,
  faculty,
  ...
)
```

#### **Candidates**

```sql
candidates(
  id PK,
  jamb_reg_no UNIQUE,
  email,
  phone,
  username=jamb_reg_no,
  password_hash,
  temp_password_flag,
  created_at
)
```

#### **Profiles**

```sql
profiles(
  candidate_id FK,
  address,
  state,
  lga,
  dob,
  gender,
  ...
)
```

#### **Next of Kin**

```sql
next_of_kin(
  candidate_id FK,
  name,
  relation,
  phone,
  address,
  ...
)
```

#### **Sponsors**

```sql
sponsors(
  candidate_id FK,
  name,
  phone,
  email,
  address,
  ...
)
```

#### **Education Records**

```sql
education_records(
  id PK,
  candidate_id FK,
  level_type,
  exam_type,
  year,
  school_name,
  ...
)
```

#### **Uploads**

```sql
uploads(
  id PK,
  candidate_id FK,
  type,
  s3_url,
  checksum,
  size,
  mime,
  scan_status,
  created_at
)
```

#### **Applications**

```sql
applications(
  id PK,
  candidate_id FK,
  session,
  programme_code,
  department_code,
  status,
  submitted_at
)
```

#### **Payments**

```sql
payments(
  id PK,
  candidate_id FK,
  purpose ENUM(post_utme, acceptance, school_fee),
  provider ENUM(remita, flutterwave),
  provider_ref,
  rrr/token,
  amount,
  currency,
  status,
  raw_payload JSONB,
  created_at
)
```

#### **Receipts**

```sql
receipts(
  id PK,
  payment_id FK,
  pdf_url,
  serial,
  qr_token,
  created_at
)
```

#### **Admissions**

```sql
admissions(
  id PK,
  candidate_id FK,
  decision ENUM(pending, admitted, rejected),
  decided_at,
  decided_by,
  notes
)
```

#### **Matric Counters**

```sql
matric_counters(
  session,
  dept_code,
  last_seq,
  UNIQUE(session, dept_code)
)
```

#### **Students**

```sql
students(
  id PK,
  candidate_id FK,
  matric_no UNIQUE,
  dept_code,
  session,
  created_at
)
```

#### **Migrations**

```sql
migrations(
  id PK,
  student_id FK,
  status ENUM(pending, success, failed),
  attempts,
  last_error,
  pushed_at
)
```

#### **Audit Logs**

```sql
audit_logs(
  id PK,
  actor_id,
  actor_role,
  action,
  entity,
  entity_id,
  data JSONB,
  ip,
  created_at
)
```

### **Indexes & Performance**

- **UNIQUE**: `jamb_reg_no`, `payments(provider_ref)`, `students(matric_no)`
- **Partitioning**: Payments by session if needed

## 3. API Surface (Selected)

- Full OpenAPI 3.0 contract: [docs/openapi.yaml](docs/openapi.yaml)
- Preview locally (Redoc):
  ```bash
  npx @redocly/cli@latest preview-docs docs/openapi.yaml
  ```
- Preview locally (Swagger UI):
  ```bash
  docker run -p 8080:8080 -e SWAGGER_JSON=/openapi.yaml -v %cd%/docs/openapi.yaml:/openapi.yaml swaggerapi/swagger-ui
  ```
  Then open http://localhost:8080

### **Public Endpoints**

- `POST /auth/check-jamb` → exists in prelist?
- `POST /payments/init` → start Post-UTME payment
- `POST /payments/webhook/remita` → Remita webhook
- `POST /auth/login` → login with username (JAMB Reg No) + password
- `POST /auth/change-password` → first-login forced change

### **Candidate Endpoints**

- `GET /me` → profile + composite completion states
- `PUT /profile` → biodata updates
- `POST /education-records` / `PUT /education-records/:id`
- `POST /uploads` (multipart; type param)
- `GET /registration-form.pdf`
- `GET /dashboard` → summary (passport/name/program/department/status/matric)
- `POST /payments/init` (acceptance, school_fee)
- `GET /admission-letter.pdf` (if eligible)

### **Admin Endpoints**

- `POST /admin/prelist/upload`
- `GET /admin/candidates` (filters)
- `PATCH /admin/admissions/:candidateId` (admit/reject)
- `POST /admin/matric/:candidateId` → assign if eligible
- `POST /admin/reconcile/:paymentId`
- `GET /admin/reports/*`
- `POST /admin/migrate/:studentId`

## 4. Background Jobs (Queues)

### **Queue Types**

- **`payment.verify`** → verify provider status (defensive)
- **`receipt.generate`** → PDF with QR
- **`doc.scan`** → ClamAV scan
- **`doc.pdfify`** → normalize images → PDF/A if needed
- **`notify.email`** / **`notify.sms`**
- **`matric.generate`** → transactional locking in DB
- **`migration.push`** → push to main portal, retry with backoff

## 5. Observability

### **Metrics**

- Request latency, error rates, queue depth
- Webhook failures, payment success rate, upload failures

### **Logs**

- Structured JSON; sensitive fields redacted

### **Tracing**

- Correlate FE action → API → provider webhook → worker jobs

### **Alerts**

- Payment webhook 5xx, verify failures spike
- DB connection pool saturation

## 6. Detailed Step-by-Step Architectures

Below, each step maps components → endpoints → DB ops → queues → files → security/UX notes.

### **Step 1 — Apply & Verify JAMB Number**

#### **Components**

- **FE**: Apply page
- **API**: Prelist service
- **DB**: `jamb_prelist`

#### **Flow**

1. FE → `POST /auth/check-jamb { jamb_reg_no }`
2. API checks `jamb_prelist`; returns `{ exists: true/false, minimal_biodata }`

#### **DB Operations**

- **Read only**: `jamb_prelist`

#### **UX/Security**

- Validate format client/server
- If not found, show help contact & "recheck later" option
- Rate-limit by IP + jamb_reg_no

---

### **Step 2 — Initiate Post-UTME Payment**

#### **Components**

- **FE**: Email/Phone capture + Pay CTA
- **API**: Payment Orchestrator (Remita primary)
- **DB**: `payments`
- **Queue**: `payment.verify` (scheduled verify)

#### **Flow**

1. FE submits email+phone → API validates & (optionally) pre-create bare candidates record with jamb_reg_no, email, phone (no password yet)
2. API → payments row (purpose=post_utme, status=initiated)
3. API → Remita Init API → store rrr + provider_ref
4. FE receives session + redirect link/modal token

#### **DB Operations**

- Insert `candidates(partial)` if not present
- Insert `payments(initiated)`

#### **UX/Security**

- Use idempotency key (jamb_reg_no + purpose + day)
- Graceful retry button "Re-init payment"
- Validate email/phone (format + uniqueness for candidate)

---

### **Step 3 — Payment Confirmation & Account Creation**

#### **Components**

- **Provider** → API webhook
- **API**: Payment Orchestrator + Auth
- **DB**: `payments`, `receipts`, `candidates`
- **Queues**: `payment.verify`, `receipt.generate`, `notify.email`

#### **Flow**

1. Provider → `POST /payments/webhook/remita`
2. Verify signature → mark `payments.status=success|failed`
3. On success:
   - If no candidate account: create with username=jamb_reg_no, password=rand(12), temp_password_flag=true
   - Enqueue `payment.verify` (defensive)
   - Enqueue `receipt.generate` → PDF stored to S3
   - Enqueue `notify.email` → send temp password + login URL

#### **DB Operations**

- Update `payments`
- Insert `receipts`
- Upsert `candidates`

#### **Files**

- Receipt PDF with QR → S3

#### **UX/Security**

- Email content must not include plain password if policy forbids; alternative is OTP set password link
- If allowed, include temp password + force change

---

### **Step 4 — Login & Password Change Prompt**

#### **Components**

- **FE**: Login + Force-change modal
- **API**: Auth
- **DB**: `candidates`

#### **Flow**

1. FE login → `POST /auth/login` (username = JAMB Reg No)
2. If `temp_password_flag=true` → FE prompts `POST /auth/change-password`
3. On success, set `temp_password_flag=false`

#### **DB Operations**

- Update `candidates.password_hash`, `temp_password_flag=false`

#### **Security**

- Hash with Argon2/bcrypt
- Rate-limit logins
- Lockout after N attempts
- 2FA/OTP optional

---

### **Step 5 — Biodata Form**

#### **Components**

- **FE**: Biodata form (JAMB fields read-only)
- **API**: Candidate service
- **DB**: `profiles`, `applications`

#### **Flow**

1. FE loads `/me` → prefill JAMB read-only + blanks
2. FE → `PUT /profile` (address, state, lga, dob, gender,…)
3. If not yet created, create `applications` row (session/programme/department)

#### **DB Operations**

- Upsert `profiles` (FK candidate_id)
- Upsert `applications` with status=pending

#### **Security**

- Server-side validation
- Sanitize strings
- Audit log writes

---

### **Step 6 — Educational Records**

#### **Components**

- **FE**: Education form + Uploads
- **API**: Education + Upload service
- **DB**: `education_records`, `uploads`
- **Queues**: `doc.scan`, `doc.pdfify`

#### **Flow**

1. FE adds records → `POST /education-records`
2. FE uploads files → `POST /uploads?type=ssce|alevel|transcript`
3. API streams to S3; put `scan_status=pending`; enqueue `doc.scan` (+pdfify if image)

#### **DB Operations**

- Insert `education_records`
- Insert `uploads` (checksum/mime/size)

#### **Files**

- Stored in S3 with versioning and server-side encryption

#### **Security**

- MIME + size check
- ClamAV
- Reject executables
- Redact metadata if needed

---

### **Step 7 — Next-of-Kin & Sponsor**

#### **Components**

- **FE**: Forms
- **API**: Candidate service
- **DB**: `next_of_kin`, `sponsors`

#### **Flow**

1. FE → `POST /next-of-kin`, `POST /sponsors`

#### **DB Operations**

- Insert/Update NOK & Sponsor

#### **Security**

- Validate phone/email
- Sanitize input

---

### **Step 8 — Registration Form Preview & Print**

#### **Components**

- **FE**: Preview page
- **API**: Document service
- **DB**: Reads
- **Queues**: `receipt.generate`-like job for registration-form.pdf

#### **Flow**

1. FE → `GET /registration-form` (JSON) → renders preview
2. FE → `GET /registration-form.pdf`
3. API generates PDF (wkhtmltopdf/Puppeteer), watermarks, QR token to verify endpoint

#### **Files**

- PDF stored to S3; cached URL returned

#### **Security**

- QR resolves to `/verify/registration?token=…` with signed token

---

### **Step 9 — Candidate Dashboard**

#### **Components**

- **FE**: Dashboard tabs
- **API**: Aggregation endpoint
- **DB**: Reads from candidates/profiles/uploads/applications/payments/admissions/students

#### **Flow**

1. FE → `GET /dashboard` returns:
   - Passport URL (uploads)
   - Name, Programme, Department
   - Admission status
   - Matric number (if available)
   - Payment history summary

#### **UX**

- Clear CTAs: "Pay Acceptance", "Pay School Fees", "View Admission Letter", "Edit Biodata", etc.

---

### **Step 10 — Admission, Acceptance/School Fees, Matric, Letter, Migration**

#### **Components**

- **FE**: Dashboard actions
- **API**: Admission/Payment/Matric/Migration services
- **DB**: `admissions`, `payments`, `students`, `migrations`
- **Queues**: `payment.verify`, `matric.generate`, `migration.push`, `notify.email`

#### **Flow**

1. **Admission decision** by Admin → `admissions.decision=admitted`
2. **Acceptance fee payment** → same payment flow → on success: unlock admission letter
3. **School fee payment** → on success: enqueue `matric.generate`
4. **Matriculation service**:
   - DB tx: `SELECT … FOR UPDATE` on `matric_counters`
   - Increment seq; build `FUEP/<SESSION>/<DEPT>/<####>`
   - Insert `students` row; return matric
   - Notify candidate (email/SMS)
5. **Admission letter**:
   - `GET /admission-letter.pdf` if admitted && acceptance_paid
   - Generate PDF with QR verification
6. **Migration**:
   - Worker pushes student to main portal API
   - Record migrations status; retry with backoff; admin retry button

#### **Security**

- Verify all payments via provider verify API before unlocking next steps
- Audit logs for admissions & matric actions

## 7. Admin Architecture (Highlights)

### **Admin Frontend**

- Role-gated routes (SuperAdmin/Admissions/Finance/Registrar)

### **Admin Operations**

- **Prelist upload**: CSV/Excel → `admin/prelist/upload`
- **Candidate CRUD & views**: Filters by session/programme/status
- **Payment Management**: filter payment types, create payment type, add payment type amount, delete payment type, update payment type amount and view payment types
- **Payments Reconciliation**: disputes, manual re-verify, resend receipts
- **Admissions**: Batch admit/reject, notes, audit
- **Matric**: Batch generation (with safety checks)
- **Reports**: CSV/PDF exports (apps by programme, payment success, admission stats)
- **Migrations**: Status table, retry failed, download error logs

## 8. Deployment Architecture

### **Environments**

- Two environments: Staging + Production

### **CI/CD**

- PR → unit/integration tests → FE/BE builds → deploy to staging → smoke tests → manual approve → production

### **Scaling**

- Horizontal scale API/Workers independently
- DB vertical scale + read replicas (optional for reporting)

### **Backups & DR**

- Daily `pg_dump` + WAL/PITR
- S3 lifecycle, cross-region replication (if available)
- Quarterly restore drills

## 9. Payment Orchestrator (Inside API)

### **Key Features**

- **Selector**: Remita primary; if init fails or checks unhealthy, fallback to Flutterwave
- **Idempotency**: `(candidate_id, purpose, session)` key
- **Webhooks**: Separate endpoints per provider; unify to internal status model
- **Reconciliation**: Worker re-verifies success with provider verify API; updates payments and triggers receipts/next steps
- **Telemetry**: Correlate init → webhook → verify with trace IDs

## 10. Document Service

### **Core Functionality**

- **Uploads**: Presigned S3 URLs or server-proxied streaming
- **Scanning**: `doc.scan` job (ClamAV)
- **PDFify**: Images (JPG/PNG) → PDF/A; merge if needed
- **Templates**: HTML → PDF for receipts, registration forms, admission letters
- **QR**: Points to verification endpoint with signed token

## 11. Shared Types Architecture

### **Overview**

The `@fuep/types` package provides a centralized type system that ensures consistency and type safety across the entire application stack. This package serves as the single source of truth for all data contracts between the API backend and React frontend.

### **Package Structure**

```
packages/types/
├── src/
│   ├── index.ts         # Main exports and package version
│   ├── common.ts        # Base entities and shared interfaces
│   ├── auth.ts          # Authentication and user types
│   ├── candidate.ts     # Candidate profile and application types
│   ├── payment.ts       # Payment and transaction types
│   └── validation.ts    # Validation utilities and patterns
```

### **Core Type Categories**

#### **Common Types**

- **BaseEntity**: Base interface for all database entities with `id`, `createdAt`, `updatedAt`
- **ApiResponse<T>**: Standard API response wrapper with success/error handling
- **PaginationParams & PaginatedResponse<T>**: Consistent pagination across all endpoints
- **Status**: Common status enums (`pending`, `active`, `inactive`, `deleted`)

#### **Authentication Types**

- **User**: Complete user account information with security fields
- **JambVerification**: JAMB registration verification data
- **LoginRequest & LoginResponse**: Authentication flow contracts
- **JwtPayload**: JWT token contents and validation

#### **Candidate Types**

- **Candidate**: Complete candidate profile information
- **NextOfKin**: Emergency contact and relationship details
- **Sponsor**: Financial sponsor information
- **Education**: Educational background and qualifications
- **Application**: Application lifecycle and status tracking

#### **Payment Types**

- **PaymentTransaction**: Complete payment transaction records
- **PaymentProvider**: Provider abstraction (Remita, Flutterwave, Paystack)
- **PaymentStatus**: Transaction lifecycle states
- **WebhookPayload**: Provider webhook data structures

#### **Validation Types**

- **ValidationError**: Structured validation error information
- **ValidationResult<T>**: Validation operation results
- **CommonValidationPatterns**: Regex patterns for Nigerian context
- **CustomValidators**: Pre-built Zod validators for common use cases

### **Validation Architecture**

#### **Zod Schema Integration**

- **Runtime Validation**: All API endpoints use Zod schemas for request validation
- **Type Inference**: TypeScript types automatically derived from Zod schemas
- **Error Handling**: Consistent validation error format across all endpoints
- **Custom Validators**: Nigerian-specific validation patterns (phone numbers, states, JAMB format)

#### **Validation Patterns**

```typescript
// Example: JAMB verification endpoint
const validationResult = JambVerificationRequestSchema.safeParse(req.body);
if (!validationResult.success) {
  const response: ApiResponse = {
    success: false,
    error: 'Invalid request data',
    timestamp: new Date(),
  };
  return res.status(400).json(response);
}
```

### **Monorepo Integration**

#### **Package Dependencies**

- **API Package**: `@fuep/types` for request/response validation and database schemas
- **Web Package**: `@fuep/types` for form validation, API calls, and state management
- **Build System**: Types package built first, then API and Web packages

#### **Import Patterns**

```typescript
// API imports
import { JambVerificationRequestSchema, ApiResponse, JambVerification } from '@fuep/types';

// Web imports
import { Status, StatusSchema, ValidationError } from '@fuep/types';
```

### **Development Workflow**

#### **Type Development**

1. **Add new types** to appropriate category file
2. **Include Zod schemas** for runtime validation
3. **Export from index.ts** for package-wide availability
4. **Update README.md** with new type documentation
5. **Rebuild package** with `pnpm build:types`

#### **Integration Testing**

1. **Build types package** to ensure compilation
2. **Update consuming packages** to use new types
3. **Run type checking** across all packages
4. **Test runtime validation** in API endpoints
5. **Verify frontend integration** in React components

### **Benefits**

#### **Type Safety**

- **Compile-time validation** prevents runtime type mismatches
- **IDE autocomplete** and error detection across all packages
- **Refactoring safety** when changing shared interfaces

#### **Consistency**

- **Standardized validation** across all API endpoints
- **Unified error handling** with consistent error formats
- **Common patterns** for pagination, status, and responses

#### **Developer Experience**

- **Single source of truth** for all data contracts
- **Hot reload support** for types development
- **Clear documentation** with examples and usage patterns
- **Modular structure** for easy extension and maintenance

---

_This architecture document provides a comprehensive technical overview of the FUEP Post-UTME Portal system, covering all major components, data flows, and implementation details._
