# Estados de Campañas - Guía Completa

## Máquina de Estados 

```
┌─────────┐
│  DRAFT  │  ← Estado inicial cuando creas una campaña
└────┬────┘
     │ (usuario hace clic en "▶️ Ejecutar")
     ▼
┌───────────┐
│ SCHEDULED │  ← Campaña programada pero esperando ser ejecutada
└────┬──────┘
     │ (sistema auto-ejecuta o usuario ejecuta manualmente)
     ▼
┌─────────┐
│ RUNNING │  ← Campaña en ejecución, enviando mensajes
└────┬────┘
     │
     ├─ (usuario hace clic "⏸️ Pausar")
     │  ▼
     │ ┌────────┐
     │ │ PAUSED │  ← Campaña pausada, puede reanudar
     │ └───┬────┘
     │     └─ (usuario hace clic "▶️ Reanudar")
     │        └─> vuelve a RUNNING
     │
     └─ (todos los mensajes se enviaron exitosamente)
        ▼
     ┌───────────┐
     │ COMPLETED │  ← Campaña terminada correctamente
     └───────────┘

¡CANCELACIÓN DESDE CUALQUIER ESTADO!
┌─────────┐  ┌───────────┐  ┌─────────┐  ┌────────┐  ┌───────────┐
│  DRAFT  │  │ SCHEDULED │  │ RUNNING │  │ PAUSED │  │ COMPLETED │
└────┬────┘  └─────┬─────┘  └────┬────┘  └───┬────┘  └─────┬─────┘
     │             │             │            │            │
     └─────────────┴─────────────┴────────────┴────────────┘
                            │
                  (usuario cancela o error)
                            ▼
                       ┌───────────┐
                       │ CANCELLED │  ← Campaña cancelada (terminal)
                       └───────────┘
```

## Descripción detallada de cada estado

### 1️⃣ **DRAFT** (Borrador)
**¿Cuándo ocurre?**
- Al crear una nueva campaña

**¿Qué puedes hacer?**
- ✏️ Editar nombre, descripción, filtros, periodicidad
- ▶️ Ejecutar la campaña (ir a RUNNING directamente)
- 🗑️ Eliminar la campaña
- ⏹️ Cancelar

**¿Cuándo avanza?**
- Usuario hace clic "▶️ Ejecutar" → va a **RUNNING**
- Usuario cancela → va a **CANCELLED**
- Usuario elimina → la campaña desaparece

**Ejemplo:** Creaste una campaña pero aún no quieres enviar. Estás configurando los filtros, probando diferentes opciones.

---

### 2️⃣ **SCHEDULED** (Programada)
**¿Cuándo ocurre?**
- Cuando defines una fecha/hora futura para ejecutar la campaña
- O simplemente haces clic "Programar" sin ejecutar inmediatamente

**¿Qué puedes hacer?**
- ⏹️ Cancelar antes de que se ejecute
- Esperar a que llegue la fecha programada (sistema auto-ejecuta)

**¿Cuándo avanza?**
- Llega `scheduledAt` → sistema auto-ejecuta → va a **RUNNING**
- Usuario cancela → va a **CANCELLED**

**Ejemplo:** Programaste una campaña para mañana a las 9 AM. El sistema espera esa hora y la ejecuta automáticamente.

---

### 3️⃣ **RUNNING** (En ejecución)
**¿Cuándo ocurre?**
- Usuario hace clic "▶️ Ejecutar" desde DRAFT
- O el sistema auto-ejecuta desde SCHEDULED

**¿Qué ocurre?**
- Sistema genera los `campaign_recipients` (lista de gente que recibirá el mensaje)
- Sistema envía los mensajes a todos los destinatarios
- `successfulCount` y `failedCount` van aumentando

**¿Qué puedes hacer?**
- ⏸️ Pausar la campaña (ir a PAUSED)
- ⏹️ Cancelar (ir a CANCELLED)

**¿Cuándo avanza?**
- **Opción 1: Termina naturalmente**
  - Se enviaron todos los mensajes
  - Sistema calcula: ¿Hay `nextScheduledAt`? (¿es recurrente?)
    - SI → va a **RUNNING** nuevamente (se re-ejecuta)
    - NO → va a **COMPLETED**

