# syntax=docker/dockerfile:1.7
# Multi-stage Dockerfile for Express API (ESM, pnpm, Node 20)
# Cross-platform friendly, no shell-specific commands in scripts
# Optimized for Render.com deployment

# ========== Base ==========
FROM node:20.13.1-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm install -g pnpm@10.14.0

WORKDIR /app

# ========== Dependencies ==========
FROM base AS deps

# Copy the types package source and build it standalone
COPY packages/types /app/packages/types
WORKDIR /app/packages/types
RUN pnpm install
RUN pnpm build

# Now handle the API dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY apps/api/package.json /app/apps/api/package.json
COPY tsconfig.base.json /app/tsconfig.base.json

# Install dependencies without workspace filtering
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @fuep/api install --frozen-lockfile

# ========== Build ==========
FROM deps AS build

# Copy API source
COPY apps/api /app/apps/api
# Copy shared configs that TS relies on
COPY tsconfig.base.json /app/tsconfig.base.json

# Build API
WORKDIR /app/apps/api
RUN pnpm build

# ========== Runtime ==========
FROM base AS runtime

ENV NODE_ENV=production
ENV PORT=4000
# Branding color for downstream decisions
ENV BRAND_PRIMARY_COLOR=FF134F47

# Install wget for health checks and curl for better debugging
RUN apk add --no-cache wget curl

WORKDIR /app/apps/api

# Copy only the built artifacts and production deps
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=deps /app/packages/types/dist /app/packages/types/dist
COPY --from=deps /app/packages/types/package.json /app/packages/types/package.json
COPY --from=deps /app/packages/types/node_modules /app/packages/types/node_modules
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/apps/api/package.json /app/apps/api/package.json
COPY --from=build /app/tsconfig.base.json /app/tsconfig.base.json

# Copy OpenAPI documentation to the correct location
COPY docs /app/apps/api/docs

# Copy database migration files for initialization
COPY infra/db /app/infra/db

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 4000

# Health check for Render
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/api/health || exit 1

CMD ["node", "dist/main.js"]