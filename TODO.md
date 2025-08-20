# FUEP Post-UTME Portal — Fresh Start Roadmap

This is a clean, realistic roadmap resetting all previous assumptions. Only the environment bootstrap done in this session is marked completed.

## Phase 0 — Environment Bootstrap ✅

- [x] Monorepo workspace scaffolding
  - [x] Root workspace config ([package.json](package.json))
  - [x] pnpm workspaces ([pnpm-workspace.yaml](pnpm-workspace.yaml))
  - [x] Base TS config ([tsconfig.base.json](tsconfig.base.json))
  - [x] Example env file ([.env.example](.env.example))
  - [x] Docker services ([docker-compose.yml](docker-compose.yml))
  - [x] Minimal DB schema seed ([infra/db/001_schema.sql](infra/db/001_schema.sql))
  - [x] Baseline ignore rules ([.gitignore](.gitignore))
- [x] Documentation reviewed and aligned
  - [x] Setup plan derived from ([README](README.md)) ([DevelopmentGuide.guide()](DEVELOPMENT_GUIDE.md:1)) ([ArchitectureSpec.doc()](ARCHITECTURE.md:1)) ([Proposal.doc()](PROPOSAL.md:1))
- [x] OpenAPI contract added ([docs/openapi.yaml](docs/openapi.yaml))
- [x] Sequence diagrams added ([docs/sequence-diagrams.md](docs/sequence-diagrams.md))

Notes:

- Compose services include PostgreSQL, Redis, MinIO, MailHog.
- DB schema is a minimal bootstrap; extend per DEVELOPMENT_GUIDE.md when API modules take shape.

---

## Phase 0.5 — Docker Implementation & Containerization ✅

- [x] **Multi-stage Dockerfiles**: Created optimized Docker images for API and Web services
  - [x] API Dockerfile with Node.js runtime and TypeScript compilation
  - [x] Web Dockerfile with Vite build and Nginx serving
  - [x] Base stage with pnpm installation and workspace support
  - [x] Dependencies stage with types package building
  - [x] Build stage with application compilation
  - [x] Runtime stage with optimized images
- [x] **Docker Compose Orchestration**: Complete service orchestration
  - [x] API service with health checks and dependencies
  - [x] Web service with build args and environment variables
  - [x] Infrastructure services (PostgreSQL, Redis, MinIO, MailHog)
  - [x] Service health checks and dependency management
  - [x] Port mapping and network configuration
- [x] **Workspace Integration**: pnpm monorepo support in Docker
  - [x] Types package building within Docker containers
  - [x] Shared dependencies and workspace linking
  - [x] Multi-stage builds with proper dependency copying
- [x] **Build Optimization**: Docker build improvements
  - [x] Comprehensive .dockerignore files
  - [x] Build context optimization for monorepo
  - [x] Layer caching and build efficiency
- [x] **Port Configuration**: Updated to match environment specifications
  - [x] Frontend accessible on http://localhost:5173 (as specified in .env files)
  - [x] Backend API on http://localhost:4000
  - [x] All infrastructure services properly mapped

**Known Issues Identified:**

- [x] **Environment Variable Substitution**: Frontend build process has issues with environment variable substitution during Docker build
  - [x] **Problem**: VITE_API_BASE_URL environment variable not properly substituted during Vite build
  - [x] **Impact**: Frontend uses hardcoded URLs instead of environment variables
  - [x] **Current Workaround**: Manual URL updates required after rebuilds
  - [x] **Investigation Status**: Multiple approaches attempted (build args, .env files, environment variables)
  - [x] **Solution Implemented**: Runtime configuration system with fallback logic
    - [x] HTML runtime configuration script with `window.APP_CONFIG`
    - [x] Config utility functions with priority: Runtime Config > Environment Variable > Default
    - [x] Null-safe functions to prevent toLowerCase errors
    - [x] Automatic fallback to Docker service names when running in containers

**Technical Details:**

