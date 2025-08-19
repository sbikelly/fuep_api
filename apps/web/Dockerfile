# syntax=docker/dockerfile:1.7
# Multi-stage Dockerfile for Vite React app (pnpm, Node 20) -> Nginx static
# Cross-platform and cache-friendly

# ========== Base ==========
FROM node:20.13.1-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# ========== Deps ==========
FROM base AS deps
# Copy only root manifests and workspace file for efficient caching
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml /app/
RUN pnpm install --frozen-lockfile

# Copy only web package manifest to resolve its deps
COPY ./package.json /app/apps/web/package.json
COPY ../../tsconfig.base.json /app/tsconfig.base.json

# Install web workspace deps (filtered)
RUN pnpm --filter @fuep/web install --frozen-lockfile

# ========== Build ==========
FROM deps AS build
# Build-time args for Vite (baked into bundle)
ARG VITE_API_BASE_URL=http://localhost:4000
ARG VITE_BRAND_PRIMARY_COLOR=#134F47
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_BRAND_PRIMARY_COLOR=${VITE_BRAND_PRIMARY_COLOR}

# Copy source
COPY . /app/apps/web
COPY ../../tsconfig.base.json /app/tsconfig.base.json

# Build with Vite
WORKDIR /app/apps/web
RUN pnpm build

# ========== Runtime (Nginx) ==========
FROM nginx:alpine AS runtime
# Branding color as meta reference if needed in server headers
ENV BRAND_PRIMARY_COLOR=FF134F47

# Copy built assets
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
# Custom Nginx config
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]