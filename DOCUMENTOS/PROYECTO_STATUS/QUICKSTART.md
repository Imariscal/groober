# 🚀 VibraLive - Quick Start Guide

Bienvenido a **VibraLive**, el Micro-SaaS de retención para veterinarias.

## 📋 Requisitos Previos

- **Node.js 20+** - [Descargar](https://nodejs.org/)
- **Docker y Docker Compose** - [Descargar](https://www.docker.com/products/docker-desktop)
- **Git** - [Descargar](https://git-scm.com/)

## ⚡ Inicio Rápido (5 minutos)

### 1. Inicia los Servicios (PostgreSQL + Redis)

```bash
cd VibraLive

# Inicia PostgreSQL, Redis y PgAdmin
docker-compose up -d

# Verifica que estén corriendo
docker-compose ps
```

**Servicios disponibles:**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- PgAdmin: `http://localhost:5050` (admin@vibralive.local / admin)

### 2. Setup del Backend

```bash
cd vibralive-backend

# Instala dependencias
npm install

# Configura variables de entorno (local development)
# .env.local ya viene preconfigurado

# Inicializa la base de datos
npm run seed

# Inicia el servidor de desarrollo
npm run start:dev
```

Server corriendo en: **http://localhost:3000**

**Credenciales de prueba (después de seed):**
- Owner: `owner@vibralive.test` / `Admin@123456`
- Staff: `staff@vibralive.test` / `Staff@123456`

### 3. Setup del Frontend

```bash
cd ../vibralive-frontend

# Instala dependencias
npm install

# Inicia el dev server
npm run dev
```

Frontend en: **http://localhost:3000**

## 📦 Estructura del Proyecto

```
VibraLive/
├── vibralive-backend/        # NestJS API
│   ├── src/
│   │   ├── database/         # TypeORM entities, migrations, seeds
│   │   ├── modules/          # Feature modules (auth, users, clients, etc)
│   │   ├── common/           # Guards, decorators, middleware
│   │   └── config/           # Configuration
│   ├── package.json
│   └── README.md
│
├── vibralive-frontend/       # Next.js App
│   ├── src/
│   │   ├── app/             # Pages (App Router)
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities & API client
│   │   ├── hooks/           # Custom hooks
│   │   ├── store/           # Zustand stores
│   │   └── types/           # TypeScript types
│   ├── package.json
│   └── README.md
│
├── infra/                   # Infrastructure as Code
│   └── (Azure templates - próximamente)
│
├── docker-compose.yml       # Local development services
└── README.md               # Este archivo
```

## 🔑 Variables de Entorno

### Backend (.env.local)
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=vibralive_dev
DATABASE_PASSWORD=vibralive_password
DATABASE_NAME=vibralive_db

JWT_SECRET=super-secret-key-change-in-production
API_PORT=3000
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🔌 Verificar Conexiones

### Backend Health Check
```bash
curl http://localhost:3000/health
# Response: { "status": "ok", "timestamp": "..." }
```

### Database Connection
```bash
# Desde PostgreSQL
psql -h localhost -U vibralive_dev -d vibralive_db
```

### Redis Connection
```bash
redis-cli ping
# Response: PONG
```

## 📚 Próximos Pasos

### Crear tu primer Cliente y Mascota

1. Abre **http://localhost:3000** en el navegador
2. Login: `owner@vibralive.test` / `Admin@123456`
3. Navega a "Clientes"
4. Crea un nuevo cliente (ej: "Juan Pérez")
5. Añade una mascota (ej: "Max" - Perro)
6. Establece fechas de próximas vacunas/desparasitación

### Explorar la API

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@vibralive.test","password":"Admin@123456"}'

# Listar usuarios (con token JWT)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/users
```

## 🛠️ Comandos Útiles

### Backend
```bash
cd vibralive-backend

npm run start:dev          # Dev con hot reload
npm run build              # Compilar TypeScript
npm run lint               # Linter
npm run test               # Tests
npm run seed               # Llenar DB con datos de prueba
npm run migration:create   # Crear migración
```

### Frontend
```bash
cd vibralive-frontend

npm run dev                # Dev server
npm run build              # Build para producción
npm run lint               # Linter
npm run type-check         # Verificar tipos TypeScript
```

### Docker
```bash
docker-compose up -d       # Inicia servicios
docker-compose down        # Para servicios
docker-compose logs -f     # Ver logs en vivo
docker-compose ps          # Ver estado
```

## 📱 Prueba el Login

**URL:** http://localhost:3000/auth/login

```
Email: owner@vibralive.test
Password: Admin@123456
```

Después de login, serás redirigido al dashboard.

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Cambiar puerto backend en .env.local
API_PORT=3001

# O matar el proceso ocupando el puerto
# En Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# En Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### Database Connection Error
```bash
# Verifica que PostgreSQL esté corriendo
docker-compose ps

# Si no está, reinicia
docker-compose restart postgres

# Verifica credenciales en .env.local
```

### Module Not Found
```bash
# Reinstala dependencias
rm -rf node_modules package-lock.json
npm install
```

### CORS Error
Asegúrate de que `CORS_ORIGIN` en backend incluya tu frontend URL:
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

## 📖 Documentación

- **Backend API:** Ver [vibralive-backend/README.md](vibralive-backend/README.md)
- **Frontend:** Ver [vibralive-frontend/README.md](vibralive-frontend/README.md)
- **Plan Arquitectónico:** Ver documento PLAN inicial

## 🎯 Hoja de Ruta (Fase 1)

### ✅ Completado
- [x] Estructura NestJS backend
- [x] Entidades y relaciones (TypeORM)
- [x] Autenticación JWT
- [x] CRUDs: Users, Clients, Pets, Animal Types
- [x] Estructura Next.js frontend

### ⏳ En Progreso
- [ ] Módulo de Reminders (scheduling)
- [ ] Integración WhatsApp webhook
- [ ] Message logging

### 📋 Por Hacer
- [ ] Azure deployment (App Service, Static Web Apps, Functions)
- [ ] UI Dashboard completa
- [ ] Tests unitarios
- [ ] Documentación API (Swagger)

## 🚀 Deployment en Azure

*Instrucciones próximamente. Ver infra/ folder para IaC templates.*

## ❓ Preguntas?

Revisa la documentación en cada carpeta o contacta al equipo de VibraLive.

## 📄 Licencia

PROPRIETARY - VibraLive Team 2026

---

¡Feliz desarrollo! 🎉
