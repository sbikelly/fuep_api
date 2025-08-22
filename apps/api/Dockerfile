# syntax=docker/dockerfile:1.7
# Multi-stage Dockerfile for Express API (ESM, pnpm, Node 20)
# Cross-platform friendly, no shell-specific commands in scripts

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

# Install wget for health checks
RUN apk add --no-cache wget

WORKDIR /app

# Copy only the built artifacts and production deps
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=deps /app/packages/types/dist /app/packages/types/dist
COPY --from=deps /app/packages/types/package.json /app/packages/types/package.json
COPY --from=deps /app/packages/types/node_modules /app/packages/types/node_modules
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/apps/api/package.json /app/apps/api/package.json
COPY --from=build /app/tsconfig.base.json /app/tsconfig.base.json

# Copy OpenAPI documentation
COPY docs /app/docs

EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]