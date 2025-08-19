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

## Phase 8 — Documents & Uploads

- [ ] MinIO S3 client
- [ ] Upload endpoints with MIME/size validation
- [ ] scan_status pipeline (doc.scan queue with ClamAV)
- [ ] PDFify images to PDF/A if needed
- [ ] Secure download URLs

---

## Phase 9 — Candidate Portal Features

- [ ] Biodata form with JAMB prefill
- [ ] Education records CRUD + uploads
- [ ] NOK and Sponsor CRUD
- [ ] Registration form preview + PDF
- [ ] Dashboard aggregate endpoint + UI

---

## Phase 10 — Admin Portal Foundations

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

### Immediate Next 10 Tasks

1. **Phase 8 - Documents & Uploads**: Implement MinIO S3 client integration
2. **Phase 8 - Documents & Uploads**: Add upload endpoints with MIME/size validation
3. **Phase 8 - Documents & Uploads**: Implement document scan pipeline with ClamAV
4. **Phase 8 - Documents & Uploads**: Add PDF conversion for images
5. **Phase 8 - Documents & Uploads**: Implement secure download URLs
6. **Phase 9 - Candidate Portal Features**: Create biodata form with JAMB prefill
7. **Phase 9 - Candidate Portal Features**: Implement education records CRUD + uploads
8. **Phase 9 - Candidate Portal Features**: Add NOK and Sponsor CRUD operations
9. **Phase 9 - Candidate Portal Features**: Create registration form preview + PDF generation
10. **Phase 9 - Candidate Portal Features**: Implement dashboard aggregate endpoint + UI

---

Last Updated: 2025-01-18
Next Review: 2025-01-25
