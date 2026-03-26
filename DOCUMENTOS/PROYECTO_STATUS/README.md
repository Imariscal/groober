# VibraLive - Micro-SaaS Retención Veterinaria

**Versión:** 0.1.0 (Fase 1 - MVP)

Motor automático de retención para veterinarias en México con recordatorios por WhatsApp.

## 📖 Descripción

VibraLive es un Micro-SaaS multi-clínica que automatiza el recordatorio de mascotas sobre vacunas y desparasitación mediante WhatsApp. Fase 1 incluye:

- ✅ Panel web multi-clínica
- ✅ Gestión de clientes y mascotas
- ✅ Automatización de recordatorios (7d, 1d, seguimiento 24h)
- ✅ Integración WhatsApp Cloud API
- ✅ Auditoría completa de mensajes

## 🏗️ Stack Tecnológico

### Backend
- **NestJS** - Framework Node.js modular
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos multi-tenant
- **Jest** - Testing

### Frontend
- **Next.js 14** - React framework con App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utilidad-first CSS
- **Zustand** - State management

### Cloud (Azure)
- **App Service** - Backend hosting
- **Static Web Apps** - Frontend hosting
- **Azure Functions** - Job scheduling (reminders)
- **PostgreSQL Flexible** - Database managed
- **Key Vault** - Secrets management
- **Application Insights** - Monitoring

### Herramientas
- **Docker** - Containerización
- **GitHub Actions** - CI/CD

## 🚀 Quick Start

Ver [QUICKSTART.md](QUICKSTART.md)

### TL;DR
```bash
# 1. Inicia servicios
docker-compose up -d

# 2. Backend
cd vibralive-backend && npm install && npm run seed && npm run start:dev

# 3. Frontend (en otra terminal)
cd vibralive-frontend && npm install && npm run dev

# Login: owner@vibralive.test / Admin@123456
```

## 📁 Estructura

```
VibraLive/
├── vibralive-backend/     # NestJS API
├── vibralive-frontend/    # Next.js App
├── infra/                 # Infrastructure (Azure)
├── docker-compose.yml     # Local dev services
├── QUICKSTART.md         # Guía de inicio
├── README.md             # Este archivo
└── PLAN.md               # Plan arquitectónico detallado
```

## 🔐 Seguridad

- JWT para API authentication
- Passwords hasheados con bcrypt
- Validación de webhook signature (HMAC)
- Rate limiting
- CORS configurado
- Secrets en Azure Key Vault
- Logging sin datos sensibles

## 📊 Database Schema

### Tablas Principales
- **clinics** - Multi-tenant root
- **users** - Staff por clínica (owner, staff)
- **animal_types** - Tipos de mascota (Perro, Gato, etc) - editable por clínica
- **clients** - Dueños de mascotas
- **pets** - Registros de mascotas con fechas de próxima vacuna/desparasitación
- **reminders** - Campañas automáticas (7d, 1d, seguimiento)
- **message_logs** - Auditoría de todos los mensajes (enviados/recibidos)

## 🔄 Flujo de Reminders

```
Mascota tiene next_vaccine_date=2026-02-23
     ↓
[7 días antes] → Envía recordatorio (WhatsApp)
     ↓
[1 día antes] → Envía recordatorio urgente
     ↓
[Si no confirma + pasó fecha] → Envía seguimiento 24h después
```

Los usuarios responden "SI" o "CONFIRMO" para confirmar la cita.

## 📡 API Endpoints

Ver [vibralive-backend/README.md](vibralive-backend/README.md) para lista completa.

**Ejemplos:**
- `POST /api/auth/login`
- `POST /api/clients`
- `POST /api/pets`
- `GET /api/reminders`
- `POST /api/webhook/whatsapp` - Webhook de Meta

## 🎯 Fase 1 - MVP

**Objetivo:** Sistema funcional de retención con reminders automáticos por WhatsApp.

### ✅ Completado
- Arquitectura Azure
- Base de datos multi-tenant
- CRUD all entities
- Authentication JWT
- Estructura frontend
- Docker setup

### ⏳ En Progreso
- Reminders engine (Timer Function)
- WhatsApp webhook integration
- UI Dashboard

### 📋 Fase 2 (Future)
- Payment & subscription management
- Advanced reporting
- CRM features
- Integración veterinaria (software VetSoft, etc)
- Mobile app

## 🛠️ Desarrollo

### Comandos Backend
```bash
cd vibralive-backend
npm run start:dev          # Hot reload
npm run seed               # Llenar con datos de prueba
npm run migration:run      # Aplicar migraciones
npm run build              # Compilar
npm run test               # Tests
```

### Comandos Frontend
```bash
cd vibralive-frontend
npm run dev                # Dev server
npm run build              # Build
npm run lint               # ESLint
```

### Docker
```bash
docker-compose up -d       # Inicia PostgreSQL, Redis, PgAdmin
docker-compose logs -f     # Ver logs
docker-compose down        # Detiene
```

## 🌐 Deployment

### Local Development
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- PgAdmin: `http://localhost:5050`

### Production (Azure)
- Frontend Static Web Apps: `https://vibralive.com`
- Backend App Service: Detrás de Application Gateway
- Database: PostgreSQL Flexible Server
- Functions: Timer triggers para reminders

## 📚 Documentación

- **[PLAN.md](PLAN.md)** - Arquitectura y plan técnico detallado (Semanas 1-4)
- **[vibralive-backend/README.md](vibralive-backend/README.md)** - Documentación Backend
- **[vibralive-frontend/README.md](vibralive-frontend/README.md)** - Documentación Frontend
- **[QUICKSTART.md](QUICKSTART.md)** - Guía de inicio rápido

## 🤝 Team

- Arquitecto: CTO - Diseño de sistema
- Developer: Implementación full-stack

## 📄 Licencia

PROPRIETARY - VibraLive Team 2026

---

**Última actualización:** Febrero 16, 2026