- Docker build context set to root directory to handle pnpm workspace dependencies
- Multi-stage builds with separate dependency, build, and runtime stages
- Environment variables configured in docker-compose.yml and passed as build args
- Frontend served via Nginx on port 5173 (matching .env specifications)
- API service with CORS configured for localhost:5173

**Next Steps:**

1. Investigate and fix environment variable substitution issue
2. Implement proper runtime configuration if build-time substitution cannot be resolved
3. Document the final solution and update deployment procedures
4. Consider implementing health checks for frontend service
5. Optimize Docker image sizes and build times

---

## Phase 1 — Repository & Tooling

- [x] Initialize git repository and create initial commit
- [x] Add ESLint config at root (TypeScript + Express monorepo)
- [x] Add Prettier config and format scripts
- [x] Add EditorConfig
- [x] Configure VSCode recommendations (extensions + settings)
- [x] Add basic CI skeleton (GitHub Actions) for lint + typecheck + build
- [x] Add PR checklist to enforce OpenAPI & Mermaid sequence diagrams conformance
- [x] Node version pinning (.nvmrc, engines, engine-strict)
- [x] .gitattributes to normalize line endings
- [x] Husky + lint-staged + commitlint (Conventional Commits)
- [x] Changesets for versioning/changelogs (workflow enabled)
- [x] Root .env.example and apps/api/.env.example
- [x] Knex configuration (knexfile) + db scripts
- [x] Repository hygiene files (LICENSE, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md)
- [x] Issue/PR templates and CODEOWNERS placeholder

Deliverables:

- .eslintrc.\* and .prettierrc
- .editorconfig
- .vscode/extensions.json, settings.json
- .github/workflows/ci.yml

---

## Phase 2 — Local Infrastructure Bring-up ✅

- [x] Create development env file from example
  - [x] Copy .env.example → .env.development and fill secrets locally
- [x] Start services
  - [x] docker compose up -d
- [x] Verify health
  - [x] docker compose ps shows healthy postgres, redis, minio, mailhog
  - [x] Connect to DB and \dt shows tables
  - [x] Verify v_dashboard_summary view exists
- [x] Database initialization
  - [x] Auto-init schema executed from infra/db/001_schema.sql on first boot
  - [x] Seed test data (INSERT jamb_prelist 'TEST123')
- [x] MinIO
  - [x] Create bucket: uploads
- [x] MailHog
  - [x] Verify UI at http://localhost:8025

---

## Phase 3 — Backend Bootstrap (Express)

- [x] Scaffold NestJS app in apps/api
  - [x] apps/api/package.json set name "@fuep/api"
  - [x] src/main.ts with CORS, helmet, cookie-parser
  - [x] src/app.module.ts minimal setup
- [x] Configuration
  - [x] Load env via @nestjs/config
  - [ ] Config validation
- [x] Persistence
  - [x] Database client (knex) per ([DatabaseConfig.knex()](DEVELOPMENT_GUIDE.md:634))
  - [x] Health endpoint GET /health
- [x] Scripts
  - [x] Dev server start: pnpm --filter @fuep/api start:dev

---

## Phase 4 — Frontend Bootstrap (React + Vite)

- [x] Scaffold Vite React TS app in apps/web
  - [x] apps/web/package.json set name "@fuep/web"
- [x] Env
  - [x] apps/web/.env with VITE_API_URL=http://localhost:4000
- [x] Routing
  - [x] / (Apply), /login, /dashboard
- [x] API client
  - [x] axios instance with auth header support

---

## Phase 5 — Shared Types Package

- [x] Scaffold packages/types
  - [x] Build script and TS config
  - [x] Export shared types and zod schemas in later phases

---

## Phase 6 — Core Flows (Foundations First) ✅

- [x] Auth basics
  - [x] POST /auth/check-jamb (verify in jamb_prelist)
  - [x] POST /auth/login
  - [x] POST /auth/change-password (JWT guard later)
- [x] Candidate profile foundations
  - [x] PUT /profile
  - [x] applications table lifecycle foundations
