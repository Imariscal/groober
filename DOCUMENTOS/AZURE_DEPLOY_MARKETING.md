# VibraLive - Deploy a Azure + Marketing

## 📋 ESTADO ACTUAL DEL PROYECTO
✅ **Listo para Deploy:**
- Frontend: Next.js 14 (completo)
- Backend: NestJS + TypeORM (funcional sin WhatsApp)
- DB: PostgreSQL (schema definido)
- Cache: Redis (implementado)
- Servicios: Route Optimizer (Python)

❌ **Sin implementar (pero NO necesario para launch):**
- Integración WhatsApp Business API
- Mensajería de marketing

---

## 🚀 OPCIÓN 1: DEPLOY RECOMENDADO EN AZURE (Rápido)

### Arquitectura
```
Frontend → Azure Static Web Apps (Next.js)
Backend → Azure App Service (Node.js)
DB → Azure Database for PostgreSQL
Cache → Azure Cache for Redis
Route Optimizer → Azure Container Instances (Python)
```

### Paso 1: Preparar Dockerfiles

**Backend Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

EXPOSE 3000
CMD ["npm", "run", "start"]
```

### Paso 2: Variables de entorno para Azure

**Backend (.env en Azure):**
```env
DATABASE_HOST=vibralive-pg.postgres.database.azure.com
DATABASE_PORT=5432
DATABASE_USER=postgres@vibralive-pg
DATABASE_PASSWORD=[SECURE_PASSWORD_VAULT]
DATABASE_NAME=vibralive_prod

REDIS_HOST=vibralive-redis.redis.cache.windows.net
REDIS_PORT=6379
REDIS_PASSWORD=[SECURE_PASSWORD_VAULT]

ROUTE_OPTIMIZER_URL=https://vibralive-route-opt.northeurope.azurecontainer.io:8001

API_PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://vibralive.azurestaticapps.net
JWT_SECRET=[SECURE_PASSWORD_VAULT]
```

**Frontend (next.config.js para Azure):**
```javascript
const apiBackend = process.env.API_BACKEND_URL || 'https://vibralive-api.azurewebsites.net';
```

### Paso 3: Recursos Azure a crear

| Recurso | Tipo | Ubicación | Costo/Mes |
|---------|------|-----------|-----------|
| PostgreSQL | Azure DB | Europa Oeste | ~$30-50 |
| Redis | Cache | Europa Oeste | ~$20-40 |
| App Service | Backend | Europa Oeste | ~$60-100 |
| Static Web Apps | Frontend | Global | ~$0-10 |
| Container Instances | Route Opt | Europa Oeste | ~$20-40 |
| **TOTAL** | | | **~$130-240** |

---

## 💰 OPCIÓN 2: MÁS ECONÓMICA (Contenedores compartidos)

Usar **Azure Container Apps** en lugar de App Service:
- Mismo deploy pero **20-40% más barato**
- Auto-scaling automático
- Mejor para microservicios

---

## 📱 OPCIONES PARA MARKETING EN AZURE

### 1. **Azure Bot Service + QnA Maker** ⭐ MEJOR OPCIÓN
**Costo:** ~$10-30/mes

**Casos de uso:**
- Chatbot para responder preguntas sobre servicios
- Ayuda automática de clientes
- Calificar leads automáticamente

**Implementación:**
```json
{
  "chatbot": {
    "service": "Azure Bot Service",
    "channels": ["Teams", "Facebook", "Web"],
    "knowledge_base": "QnA Maker",
    "integration": "API REST a tu backend"
  }
}
```

### 2. **Azure Communication Services** ⭐ PARA NOTIFICACIONES
**Costo:** $0.01 por SMS, $0.0025 por email

**Casos de uso:**
- Enviar confirmación de citas por SMS
- Recordatorios automáticos
- Ofertas y promociones por email

**Ejemplo de uso:**
```typescript
// Backend - Integración en NestJS
import { EmailClient } from "@azure/communication-email";

const emailClient = new EmailClient(connectionString);

