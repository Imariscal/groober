# Campaign Automation - Implementación Completa

## 1️⃣ CRON Job para Auto-Ejecutar Campañas SCHEDULED

### Servicio: `CampaignSchedulerService`
**Ubicación**: `/src/modules/campaigns/services/campaign.scheduler.ts`

```typescript
// Se ejecuta CADA MINUTO automáticamente
@Cron(CronExpression.EVERY_MINUTE)
async executeScheduledCampaigns(): Promise<void>
```

**¿Qué hace?**
- Cada minuto verifica si hay campañas con `status = SCHEDULED` y `scheduledAt <= ahora`
- Ejecuta automáticamente todas las campañas que llegaron a su hora
- Maneja errores sin afectar las otras campañas
- Registra logs detallados de ejecuciones

**Flujo:**
```
⏱️ Cada minuto (00 segundos)
    ↓
Busca campañas con SCHEDULED status y scheduledAt en el pasado
    ↓
¿Encontró campañas?
    ├─ SÍ → Ejecuta cada una (llamando a campaignService.startCampaign)
    │       ↓
    │      SCHEDULED → RUNNING
    │       ↓
    │      Se generan recipients y se envían mensajes
    │
    └─ NO → Espera el próximo minuto
```

**Endpoint para Testing Manual:**
```
POST /campaigns/scheduler/trigger
Response: { executedCount: number, errors: Array }
```

---

## 2️⃣ Auto-Transición a COMPLETED

### Métodos en `CampaignService`

#### `completeCampaignExecution(clinicId, campaignId)`
Llamado cuando la campaña termina de enviar TODOS los mensajes.

**Lógica:**
```
¿Es recurrente (isRecurring = true)?
    ├─ SÍ → ¿Hay nextScheduledAt?
    │        ├─ SÍ → Transiciona a SCHEDULED (esperando próxima ejecución)
    │        └─ NO → Transiciona a COMPLETED (sin más ejecuciones)
    │
    └─ NO → Transiciona a COMPLETED (no es recurrente)
```

**Ejemplo:**
```typescript
// Campaña NO recurrente que terminó de enviar
status: RUNNING → COMPLETED ✅

// Campaña DIARIA que terminó hoy a las 9 AM
status: RUNNING → SCHEDULED (scheduledAt = mañana 9 AM)
                  ↓ (mañana 9 AM)
                  RUNNING (se auto-ejecuta de nuevo)
```

#### `getCampaignExecutionProgress(campaignId)`
Devuelve el progreso actual:
```json
{
  "total": 1000,
  "pending": 250,
  "sent": 500,
  "delivered": 200,
  "failed": 50,
  "skipped": 0,
  "percentage": 75
}
```

#### `isCampaignExecutionComplete(campaignId)`
Verifica si ya no hay recipients pendientes de enviar.

---

## 3️⃣ Reportes Detallados de Recipients

### Servicio: `CampaignAnalyticsService`
**Ubicación**: `/src/modules/campaigns/services/campaign-analytics.service.ts`

### Endpoint 1: Breakdown por Status
```
GET /campaigns/:campaignId/recipients/breakdown

Response:
{
  "total": 1000,
  "statusCounts": {
    "PENDING": 100,
    "SENT": 500,
    "DELIVERED": 250,
    "READ": 100,
    "OPENED": 50,
    "FAILED": 0,
    "SKIPPED": 0,
    "QUEUED": 0
  },
  "percentages": {
    "PENDING": 10.0,
    "SENT": 50.0,
    "DELIVERED": 25.0,
    ...
  }
}
```

### Endpoint 2: Métricas Completas
```
GET /campaigns/:campaignId/analytics

Response:
{
  "campaign": {
    "id": "uuid",
    "name": "Recordatorio vacunas",
    "status": "RUNNING",
    "channel": "WHATSAPP"
  },
  "delivery": {
    "total": 1000,
    "sent": 500,
    "delivered": 250,
    "failed": 0,
    "pending": 250,
    "skipped": 0
  },
  "engagement": {
    "opened": 150,
    "read": 100,
    "openRate": 15.0,
    "readRate": 10.0
  },
  "statusBreakdown": {
    "PENDING": 250,
    "SENT": 500,
    ...
  }
}
```

### Endpoint 3: Recipients Filtrados por Status
```
GET /campaigns/:campaignId/recipients/status/:status?limit=50

Parameters:
- :status = PENDING | SENT | DELIVERED | FAILED | READ | OPENED | SKIPPED | QUEUED
- ?limit = cantidad de resultados (default 50)

Response:
[
  {
    "id": "uuid",
    "campaignId": "uuid",
    "clientId": "uuid",
    "petId": "uuid",
    "recipientName": "Juan García",
    "recipientEmail": "juan@example.com",
    "recipientPhone": "+34912345678",
    "status": "SENT",
    "sentAt": "2026-03-09T09:30:00Z",
    "deliveredAt": null,
    "errorCode": null
  },
  ...
]
```

### Endpoint 4: Progreso de Ejecución
```
GET /campaigns/:campaignId/progress

Response:
{
  "total": 1000,
  "pending": 250,      ← Aún sin enviar
  "sent": 700,         ← Ya enviados
  "delivered": 400,
  "failed": 50,
  "skipped": 0,
  "percentage": 75     ← 75% completado
}
```

