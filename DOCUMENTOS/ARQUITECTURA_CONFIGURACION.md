# 🏗️ Arquitectura de Configuración - VibraLive

## El Problema Raíz (Por qué se desconfigura)

Se desconfiguraba porque:
1. **URLs hardcodeadas** en el código (cuando se copia `.env.example`)
2. **Falta de defaults correctos** en los archivos de configuración
3. **Confusión entre desarrollo/producción** sin separación clara
4. **Variables de entorno inconsistentes** entre FE y BE

---

## La Solución: Backend Proxy Pattern

```
┌─────────────────────────────────────────┐
│  FRONTEND (localhost:3000)              │
│  - Uses RELATIVE paths: /api/*          │
│  - NO environment-based URLs            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  NEXT.JS PROXY (next.config.js)         │
│  rewrite: /api/* → localhost:3001/api/* │
│  🔒 Server-side (NO CORS)               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  BACKEND (localhost:3001)               │
│  - Receives request at /api/*           │
│  - CORS enabled as fallback             │
└─────────────────────────────────────────┘
```

### **Why This Works:**
- ✅ The proxy is **server-side**, browser never makes cross-origin requests
- ✅ Frontend code has **NO absolute URLs** to break
- ✅ Configuration is in ONE place: `next.config.js`
- ✅ CORS is a fallback, not the main mechanism

---

## 📋 Configuration Files (Source of Truth)

### **Frontend (.env.local)**
```env
# NO NEXT_PUBLIC_API_URL - it's configured via proxy
# Only set service-specific URLs
NEXT_PUBLIC_MAPS_PROVIDER=google
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_ROUTE_OPTIMIZER_URL=http://localhost:8001
```

**Why?**
- FE code uses `/api/*` relative paths
- Next.js rewrites to backend (configured in code)
- No environment dependency → no breakage on startup

### **Backend (.env)**
```env
API_PORT=3001
API_PREFIX=api
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

**Why?**
- Sets PORT where BE listens
- CORS is a safety net (if FE tries direct requests)
- FRONTEND_URL is for emails, redirects, etc

### **Next.js Config (next.config.js)**
```javascript
rewrites: async () => {
  const apiBackend = process.env.API_BACKEND_URL || 'http://localhost:3001';
  return {
    beforeFiles: [{
      source: '/api/:path*',
      destination: `${apiBackend}/api/:path*`,
    }],
  };
}
```

**Why?**
- Maps `/api/*` to backend transparently
- ONE place to change backend URL
- Environment variable is optional (has sensible default)

---

## 🔧 Base URL Configuration in Code

### ✅ CORRECT (What We Use)

```typescript
// api-client.ts
const API_URL = '/api';
axios.create({ baseURL: API_URL });

// In components
fetch('/api/auth/login')
```

### ❌ INCORRECT (What We DON'T Do Anymore)

```typescript
// DO NOT DO THIS
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
axios.create({ baseURL: API_URL });

// This breaks on startup if .env is wrong
fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`)
```

---

## 📚 Files to Check on Startup

| File | Purpose | Status |
|------|---------|--------|
| `vibralive-frontend/.env.local` | FE environment | ✅ Correct |
| `vibralive-frontend/next.config.js` | FE proxy config | ✅ Correct |
| `vibralive-frontend/src/lib/api-client.ts` | FE API client | ✅ baseURL: '/api' |
| `vibralive-backend/.env` | BE environment | ✅ CORS enabled |
| `vibralive-backend/src/main.ts` | BE CORS setup | ✅ enableCors() |

---

## 🚀 How to Startup (Always Works)

```bash
# Backend
cd vibralive-backend
npm run start:dev
# Listens on http://localhost:3001

# Frontend (new terminal)
cd vibralive-frontend
npm run dev
# Listens on http://localhost:3000
# Automatically proxies /api/* to localhost:3001
```

**No configuration needed** - Defaults work:
- FE uses `/api/*` (hardcoded in code)
- Next.js rewrites to `http://localhost:3001/api/*` (hardcoded in next.config.js)
- Backend CORS allows localhost:3000 (in .env)

---

## 🔐 Production Setup

For production, ONLY change ONE place:

### Option A: Change next.config.js
```javascript
const apiBackend = process.env.API_BACKEND_URL || 'https://api.example.com';
```

Then set environment variable:
```bash
API_BACKEND_URL=https://api.example.com npm run build
```

### Option B: Change next.config.js directly
```javascript
const apiBackend = 'https://api.example.com';
```

**That's it.** Everything else automatically uses the correct backend.

---

## ✅ Why This Never Breaks

1. **No environment variables in FE code** - No async loading that might fail
2. **No hardcoded URLs in code** - Centralized proxy in next.config.js  
3. **Sensible defaults** - Works out-of-box with localhost
4. **CORS fallback** - Even if proxy fails, CORS is configured
5. **Server-side proxy** - No browser cache issues, no CORS headers problems

---

## 🎯 Summary

**Old (Breaks on startup):**
```
.env.example (wrong) → .env.local (inherits wrong values) → Code breaks
```

**New (Always works):**
```
Code has relative paths (/api/*) → next.config.js proxy → Backend
No environment anxiety, no reconfigurations needed
```

---

## 📞 Checklist (Before Asking "Why did CORS break?")

- [ ] Is the FE code using `/api/*` paths? (not absolute URLs)
- [ ] Is `next.config.js` proxying `/api/*`?
- [ ] Is backend CORS configured for localhost:3000?
- [ ] Did you restart BOTH FE and BE after changes?
- [ ] Did you clear `.next` folder?

If all yes, it **will** work. 🎉
