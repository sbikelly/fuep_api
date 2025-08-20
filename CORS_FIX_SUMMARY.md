# 🚀 **CORS & Connectivity Issue Resolution Summary**

## 🔍 **Root Cause Analysis**

The frontend-to-backend connectivity issue was caused by a **Docker networking vs. browser networking mismatch**:

1. **Docker DNS Resolution**: `http://api:4000` only works inside Docker containers where `api` resolves to the container's IP
2. **Browser Context**: When accessing `http://localhost:5173`, the browser runs on the host machine and cannot resolve `api` hostname
3. **CORS Failure**: The browser tried to fetch from `http://api:4000` (which failed to resolve), resulting in a network error before CORS even came into play

**The Problem Chain:**

```
Browser (localhost:5173) → fetch("http://api:4000/health") → DNS resolution fails → NetworkError → CORS never reached
```

## 🛠️ **Solution: Single-Origin Reverse Proxy Architecture**

Implemented **Option 1 (Recommended)** - a reverse proxy that serves both frontend and API under a single origin, eliminating CORS entirely.

### **Architecture Overview**

```
Browser → http://localhost:8080 (Nginx Proxy)
├── / → Frontend (React App)
└── /api/* → Backend API (Node.js/Express)
```

## 📁 **Files Modified/Created**

### **1. API CORS Configuration**

**File**: `apps/api/src/main.ts`

- Updated CORS to support multiple origins
- Added comprehensive origin validation
- Enhanced security headers and methods

### **2. Nginx Reverse Proxy**

**File**: `infra/nginx/nginx.conf` (NEW)

- Proxies `/api/*` requests to `api:4000`
- Serves frontend static files
- Includes security headers and compression
- Health check endpoint

### **3. Frontend Configuration Utility**

**File**: `apps/web/src/utils/config.ts`

- Smart API base URL detection
- Environment-aware fallbacks
- Support for both local dev and Docker

### **4. Runtime Configuration**

**File**: `apps/web/index.html`

- Updated `window.APP_CONFIG` to use `/api` by default
- Runtime configuration injection

### **5. Vite Development Server**

**File**: `apps/web/vite.config.ts`

- Dev server proxy for `/api` → `http://localhost:4000`
- Local development without CORS

### **6. Docker Compose**

**File**: `docker-compose.yml`

- Added `proxy` service (Nginx)
- Modified `web` service to use internal port only
- Health checks and dependencies

### **7. Environment Files**

**Files**: `apps/web/.env.local`, `apps/api/.env.local` (NEW)

- Local development configuration
- Separate from Docker environment

### **8. Package Scripts**

**File**: `package.json`

- Added development scripts
- Docker management commands

## 🚀 **Two Supported Workflows**

### **A. Local Development (No Docker)**

```bash
# Terminal 1: Start API
pnpm dev:api

# Terminal 2: Start Frontend
pnpm dev:web

# Access:
# Frontend: http://localhost:5173
# API: http://localhost:4000
# Vite proxy handles /api → localhost:4000
```

### **B. Docker Compose (Single Command)**

```bash
# Start everything
docker compose up -d --build

# Access:
# Frontend + API: http://localhost:8080
# Direct API: http://localhost:4000

# Stop everything
docker compose down
```

## 🔧 **Configuration Details**

### **API CORS Origins Allowed**

```typescript
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'http://127.0.0.1:5173', // Vite dev server (alternative)
  'http://localhost:8080', // Docker reverse proxy
  'http://127.0.0.1:8080', // Docker reverse proxy (alternative)
  'http://localhost', // Local development
  'http://127.0.0.1', // Local development (alternative)
];
```

### **Frontend API Base URL Logic**

```typescript
// Smart fallback based on environment detection
if (window.location.port === '8080') {
  // Running behind reverse proxy (Docker Compose)
  return '/api';
} else if (window.location.port === '5173') {
  // Running on Vite dev server (local development)
  return 'http://localhost:4000';
} else {
  // Generic fallback
  return '/api';
}
```

### **Nginx Proxy Configuration**

```nginx
# API proxy - all /api/* requests go to the backend
location /api/ {
  # Remove /api prefix when forwarding to backend
  rewrite ^/api/(.*) /$1 break;

  proxy_pass http://api_backend;
  # ... proxy headers and timeouts
}
```

## ✅ **Verification Commands**

### **Docker Compose Health Check**

```bash
# Check service status
docker compose ps

# View logs
docker compose logs -f

# Test endpoints
curl -i http://localhost:8080          # Frontend
curl -i http://localhost:8080/api/health # API via proxy
curl -i http://localhost:4000/health   # Direct API
```

### **Local Development Test**

```bash
# Test API directly
curl -i http://localhost:4000/health

# Test Vite proxy (when running)
curl -i http://localhost:5173/api/health
```

## 🎯 **Benefits of New Architecture**

1. **No CORS Issues**: Single origin eliminates cross-origin problems
2. **Production Ready**: Reverse proxy is production-standard
3. **Flexible Development**: Supports both local and Docker workflows
4. **Security**: Proper headers and origin validation
5. **Performance**: Nginx compression and caching
6. **Scalability**: Easy to add more services behind proxy

## 🚨 **Important Notes**

1. **Port Changes**:
   - Docker: Frontend now accessible at `http://localhost:8080` (not 5173)
   - Local: Frontend still at `http://localhost:5173`

2. **API Endpoints**:
   - Docker: Use `/api/health` (relative paths)
   - Local: Use `http://localhost:4000/health` (absolute paths)

3. **Environment Variables**:
   - Docker: Built into container
   - Local: Use `.env.local` files

## 🔄 **Migration Path**

1. **Existing Users**: Update bookmarks to `http://localhost:8080`
2. **API Consumers**: Use `/api/*` endpoints when behind proxy
3. **Development**: Choose local or Docker workflow based on preference

## 📚 **Next Steps**

1. **Testing**: Verify all frontend features work with new API paths
2. **Documentation**: Update API documentation to reflect new endpoints
3. **Monitoring**: Add logging and metrics to proxy
4. **SSL**: Add HTTPS support for production deployment

---

**Status**: ✅ **RESOLVED** - CORS and connectivity issues fixed with reverse proxy architecture
**Last Updated**: August 20, 2025
**Architecture**: Single-origin reverse proxy with Nginx
