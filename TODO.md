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
- [ ] Initialize git repository and create initial commit
- [ ] Add ESLint config at root (TypeScript + React + NestJS)
- [ ] Add Prettier config and format scripts
- [ ] Add EditorConfig
- [ ] Configure VSCode recommendations (extensions + settings)
- [ ] Add basic CI skeleton (GitHub Actions) for lint + typecheck
- [ ] Add PR checklist to enforce OpenAPI & Mermaid sequence diagrams conformance

Deliverables:
- .eslintrc.* and .prettierrc
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
- [ ] Scaffold Vite React TS app in apps/web
  - [ ] apps/web/package.json set name "@fuep/web"
- [ ] Env
  - [ ] apps/web/.env with VITE_API_URL=http://localhost:4000
- [ ] Routing
  - [ ] / (Apply), /login, /dashboard
- [ ] API client
  - [ ] axios instance with auth header support

---

## Phase 5 — Shared Types Package
- [ ] Scaffold packages/types
  - [ ] Build script and TS config
  - [ ] Export shared types and zod schemas in later phases

---

## Phase 6 — Core Flows (Foundations First)
- [ ] Auth basics
  - [ ] POST /auth/check-jamb (verify in jamb_prelist)
  - [ ] POST /auth/login
  - [ ] POST /auth/change-password (JWT guard later)
- [ ] Candidate profile foundations
  - [ ] PUT /profile
  - [ ] applications table lifecycle foundations
- [ ] Payments — init shape only (no provider yet)
  - [ ] POST /payments/init → creates initiated payment row
  - [ ] Idempotency key basis
- [ ] FE: Apply → Check JAMB → Start payment (mock URL alert)

---

## Phase 7 — Payment Gateway Integration
- [ ] Provider selection abstraction (Remita primary; Flutterwave fallback)
- [ ] Remita integration
  - [ ] Init API
  - [ ] Webhook endpoint
  - [ ] Verify API for reconciliation
- [ ] Flutterwave fallback
  - [ ] Init, webhook, verify
- [ ] Security
  - [ ] Webhook signature verification
  - [ ] Retriable reconciliation worker
- [ ] Receipts
  - [ ] receipt.generate queue and PDF template

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
- Phase 2 (Local Infrastructure Bring-up) completed:
  - Services healthy (Postgres, Redis, MinIO, MailHog)
  - Schema initialized; v_dashboard_summary created
  - Test data seeded (jamb_prelist: TEST123)
  - MinIO bucket created (uploads)
- Phase 3 (Backend Bootstrap) in progress:
  - API server running on http://localhost:4000 with GET /health returning 200
  - Core bootstrap completed (AppModule, middleware, CORS, ConfigModule)
  - Knex configured for Postgres connectivity
- Frontend not yet scaffolded.

### Immediate Next 10 Tasks
1. Add environment validation schema for required vars via @nestjs/config (Phase 3)
2. Add database connectivity check on startup and log result (Phase 3)
3. Implement POST /auth/check-jamb using jamb_prelist (Phase 3)
4. Add basic global exception filter and validation pipe (Phase 3)
5. Scaffold Vite React app in apps/web (Phase 4)
6. Create axios client and routes (/ , /login, /dashboard) (Phase 4)
7. Create apps/web/.env with VITE_API_URL=http://localhost:4000 (Phase 4)
8. Initialize git repository and commit baseline (Phase 1)
9. Add ESLint + Prettier configs and format scripts (Phase 1)
10. Add PR checklist to enforce OpenAPI & Mermaid conformance (Phase 1)

---

Last Updated: 2025-08-16
Next Review: 2025-08-23