### Método: Comparar Campañas
```typescript
async compareCampaigns(campaignIds: string[])
↓
Response:
[
  {
    "campaignId": "uuid1",
    "name": "Campaña 1",
    "totalRecipients": 1000,
    "sentCount": 950,
    "deliveredCount": 800,
    "failedCount": 50,
    "openRate": 45.5,
    "readRate": 32.1
  },
  {
    "campaignId": "uuid2",
    "name": "Campaña 2",
    "totalRecipients": 500,
    "sentCount": 480,
    "deliveredCount": 420,
    "failedCount": 20,
    "openRate": 52.5,
    "readRate": 38.75
  }
]
```

---

## Actualización en Campaign Repository

### Nuevo método en `CampaignRecipientRepository`
```typescript
async countByDeliveryStatus(campaignId: string): 
  Promise<Record<RecipientStatus, number>>

Retorna:
{
  "PENDING": 100,
  "SENT": 500,
  "DELIVERED": 250,
  "READ": 100,
  "OPENED": 50,
  "FAILED": 0,
  "SKIPPED": 0,
  "QUEUED": 0
}
```

---

## Flujo Completo: Campaña Recurrente Diaria

```
DÍA 1 (Lunes, 9 AM)
├─ 09:00:00 → CRON detecta scheduledAt
├─ 09:00:01 → status SCHEDULED → campaignService.startCampaign()
├─ 09:00:02 → status = RUNNING
├─ 09:00:03 → Genera 1000 recipients en PENDING
├─ 09:00:04 → Inicia envío de mensajes
├─ 09:30:00 → lastSentAt = 2026-03-09 09:30:00
├─ 09:30:01 → Calcula nextScheduledAt = 2026-03-10 09:00:00
├─ 09:30:02 → Verifica: ¿isRecurring?
├─ 09:30:03 → SÍ, hay nextScheduledAt
├─ 09:30:04 → status = SCHEDULED (para mañana)
└─ Completed execution for Day 1 ✅

DÍA 2 (Martes, 9 AM)
├─ 09:00:00 → CRON detecta scheduledAt nuevamente
├─ 09:00:01 → status SCHEDULED → startCampaign()
├─ 09:00:02 → Limpia recipients del día anterior
├─ 09:00:03 → Genera 1000 NEW recipients (algunos nuevos, algunos repetidos)
├─ 09:00:04 → Inicia envío
├─ 09:30:00 → lastSentAt = 2026-03-10 09:30:00
├─ 09:30:01 → Calcula nextScheduledAt = 2026-03-11 09:00:00
└─ ✅ Sigue hasta recurrenceEndDate

DÍA 60 (si recurrenceEndDate = 30 días después)
├─ Ejecuta por última vez
├─ Calcula nextScheduledAt
├─ ¡nextScheduledAt SUPERA recurrenceEndDate!
├─ nextScheduledAt = null
├─ status = COMPLETED (nunca más se ejecuta)
└─ 🎉 Finished!
```

---

## Resumen de Cambios

### ✅ Archivos Creados
1. `campaign.scheduler.ts` - Cron job automático
2. `campaign-analytics.service.ts` - Reportes y analytics

### ✅ Archivos Modificados
1. `campaign.service.ts` - Nuevos métodos de finalización
2. `campaign.controller.ts` - Nuevos endpoints
3. `campaign.repository.ts` - Nuevo método findScheduledForExecution
4. `campaign-recipient.repository.ts` - Actualización countByDeliveryStatus
5. `campaigns.module.ts` - Inyección de nuevos servicios
6. `services/index.ts` - Exportación de nuevos servicios

### 📊 Nuevos Endpoints API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/campaigns/:id/progress` | Progreso actual de ejecución |
| GET | `/campaigns/:id/analytics` | Métricas detalladas |
| GET | `/campaigns/:id/recipients/breakdown` | Desglose por estado |
| GET | `/campaigns/:id/recipients/status/:status` | Recipients filtrados |
| POST | `/scheduler/trigger` | Triggerpara test manual |

---

## Cómo Funciona en Producción

### Sin hacer nada manualmente:
```
1️⃣ CRON job corre cada minuto
   ↓
2️⃣ Busca campañas que deben ejecutarse
   ↓
3️⃣ Las ejecuta automáticamente (startCampaign)
   ↓
4️⃣ Genera recipients
   ↓
5️⃣ Envía mensajes
   ↓
6️⃣ Cuando termina, revisa si es recurrente:
   ├─ SÍ → Actualiza nextScheduledAt (status = SCHEDULED)
   └─ NO → status = COMPLETED
   ↓
7️⃣ Si es recurrente, espera nextScheduledAt
   ↓
8️⃣ CRON lo detecta y vuelve a ejecutar en el paso 2
```

### API para Dashboards:
```
Cada 5 segundos, frontend solicita:
GET /campaigns/:id/progress
GET /campaigns/:id/analytics
GET /campaigns/:id/recipients/breakdown

Muestra:
- 75% completado
- 750 enviados, 100 entregados, 50 fallidos
- Tasa de apertura: 45%
- Progreso en tiempo real con animaciones
```
