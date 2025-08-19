# Contributing Guide

Thanks for your interest in contributing to the FUEP Post-UTME Portal.

This repository uses pnpm and a monorepo layout.

## Prerequisites

- Node.js 20.x (see .nvmrc / .tool-versions)
- pnpm 10.x
- Docker Desktop (for local services)

## Quick Start

```bash
# Install workspace deps
pnpm install

# Start local services (Postgres, Redis, MinIO, MailHog)
docker compose up -d

# Set environment variables
cp .env.example .env
cp apps/api/.env.example apps/api/.env

# Run API (Express)
pnpm dev:api
```

## Branching & Commits

- Use feature branches prefixed with `feature/`, `fix/`, or `chore/`.
- Commits must follow Conventional Commits (enforced via commitlint).
  - Examples:
    - feat(api): add education record endpoint
    - fix(db): correct knex connection handling
    - chore(ci): add node cache

## Lint, Typecheck, Build

```bash
pnpm lint            # ESLint (Flat config)
pnpm typecheck       # TypeScript project references
pnpm build           # Build all packages
pnpm format          # Prettier write
pnpm format:check    # Prettier check
```

## Tests

Add tests per package and wire into `pnpm test`. If no tests yet, leave a placeholder.

## Pull Requests

- Ensure lint, typecheck, and build pass locally.
- Describe changes and link to relevant issue(s).
- Keep PRs focused and reasonably small.

## Security

Report vulnerabilities per SECURITY.md.

## Code of Conduct

See CODE_OF_CONDUCT.md.

## Documentation

- OpenAPI spec: docs/openapi.yaml (authoritative)
- Sequence diagrams: docs/sequence-diagrams.md (authoritative)
- Setup and developer workflows: README.md and SETUP_INSTRUCTIONS.md
