# syntax=docker/dockerfile:1.7
# Multi-stage Dockerfile for Vite React app (pnpm, Node 20) -> Nginx static
# Cross-platform and cache-friendly

# ========== Base ==========
FROM node:20.13.1-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm install -g pnpm@10.14.0
WORKDIR /app

# ========== Deps ==========
FROM base AS deps

# Copy the types package source and build it standalone
COPY packages/types /app/packages/types
WORKDIR /app/packages/types
RUN pnpm install
RUN pnpm build

# Now handle the web dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY apps/web/package.json /app/apps/web/package.json
COPY tsconfig.base.json /app/tsconfig.base.json

# Install dependencies without workspace filtering
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @fuep/web install --frozen-lockfile

# ========== Build ==========
FROM deps AS build
# Build-time args for Vite (baked into bundle)
ARG VITE_BRAND_PRIMARY_COLOR=#134F47
ARG VITE_API_BASE_URL=http://api:4000
ENV VITE_BRAND_PRIMARY_COLOR=${VITE_BRAND_PRIMARY_COLOR}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy source
COPY apps/web /app/apps/web
COPY tsconfig.base.json /app/tsconfig.base.json

# Create .env file for Vite build and ensure environment variables are available
WORKDIR /app/apps/web
RUN echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" > .env
RUN echo "VITE_BRAND_PRIMARY_COLOR=${VITE_BRAND_PRIMARY_COLOR}" >> .env
RUN echo "Environment variables:" && cat .env

# Build with Vite
RUN pnpm build

# ========== Runtime (Nginx) ==========
FROM nginx:alpine AS runtime
# Branding color as meta reference if needed in server headers
ENV BRAND_PRIMARY_COLOR=FF134F47

# Copy built assets
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
# Custom Nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]