- [x] Payments — init shape only (no provider yet)
  - [x] POST /payments/init → creates initiated payment row
  - [x] ~~Idempotency key basis~~ **REMOVED: In-memory idempotency replaced with TODO for durable implementation**
- [x] FE: Apply → Check JAMB → Start payment (mock URL alert)

---

## Phase 7 — Payment Gateway Integration ✅

- [x] **Database Schema Extension**
  - [x] Enhanced payments table with provider fields, metadata, and audit trail
  - [x] Added payment_events table for state change tracking
  - [x] Enhanced receipts table with content hash for tamper detection
  - [x] Added payment summary view for candidates
- [x] **Payment Provider Architecture**
  - [x] Base payment provider interface (IPaymentProvider)
  - [x] Provider registry and factory pattern
  - [x] Provider configuration management
- [x] **Remita Integration (Primary Provider)**
  - [x] Payment initialization with RRR generation
  - [x] Webhook signature verification
  - [x] Payment status mapping and verification
  - [x] Sandbox mode support
- [x] **Flutterwave Integration (Fallback Provider)**
  - [x] Payment initialization with transaction reference
  - [x] Webhook signature verification
  - [x] Payment status mapping and verification
  - [x] Sandbox mode support
- [x] **Payment Service Layer**
  - [x] ~~Idempotency key generation and enforcement~~ **REMOVED: In-memory idempotency replaced with TODO for durable implementation**
  - [x] Provider selection and fallback logic
  - [x] Webhook processing and payment state updates
  - [x] Receipt generation and storage
- [x] **API Endpoints**
  - [x] POST /payments/init - Payment initiation
  - [x] GET /payments/:id - Payment status
  - [x] POST /payments/:id/verify - Manual verification
  - [x] GET /payments/:id/receipt - Receipt generation
  - [x] POST /payments/webhook/remita - Remita webhooks
  - [x] POST /payments/webhook/flutterwave - Flutterwave webhooks
  - [x] GET /payments/providers/status - Provider health check
- [x] **Security & Reliability**
  - [x] Webhook signature verification (HMAC-SHA256)
  - [x] Timestamp validation and replay protection
  - [x] ~~Idempotency enforcement~~ **REMOVED: In-memory idempotency replaced with TODO for durable implementation**
  - [x] Structured logging for payment events
- [x] **Documentation & Types**
  - [x] Enhanced shared types for payment operations
  - [x] Updated OpenAPI specification
  - [x] Environment variable configuration
  - [x] Provider setup instructions

**Deliverables:**

- Real payment gateway integration (Remita + Flutterwave)
- Secure webhook processing with signature verification
- ~~Idempotent payment operations~~ **REMOVED: In-memory idempotency replaced with TODO for durable implementation**
- Comprehensive payment audit trail
- Receipt generation and storage
- Provider health monitoring

**Technical Notes:**

- Uses Node.js crypto module for secure operations
- Implements provider-agnostic payment interface
- Supports sandbox and production modes
- Maintains backward compatibility with existing API contract
- **TODO: Implement durable idempotency strategy before production deployment**

---

## Phase 8 — Documents & Uploads ✅

- [x] MinIO S3 client
- [x] Upload endpoints with MIME/size validation
- [x] scan_status pipeline (doc.scan queue with ClamAV) - **Foundation ready, ClamAV integration pending**
- [x] PDFify images to PDF/A if needed - **Foundation ready, conversion logic pending**
- [x] Secure download URLs

---

## Phase 9 — Candidate Portal Features ✅

**Status**: **COMPLETED** - Full frontend implementation with proper routing and state management

**Implementation Details**:

