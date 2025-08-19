# syntax=docker/dockerfile:1.7
# Multi-stage Dockerfile for Express API (ESM, pnpm, Node 20)
# Cross-platform friendly, no shell-specific commands in scripts

# ========== Base ==========
FROM node:20.13.1-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /app

# ========== Dependencies ==========
FROM base AS deps

# Only copy root manifests that affect lock resolution
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml /app/
# Only install workspace root (pnpm will use the lockfile)
RUN pnpm install --frozen-lockfile

# Copy only API package manifests to generate its node_modules graph
COPY ./package.json /app/apps/api/package.json
COPY ../../tsconfig.base.json /app/tsconfig.base.json

# Install API workspace dependencies (filtered)
RUN pnpm --filter @fuep/api install --frozen-lockfile

# ========== Build ==========
FROM deps AS build

# Copy API source
COPY . /app/apps/api
# Copy shared configs that TS relies on
COPY ../../tsconfig.base.json /app/tsconfig.base.json

# Build API
WORKDIR /app/apps/api
RUN pnpm build

# ========== Runtime ==========
FROM base AS runtime

ENV NODE_ENV=production
ENV PORT=4000
# Branding color for downstream decisions
ENV BRAND_PRIMARY_COLOR=FF134F47

WORKDIR /app

# Copy only the built artifacts and production deps
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/tsconfig.base.json /app/tsconfig.base.json

EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]