await emailClient.send({
  senderAddress: "noreply@vibralive.com",
  recipients: { to: [{ address: "cliente@email.com" }] },
  content: { subject: "Tu cita está confirmada", plainText: "..." }
});
```

### 3. **Azure Maps** 
**Costo:** ~$50/mes (generoso)

**Ya tienes implementado en tu código!**
- Geolocalización de clínicas
- Rutas optimizadas
- Mapas integrados

### 4. **Power BI + Azure Synapse** (Analytics)
**Costo:** $15-30/mes

**Para dashboards ejecutivos:**
- Reportes de citas por mes
- Ingresos por período
- Análisis de clientes más frecuentes

### 5. **Azure Cognitive Services** (IA)
**Costo:** Por uso (~$0.50-2.00 por 1K análisis)

**Usos para marketing:**
- Text Analytics: Analizar reseñas de clientes
- Computer Vision: Procesar fotos de mascotas
- Language Understanding: Mejorar chatbot

---

## 🎯 ESTRATEGIA RECOMENDADA (Fase 1)

### MVP de Marketing con presupuesto mínimo:

#### 1️⃣ **Email + SMS** (4 horas)
```typescript
// Recordatorios automáticos de citas
- Azure Communication Services
- Scheduled Job en backend cada 24h
- Costo: $0.0025-0.01 por notificación
```

#### 2️⃣ **Chatbot Simple** (8 horas)
```typescript
// Preguntas frecuentes en sitio web
- Azure Bot Service
- QnA Maker con 50 preguntas frecuentes
- Costo: ~$20/mes
```

#### 3️⃣ **Landing Page de Captación** (4 horas)
```typescript
// Usando tu frontend actual
- Formulario de contacto → leads a BD
- Integración con Communication Services
- CTA: "Conoce nuestras tarifas"
```

**Inversión total Fase 1:** ~$50/mes + 16 horas

---

## 📊 COMPARATIVA: DEPLOY OPCIONES

### Opción A: Azure App Service (Recomendada para empezar)
```
✅ Más fácil de mantener
✅ Buena documentación
✅ Soporte incluido
❌ Un poco más cara
Costo: $100-150/mes
```

### Opción B: Azure Container Apps (Si escalas rápido)
```
✅ Más económica
✅ Auto-scaling automático
✅ Mejor para múltiples servicios
❌ Más compleja de configurar
Costo: $50-80/mes
```

### Opción C: Docker en Azure Kubernetes (Enterprise)
```
✅ Máxima flexibilidad
✅ Perfecto para equipos
❌ Complejo, necesita DevOps
Costo: $200+/mes
```

---

## 🔧 CHECKLIST PREVIO A DEPLOY

### Frontend
- [ ] Build producción ejecuta sin errores: `npm run build`
- [ ] Variables de entorno configuradas: `API_BACKEND_URL=https://...`
- [ ] Linting limpio: `npm run lint`
- [ ] Tests pasan: `npm test`

### Backend
- [ ] Build producción: `npm run build`
- [ ] Migrations ejecutadas: `npm run migration:run`
- [ ] Tests pasan: `npm test`
- [ ] Variables .env completas (sin hardcodes)
- [ ] CORS configurado solo para dominio de Azure

### Dockerfiles
- [ ] Ambos Dockerfile creados y testeados localmente
- [ ] docker-compose.yml actualizado para producción
- [ ] Image registry preparado (Azure Container Registry)

### BD
- [ ] SQL Server/PostgreSQL creado en Azure
- [ ] Migrations aplicadas
- [ ] Backup automático configurado
- [ ] Usuario DB con permisos limitados

---

## 🚀 PASOS PARA HACER DEPLOY (Orden)

### SEMANA 1: Infraestructura
1. Crear Azure Container Registry (para guardar imágenes Docker)
2. Crear Azure Database for PostgreSQL
3. Crear Azure Cache for Redis
4. Crear Azure App Service (backend)
5. Crear Azure Static Web Apps (frontend)

### SEMANA 2: Deploy
1. Build y pushear Dockerfiles a Registry
2. Deployar backend en App Service
3. Ejecutar migrations en BD
4. Deployar frontend en Static Web Apps
5. Pruebas E2E en producción

### SEMANA 3: Marketing
1. Configurar Azure Communication Services
2. Crear flujo de emails de bienvenida
3. Implementar Basic chatbot con Bot Service
4. Crear landing page de captación

---

## 💡 TIPS IMPORTANTES PARA TU CASO

### 1. NO NECESITAS ESPERAR A WhatsApp
- Deploy ahora con email + SMS
- Integra WhatsApp después (es un canal adicional)
- Los clientes pueden reservar sin WhatsApp

### 2. ESCALABILIDAD PENSADA
- Tu arquitectura permite agregar WhatsApp sin cambiar nada
- Azure Bot Service ya soporta WhatsApp Channel
- Solo necesitas crear el bot cuando lo necesites

### 3. COSTO REAL ESTIMADO
```
Mes 1-3: $150-200 (setup + primeros usuarios)
Mes 4+: $100-150 (estable, sin WhatsApp)
Mes 4+ (con WhatsApp): $150-250 (con notificaciones activas)
```

### 4. DOMINIO + SSL
- Usar Azure App Service Custom Domain
- SSL gratuito incluido
- O comprar dominio en Azure Domains

---

## 📞 SIGUIENTES PASOS

**Pregunta:**
1. ¿Cuál es tu dominio? (ej: vibralive.com)
2. ¿Ubicación preferida Azure? (Europa, América, Asia)
3. ¿Cuántos usuarios esperados primer mes?
4. ¿Budget máximo para infraestructura?

Respondiendo esto, puedo:
1. Crear script de deploy automatizado
2. Generar Terraform/Bicep para provisionar Azure
3. Configurar CI/CD pipeline (GitHub → Azure automático)