- ✅ **Backend API Endpoints**: All candidate portal endpoints implemented
- ✅ **Frontend Components**: Complete React component suite implemented
- ✅ **Application Flow**: Multi-step registration process (JAMB verification → Contact info → Payment)
- ✅ **Authentication System**: JWT-based auth with temporary password handling
- ✅ **State Management**: React Context for authentication and user state
- ✅ **Protected Routes**: Route protection based on authentication status
- ✅ **Professional UI/UX**: Modern, responsive design with proper form validation
- ✅ **Routing**: Complete React Router setup with proper navigation
- ✅ **Password Management**: Temporary password change flow as per sequence diagrams
- ✅ **Dashboard**: Comprehensive candidate dashboard with progress tracking
- ✅ **Form Integration**: Proper integration with backend API endpoints

**Components Implemented**:

- `Application.tsx` - Multi-step registration flow
- `Dashboard.tsx` - Candidate dashboard with progress tracking
- `Login.tsx` - Enhanced login with password change handling
- `ProtectedRoute.tsx` - Route protection component
- `AuthContext.tsx` - Authentication state management
- Updated routing in `main.tsx`
- Enhanced `Home.tsx` with proper navigation

**Technical Features**:

- **Multi-step Forms**: Guided application process with progress indicators
- **Form Validation**: Client-side validation with error handling
- **API Integration**: Proper integration with backend endpoints
- **State Persistence**: JWT token storage and user session management
- **Responsive Design**: Mobile-first responsive UI components
- **Error Handling**: Comprehensive error handling and user feedback
- **Loading States**: Proper loading indicators and disabled states
- **Navigation**: Seamless navigation between application steps

**Architecture Compliance**:

- ✅ Follows sequence diagrams from `docs/sequence-diagrams.md`
- ✅ Implements registration flow from `PROPOSAL.md`
- ✅ Uses API contracts from `docs/openapi.yaml`
- ✅ Follows system architecture from `ARCHITECTURE.md`

**Next Steps**: Ready for Phase 10 - Admin Portal implementation

---

## Phase 10 — Admin Portal (Full stack)

- [ ] App shell with RBAC
- [ ] Prelist upload (CSV/Excel)
- [ ] Candidate search & filters
- [ ] Payments reconciliation tools
- [ ] Admissions decisions and notes
- [ ] Reports (CSV/PDF exports)

---

## Phase 11 — Security, Performance, Observability

- [ ] Rate limiting
- [ ] Security headers + CORS hardening
- [ ] Structured logging
- [ ] Basic metrics & tracing hooks
- [ ] Caching strategy for hot endpoints
- [ ] **TODO: Implement durable idempotency strategy**
  - [ ] Create idempotency table with unique constraint on (idempotency_key, request_fingerprint)
  - [ ] Implement Redis-based idempotency with TTL (alternative to Postgres)
  - [ ] Add Idempotency-Key header validation in payment endpoints
  - [ ] Store original response for safe replays within retention window
  - [ ] Ensure concurrency safety with database transactions
  - [ ] Align with OpenAPI definitions and sequence diagrams
  - [ ] **Implementation timing: Near end of project, just before production deployment**

---

## Phase 12 — Testing & Quality

- [ ] Unit tests (API + FE)
- [ ] Integration tests for API endpoints
- [ ] E2E with Playwright
- [ ] Performance checks on critical flows
- [ ] Lint/typecheck in CI

---

## Phase 13 — Deployment & DevOps

- [ ] Production Dockerfiles
- [ ] Environment manifests
- [ ] HTTPS + reverse proxy config
- [ ] CI workflows for build/deploy
- [ ] Backup and DR runbooks

---

## Phase 14 — Documentation & Training

- [ ] Swagger/OpenAPI — maintain ([docs/openapi.yaml](docs/openapi.yaml))
- [ ] Mermaid sequence diagrams — maintain ([docs/sequence-diagrams.md](docs/sequence-diagrams.md))
- [ ] Redoc preview: `npx @redocly/cli@latest preview-docs docs/openapi.yaml`
- [ ] Swagger UI preview (Docker): `docker run -p 8080:8080 -e SWAGGER_JSON=/openapi.yaml -v %cd%/docs/openapi.yaml:/openapi.yaml swaggerapi/swagger-ui`
- [ ] User and Admin manuals
- [ ] Deployment runbooks
- [ ] Troubleshooting guides