- **Opción 2: Usuario pausa**
  - Usuario hace clic "⏸️ Pausar" → va a **PAUSED**

- **Opción 3: Usuario cancela**
  - Usuario hace clic "⏹️ Cancelar" → va a **CANCELLED**

**Ejemplo:** Campaña de recordatorio de vacunas enviando a 500 clientes. Es viernes 9 AM, está en RUNNING. El sistema envía 450, falla con 50.

---

### 4️⃣ **PAUSED** (Pausada)
**¿Cuándo ocurre?**
- Usuario hace clic "⏸️ Pausar" mientras está RUNNING

**¿Qué sucede?**
- Sistema detiene el envío
- `pausedAt` y `pausedByUserId` se guardan
- Los destinatarios que YA recibieron el mensaje quedan con status `SENT`
- Los que AÚN no reciben quedan con status `PENDING`

**¿Qué puedes hacer?**
- ▶️ Reanudar (ir a RUNNING - continúa enviando a los PENDING)
- ⏹️ Cancelar (ir a CANCELLED)

**¿Cuándo avanza?**
- Usuario hace clic "▶️ Reanudar" → va a **RUNNING** (sigue de donde se pausó)
- Usuario cancela → va a **CANCELLED**

**Ejemplo:** Enviando campaña de navidad pero la empresa decide pausarla. Luego de revisar el contenido, la reanudan y sigue donde se quedó.

---

### 5️⃣ **COMPLETED** (Terminada)
**¿Cuándo ocurre?**
- La campaña terminó de ejecutarse (no es recurrente)
- Se enviaron todos los mensajes posibles
- Ya NO es recurrente (`isRecurring = false`)

**¿Qué puedes hacer?**
- ❌ NADA - es un estado terminal
- Solo puedes ver métricas y analytics

**Ejemplo:** Campaña de descuento de fin de año se envió a todos. Ya completó. Solo ves el reporte: "Enviado a 5000, abierto por 3500, leído por 2100".

---

### 6️⃣ **CANCELLED** (Cancelada)
**¿Cuándo ocurre?**
- Usuario hace clic "⏹️ Cancelar" desde cualquier estado
- Sistema cancela por error interno grave

**¿Qué sucede?**
- Se DETIENE el envío
- Los destinatarios PENDING quedan con status `SKIPPED`
- Los ya enviados quedan como están

**¿Qué puedes hacer?**
- ❌ NADA - es un estado terminal
- Solo puedes verla en el historial

**Ejemplo:** Enviaste campaña promocional pero te das cuenta que el 10% de descuento debería ser 15%. Cancelas inmediatamente y creas una nueva.

---

## Cómo se genera el "Flujo Automático"

### Sistema de Auto-Ejecución

Existen 2 formas que una campaña pase de un estado a otro:

#### **Opción 1: Usuario hace clic (Manual)**
```
Usuario hace clic en "▶️ Ejecutar"
        ↓
Backend recibe petición POST /api/campaigns/{id}/start
        ↓
Backend valida: ¿status es DRAFT o SCHEDULED?
        ↓
Sistema genera recipients (campaign_recipients)
        ↓
Sistema envía mensajes
        ↓
Cuando termina → ¿es recurrente?
        ├─ SI → calcula nextScheduledAt y queda en estado listo
        └─ NO → va a COMPLETED
```

#### **Opción 2: Sistema auto-ejecuta (Automático - FALTA IMPLEMENTAR)**
```
Cron job verifica cada minuto:
        ↓
¿Hay campañas con status=SCHEDULED y scheduledAt <= ahora?
        ↓
SI → Ejecuta todas automáticamente (mismo que Opción 1)
        ↓
NO → Espera el próximo minuto
```

---

## Estados de los Destinatarios (campaign_recipients)

Mientras una campaña está `RUNNING`, cada destinatario tiene su propio estado:

```
PENDING       → Esperando ser enviado
     ↓
QUEUED        → En cola para enviar
     ↓
SENT          → Mensaje enviado
     ├─→ DELIVERED  → Entregado (WhatsApp confirmó)
     ├─→ OPENED     → Usuario abrió el mensaje (Email)
     ├─→ READ       → Usuario leyó el mensaje (WhatsApp)
     └─→ FAILED     → Falló el envío (sin internet, número inválido, etc)

SKIPPED       → Saltado (campaña fue cancelada/pausada y no se envió)
```

