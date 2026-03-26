# 🚀 VibraLive - Quick Start (Development)

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Port 3000 (Frontend), 3001 (Backend) available

## Quick Start

### 1️⃣ Backend Setup
```bash
cd vibralive-backend

# Install dependencies
npm install

# Set up database (if not already done)
npm run typeorm:run

# Start dev server
npm run start:dev
```

✅ Backend runs on: `http://localhost:3001`

### 2️⃣ Frontend Setup (New Terminal)
```bash
cd vibralive-frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

✅ Frontend runs on: `http://localhost:3000`

### 3️⃣ Open Browser
```
http://localhost:3000
```

**That's it!** No configuration needed.

---

## 🔒 How CORS is Handled (The Architecture)

```
Browser Request
  └─→ POST /api/auth/login
       └─→ Next.js Proxy (server-side)
            └─→ Rewrites to http://localhost:3001/api/auth/login
                 └─→ Backend returns response
                      └─→ No CORS! (was server-side)
```

**Frontend code always uses relative paths:**
```typescript
fetch('/api/auth/login')       // ✅ Correct (will be proxied)
fetch('http://localhost:3001') // ❌ Never do this (CORS error)
```

---

## ⚠️ If You Get CORS Errors

### Check Boxes (in order)
- [ ] Did you start BOTH backend and frontend?
- [ ] Are you accessing http://localhost:3000 (not 3001)?
- [ ] Did you clear `.next` folder? (`rm -r .next`)
- [ ] Did you restart the frontend? (Ctrl+C, then `npm run dev`)

### If still broken
Check the error message:
```
Access to XMLHttpRequest at 'http://localhost:3001/api/*'
```

**This means the code is trying to access the backend directly.**

Solution: Search for `http://localhost:3001` in the codebase:
```bash
grep -r "http://localhost:3001" vibralive-frontend/src/
```

Should find nothing. If it does, remove those hardcoded URLs.

---

## 🛠️ Configuration Files (Don't Touch)

| File | Purpose | Status |
|------|---------|--------|
| `vibralive-frontend/.env.local` | FE config | ✅ Ready (don't add API URLs here) |
| `vibralive-frontend/next.config.js` | FE proxy | ✅ Ready (proxies /api/* to 3001) |
| `vibralive-backend/.env` | BE config | ✅ Ready (CORS configured) |
| `vibralive-backend/src/main.ts` | BE startup | ✅ Ready (CORS enabled) |

**If you feel like changing something,** read [ARQUITECTURA_CONFIGURACION.md](./ARQUITECTURA_CONFIGURACION.md)

---

## 📚 Common Tasks

### Login Test
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vibralive.test","password":"Admin@123456"}'
```

### Check Backend Health
```bash
curl http://localhost:3001/api/health
```

### Clear Frontend Build Cache
```bash
cd vibralive-frontend
rm -r .next
npm run dev
```

### View DB (if using pgAdmin)
```
http://localhost:5050
```

---

## 🚨 If Something "Desconfigures" (Stops Working After Reboot)

This architecture was built so it **never happens again**. But if it does:

1. **Check FE code** - No hardcoded URLs
   ```bash
   grep -r "http://localhost:3001" vibralive-frontend/src/
   ```

2. **Check .env.local** - No API URLs
   ```bash
   cat vibralive-frontend/.env.local | grep API_URL
   ```
   Should return nothing.

3. **Check next.config.js** - Proxy is there
   ```bash
   grep -A 5 "source: '/api" vibralive-frontend/next.config.js
   ```

4. **Restart both servers** - Always works
   ```bash
   # Terminal 1: Backend
   cd vibralive-backend && npm run start:dev
   
   # Terminal 2: Frontend
   cd vibralive-frontend && rm -r .next && npm run dev
   ```

---

## 🎯 Key Points to Remember

✅ **DO:**
- Use `/api/*` paths in code
- Put service URLs (Maps, Route Optimizer) in .env.local
- Change backend URL only in next.config.js
- Restart both servers if things break

❌ **DON'T:**
- Add `NEXT_PUBLIC_API_URL=http://localhost:3001` to .env.local
- Use absolute URLs in code (`http://localhost:...`)
- Modify api-client.ts baseURL
- Forget to restart servers after changes

---

## 📞 Support

Created with ❤️ by the VibraLive Team

Architecture: Backend Proxy Pattern (server-side CORS prevention)  
Last Updated: 2026-03-12