---

## Current Status

- Phase 1 (Repository & Tooling): ✅ completed (see repo hygiene, CI, hooks, and configs)
- Phase 2 (Local Infrastructure Bring-up): ✅ completed
  - Services healthy (Postgres, Redis, MinIO, MailHog)
  - Schema initialized; v_dashboard_summary created
  - Test data seeded (jamb_prelist: TEST123)
  - MinIO bucket created (uploads)
- Phase 3 (Backend Bootstrap: Express): ✅ completed
  - API server running on http://localhost:4000 with GET /health returning 200
  - Express bootstrap completed (helmet, cors, cookie-parser)
  - Knex configured for Postgres connectivity (URL or discrete envs)
  - JAMB verification endpoint updated with shared types integration
- Phase 4 (Frontend Bootstrap: React + Vite): ✅ completed
  - Web app running on http://localhost:5173 with brand theming
  - React + TypeScript + Vite setup complete
  - Status page with API health integration
  - Shared types package integration working
- Phase 5 (Shared Types Package): ✅ completed
  - Comprehensive type definitions and Zod validation schemas
  - Authentication, candidate, payment, and validation types
  - Nigerian context validation patterns
  - Full monorepo integration with API and Web packages
- Phase 6 (Core Flows): ✅ completed
  - Authentication endpoints (login, change-password) implemented
  - Profile management endpoint implemented
  - Application lifecycle endpoint implemented
  - Payment initiation endpoint implemented
  - Frontend pages for all core flows implemented
  - Full end-to-end integration working
- Phase 7 (Payment Gateway Integration): ✅ completed
  - Real payment gateway integration (Remita + Flutterwave)
  - Secure webhook processing with signature verification
  - ~~Idempotent payment operations~~ **REMOVED: In-memory idempotency replaced with TODO for durable implementation**
  - Comprehensive payment audit trail
  - Receipt generation and storage
  - Provider health monitoring
- Phase 8 (Documents & Uploads): ✅ completed
  - MinIO S3 client integration with automatic bucket management
  - Upload endpoints with MIME/size validation (10MB max)
  - Document management API with full CRUD operations
  - File type validation and security checks implemented
  - Document health monitoring and status endpoints
  - Foundation ready for ClamAV scanning and PDF conversion
- Phase 9 (Candidate Portal Features): ✅ completed
  - Comprehensive candidate service with JAMB prefill integration
  - Profile management with automatic creation from JAMB data
  - Next of Kin and Sponsor CRUD operations
  - Education records management (create, read, update, delete)
  - Profile completion status tracking and dashboard
  - Full TypeScript implementation with shared types integration
- **Phase 0.5 (Docker Implementation & Containerization): ✅ completed**
  - **Full Docker containerization with multi-stage builds**
  - **Docker Compose orchestration for all services**
  - **Frontend accessible on http://localhost:5173 (as specified in .env files)**
  - **Backend API running on http://localhost:4000**
  - **All infrastructure services containerized and orchestrated**
  - **Known issue: Environment variable substitution during frontend build (see above)**

### Immediate Next 10 Tasks

1. **Docker Enhancement**: Add health checks for frontend service
2. **Docker Enhancement**: Optimize Docker image sizes and build times
3. **Phase 10 - Admin Portal**: Begin admin portal foundations with RBAC
4. **Phase 10 - Admin Portal**: Create app shell with role-based access control
5. **Phase 10 - Admin Portal**: Implement prelist upload (CSV/Excel)
6. **Phase 10 - Admin Portal**: Add candidate search & filters
7. **Phase 10 - Admin Portal**: Build payments reconciliation tools
8. **Phase 10 - Admin Portal**: Create admissions decisions and notes system
9. **Phase 8 - Enhancement**: Integrate ClamAV for document scanning
10. **Phase 8 - Enhancement**: Implement image-to-PDF conversion

---

Last Updated: 2025-01-19
Next Review: 2025-01-26