---

## Resumen: Tablas de Transiciones Permitidas

### ¿Qué puedes hacer desde cada estado?

| Estado | ▶️ Ejecutar | ⏸️ Pausar | ▶️ Reanudar | ⏹️ Cancelar | ✏️ Editar | 🗑️ Eliminar |
|--------|-----------|---------|-----------|----------|---------|-----------|
| DRAFT | ✅ → RUNNING | ❌ | ❌ | ✅ → CANCELLED | ✅ | ✅ |
| SCHEDULED | ✅ → RUNNING | ❌ | ❌ | ✅ → CANCELLED | ❌ | ❌ |
| RUNNING | ❌ | ✅ → PAUSED | ❌ | ✅ → CANCELLED | ❌ | ❌ |
| PAUSED | ❌ | ❌ | ✅ → RUNNING | ✅ → CANCELLED | ❌ | ❌ |
| COMPLETED | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| CANCELLED | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Ejemplo Práctico: Campaña Recurrente

Supongamos una **campaña diaria de recordatorio de vacunas**:

```
Día 1 (Lunes)
├─ 09:00 AM → status RUNNING (sistema auto-ejecuta)
├─ 9:15 AM → envía a 1000 clientes
├─ 9:30 AM → lastSentAt = 2026-03-09 09:30
├─ 9:31 AM → nextScheduledAt = 2026-03-10 09:00 (mañana)
└─ 9:32 AM → status = RUNNING (sigue disponible para pausar/cancelar)

Día 2 (Martes)
├─ 09:00 AM → sistema detecta nextScheduledAt llegó
├─ Sistema LIMPIA los recipients del día anterior
├─ Sistema GENERA nuevos recipients del día de hoy
├─ Sistema ENVÍA a 1000 clientes (algunos nuevos, algunos repetidos)
├─ 9:15 AM → lastSentAt = 2026-03-10 09:00
├─ 9:16 AM → nextScheduledAt = 2026-03-11 09:00
└─ 9:17 AM → status = RUNNING (lista para el próximo día)

... continúa indefinidamente o hasta recurrenceEndDate

Día 60 (recurrenceEndDate = 30 días después)
├─ 09:00 AM → ejecuta la última vez
├─ 9:15 AM → verifica: ¿nextScheduledAt supera recurrenceEndDate?
├─ SI → nextScheduledAt = null
├─ Transiciona a status = COMPLETED
└─ Ya no se ejecuta más
```

---

## Lo que Necesitamos Implementar Aún

### 1. **Cron Job de Auto-Ejecución** (FALTA)
```typescript
// En campaign.scheduler.ts (aún no existe)
@Cron('0 * * * * *') // Cada minuto
async executePendingCampaigns() {
  const campaigns = await this.campaignRepo.findByStatus(
    CampaignStatus.SCHEDULED,
  );

  for (const campaign of campaigns) {
    if (campaign.scheduledAt <= new Date()) {
      // Ejecutar automáticamente
      await this.campaignService.startCampaign(
        campaign.clinicId,
        campaign.id,
      );
    }
  }
}
```

### 2. **Transición a COMPLETED Automática** (FALTA)
```typescript
// En campaign-sender.ts o similar (aún no existe)
async after recipients are sent:
  if (campaign.isRecurring && campaign.nextScheduledAt) {
    // Sigue disponible para ejecutarse nuevamente
    // status sigue siendo RUNNING (o podría ser SCHEDULED)
  } else {
    // No hay más ejecuciones
    await this.campaignRepo.update(campaignId, {
      status: CampaignStatus.COMPLETED,
    });
  }
```

### 3. **Limpieza de Recipients Anterior** (FALTA)
```typescript
// Cuando se re-ejecuta una campaña recurrente:
// Necesitamos LIMPIAR los recipients viejos (de la ejecución anterior)
// y GENERAR nuevos basados en los filtros actuales
await this.recipientRepo.deleteAllForCampaign(campaignId);
await this.generateRecipients(clinicId, campaignId);
```
