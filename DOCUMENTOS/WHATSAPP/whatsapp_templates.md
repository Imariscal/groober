# 📱 WhatsApp Templates Strategy - VibraLive

**Fecha:** Marzo 26, 2026  
**Versión:** 1.0  
**Status:** Design Complete  
**Author:** Architecture Team

---

## 📋 Tabla de Contenidos

1. [El Problema](#el-problema)
2. [Conceptos Clave](#conceptos-clave)
3. [Dos Mundos Diferentes](#dos-mundos-diferentes)
4. [Solución: Templates + Chatbot](#solución-templates--chatbot-nueva-estrategia)
5. [Implementación Técnica](#implementación-técnica)
6. [Ejemplos Prácticos](#ejemplos-prácticos)
7. [Matriz de Decisiones](#matriz-de-decisiones)
8. [Templates + Chatbot Feature](#-templates--chatbot-nueva-feature---prioridad-phase-1)
9. [Roadmap](#-roadmap)
10. [Conclusión](#-conclusión)

---

## 🎯 El Problema

### **Conflicto Principal**

```
┌─────────────────────────────────────────┐
│ OPCIÓN A: Seguridad de Costos           │
├─────────────────────────────────────────┤
│ ✅ BARATO: $0.005 USD por mensaje       │
│ ✅ RÁPIDO: Aprobación Meta una vez      │
│ ❌ SIN CUSTOMIZACIÓN: Todos igual       │
│ ❌ NO RENTABLE: Margen bajo             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ OPCIÓN B: Flexibilidad de Usuario       │
├─────────────────────────────────────────┤
│ ✅ PERSONALIZACIÓN: Cada clínica escoge │
│ ✅ RENTABLE: $1.00+ por mensaje         │
│ ❌ CARO: 200x más costoso               │
│ ❌ LIMITACIONES: 24h window, muchos QA  │
└─────────────────────────────────────────┘
```

**Usuario pregunta:**
> "Si usamos Twilio templates, todas las clínicas usuarán los mismos mensajes. ¿Cómo permito customización?"

**Respuesta:** 🎨 **DUAL MODE CON TIERS** - Monetizar la flexibilidad

---

## 🧠 Conceptos Clave

### **1. Meta-Approved Templates (Twilio)**

Plantillas **pré-aprobadas por Meta** que se envían a través de Twilio.

```
Características:
├─ Crear UNA VEZ en Meta/Twilio
├─ Nombre: "recordatorio_cita_4h"
├─ Estructura FIJA: {{1}}, {{2}}, {{3}}
├─ Variables posicionales
├─ Aprobación manual (1-2 días)
└─ Costo: $0.0050 - $0.0080 USD

Ejemplo:
┌─────────────────────────────────────────┐
│ Template Name: recordatorio_cita_4h     │
│ Content: "Hola {{1}}, tu cita con      │
│          {{2}} es en {{3}}.             │
│          Confirma escribiendo OK"       │
│                                         │
│ Meta Status: ✅ APPROVED                │
└─────────────────────────────────────────┘

Envío:
await twilioClient.messages.create({
  contentSid: 'HX1234567890abcdef',  // ← Template SID
  contentVariables: JSON.stringify([
    "María",        // {{1}} client_name
    "Firulais",     // {{2}} pet_name
    "14:30"         // {{3}} time
  ])
});
```

**Ventajas:**
- ✅ BARATÍSIMO: $0.005 por mensaje
- ✅ Aprobación de una vez (reutilizar infinito)
- ✅ Garantizado con Meta SLA

**Desventajas:**
- ❌ NO FLEXIBLE: El usuario no puede cambiar
- ❌ TODAS LAS CLÍNICAS IGUAL: Sin diferenciación
- ❌ VARIABLES POSICIONALES: Difícil de mantener

---

### **2. Freeform Messages (Texto Libre)**

Mensajes **personalizados sin aprobación Meta**, enviados directamente.

```
Características:
├─ Flexible: El usuario edita libremente
├─ Variable names: {{client_first_name}}, {{pet_name}}
├─ Cada clínica puede customizar
├─ Sin restricciones de estructura
└─ Costo: $1.00 - $1.30 USD (200x más caro)

Ejemplo:
┌─────────────────────────────────────────┐
│ Clínica: "Patitas Feliz"                │
│ Mensaje: "¡Hola {{client_first_name}}!  │
│          Tu {{pet_name}} está listo     │
│          para recoger. Ven con alegría  │
│          a {{clinic_name}}. 🐾"        │
│                                         │
│ Costo: $1.00 por envío                  │
└─────────────────────────────────────────┘

Envío:
await twilioClient.messages.create({
  body: "¡Hola María! Tu Firulais está..."
  // ← Solo body, sin contentSid
});
```

**Ventajas:**
- ✅ TOTALMENTE FLEXIBLE: Editar cuando quieras
- ✅ PERSONALIZACIÓN: Cada clínica distinto
- ✅ VARIABLES SIMPLES: Fácil de mantener

**Desventajas:**
- ❌ MÁS CARO: $1.00 vs $0.005
- ❌ LIMITACIONES: 24h window después de cliente inicia conversation
- ❌ SIN APROBACIÓN: Riesgo de spam/abuse

---

## 🔄 Dos Mundos Diferentes

### **Meta vs App Templates - Comparación**

| Aspecto | Meta Templates (Twilio) | App Templates (Tu BD) |
|---------|------------------------|----------------------|
| **Dónde vive** | Servidores Meta/Twilio | `message_templates` table |
| **Aprobación** | Meta (manual, 1-2 días) | Ninguna (tu control) |
| **Costo** | $0.005 por mensaje | Depende de tipo |
| **Customización** | ❌ NO (pré-aprobado) | ✅ SÍ (editable) |
| **Uso** | Solo recordatorios simples | Múltiples triggers |
| **Canales** | WHATSAPP solo | Email, SMS, Push, WA |
| **Variables** | {{1}}, {{2}}, {{3}} | {{client_name}}, etc |
| **Aprobación por CLI** | ❌ NO | ✅ SÍ (admin panel) |

---

### **Cómo Trabajan Juntas**

```
PASO 1: TRIGGER (CRON Job)
┌─────────────────────────────────┐
│ "Cita en 4 horas"               │
│ SendRemindersCron() ejecuta      │
└─────────────────────────────────┘
          ⬇️

PASO 2: FETCH CONFIGURATION
┌─────────────────────────────────┐
│ clinic_whatsapp_config          │
│ ├─ send_appointment_reminder=✅ │
│ ├─ subscription_tier="pro"      │
│ └─ display_phone="+5216141234" │
└─────────────────────────────────┘
          ⬇️

PASO 3: FETCH TEMPLATE
┌─────────────────────────────────┐
│ message_templates               │
│ ├─ trigger="appointment_reminder"
│ ├─ channel="whatsapp"           │
│ ├─ whatsappTemplateName="rec.." │
│ └─ body="Hola {{client_name}}.."│
└─────────────────────────────────┘
          ⬇️

PASO 4: DECIDE MODE (por tier)
    ┌─────────────────────────┐
    │ subscription_tier?      │
    ├────────────┬────────────┤
    │            │            │
  FREE/BASIC   PRO      ENTERPRISE
    │            │            │
    ⬇️            ⬇️            ⬇️
┌────────┐  ┌──────────┐  ┌──────────┐
│TEMPLATE│  │ TEMPLATE │  │FREEFORM  │
│MESSAGE │  │ OR       │  │PREFERRED │
│(Meta)  │  │FREEFORM  │  │(flexible)│
│$0.005  │  │(choice)  │  │$1.00     │
└────────┘  └──────────┘  └──────────┘
```

---

## 🎨 Solución: Templates + Chatbot (Nueva Estrategia)

### **El Concepto**

**Máximo ahorro usando Templates Meta + Chatbot interactivo. Freeform solo para PRO customizado.**

```
Plan       Mode                    Cost/msg  Interactivo  Customización
─────────────────────────────────────────────────────────────────────────
FREE       🔒 Template (notif)     $0.005   ❌ NO        ❌ NO
BASIC      🔒 Template (notif)     $0.005   ❌ NO        ❌ NO
PRO        🤖 Template + Chatbot   $0.005   ✅ SÍ        ✅ Freeform opt.
           (respuestas inteligentes)o $1.00 
ENTERPRISE 🤖 Chatbot + Freeform    $0.005   ✅ SÍ        ✅ SÍ (total)
           (máxima flexibilidad)   o $1.00
```

### **Cambio Estratégico**

**ANTES:** Templates o Freeform (dicotomía)  
**AHORA:** Templates + Chatbot = Interactividad sin costo (200x barato vs Freeform)

- ✅ BARATOS: $0.005 por template
- ✅ INTERACTIVOS: El cliente responde (confirma, elige, etc)
- ✅ AUTOMÁTICOS: El sistema reacciona a respuestas
- ❌ NO es chatbot NLU (no es semanal/conversacional arbitraria)
- ❌ Solo para triggers predefinidos con respuestas esperadas

---

### **Flujo de Decisión por Tier**

#### **Plan: FREE / BASIC** 🔒
```
Clínica entra → Busca template → Usa SYSTEM DEFAULT
                                  (Meta-approved)

Registro en BD:
┌───────────────────────────────────┐
│ clinic_id: "clinic_abc"           │
│ subscription_tier: "basic"        │
│ send_appointment_reminder: true   │
└───────────────────────────────────┘

Plantilla sistema:
┌───────────────────────────────────────────────┐
│ clinic_id: "SYSTEM_DEFAULT"                   │
│ trigger: "APPOINTMENT_REMINDER"               │
│ channel: "WHATSAPP"                           │
│ whatsappTemplateName: "recordatorio_cita_4h"  │
│ whatsappTemplateLanguage: "es"                │
│ is_system: TRUE   ← NO se puede editar        │
│ body: "Hola {{1}}, tu cita..."               │
└───────────────────────────────────────────────┘

Envío:
✅ Template Message (contentSid)
💰 Costo: $0.005 por mensaje
```

**Lo que ve la clínica:** "Tu plan incluye mensajes pre-configurados"

---

#### **Plan: PRO / ENTERPRISE** 🎨
```
Clínica entra → Busca template → Opción A o B
                                   ├─ MANTENER template Meta ($0.005)
                                   └─ CUSTOMIZAR freeform ($1.00)

Registro en BD:
┌───────────────────────────────────┐
│ clinic_id: "clinic_xyz"           │
│ subscription_tier: "pro"          │
│ send_appointment_reminder: true   │
└───────────────────────────────────┘

Opción A: Clínica usa template Meta (para ahorrar)
┌─────────────────────────────────────────────┐
│ clinic_id: "clinic_xyz"                     │
│ trigger: "APPOINTMENT_REMINDER"             │
│ channel: "WHATSAPP"                         │
│ whatsappTemplateName: "recordatorio_cita_4h"│
│ is_system: FALSE ← PUEDE CAMBIAR            │
│ body: (inherited from system)               │
└─────────────────────────────────────────────┘

Envío:
✅ Template Message (contentSid)
💰 Costo: $0.005 por mensaje

---

Opción B: Clínica customiza (para flexibilidad)
┌─────────────────────────────────────────────────────┐
│ clinic_id: "clinic_xyz"                             │
│ trigger: "APPOINTMENT_REMINDER"                     │
│ channel: "WHATSAPP"                                 │
│ whatsappTemplateName: NULL ← FREEFORM               │
│ is_system: FALSE ← EDITABLE                         │
│ body: "¡Hola {{client_first_name}}! Tu {{pet_name}}│
│        tiene cita en {{clinic_name}} mañana. 🐾"   │
└─────────────────────────────────────────────────────┘

Envío:
✅ Freeform Message (solo body)
💰 Costo: $1.00 por mensaje
```

**Lo que ve la clínica:** "Elige si quieres mensajes pre-hechos (barato) o personalizados (Premium)"

---

## 🔧 Implementación Técnica

### **1. Estructura de BD**

**message_templates tabla** (YA EXISTE):

```typescript
@Entity('message_templates')
export class MessageTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clinic_id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'enum', enum: MessageTrigger })
  trigger: MessageTrigger;

  @Column({ type: 'enum', enum: MessageChannel })
  channel: MessageChannel;

  // El CORAZÓN del dual mode:
  
  @Column({ type: 'varchar', nullable: true })
  whatsappTemplateName?: string;  // ← Si tiene valor = TEMPLATE MESSAGE
                                  // ← Si NULL = FREEFORM

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'boolean', default: false })
  is_system: boolean;  // ← Si TRUE, no editable

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  // ... otros campos
}
```

**clinic_whatsapp_config tabla** (YA EXISTE):

```typescript
@Column({ type: 'varchar', length: 50, default: 'basic' })
subscription_tier: string;  // 'free' | 'basic' | 'pro' | 'enterprise'
```

---

### **2. Lógica de Decisión en Service**

```typescript
// src/whatsapp/services/whatsapp-message.service.ts

async sendAppointmentReminder(appointmentId, clinicId, clientPhone) {
  // PASO 1: Obtener configuración clínica
  const config = await this.configService.getClinicConfig(clinicId);

  // PASO 2: Verificar si está habilitado
  if (!config.send_appointment_reminder) {
    return { success: false, reason: 'Feature disabled' };
  }

  // PASO 3: Buscar template
  const template = await this.getTemplateForClinic(
    clinicId,
    MessageTrigger.APPOINTMENT_REMINDER,
    MessageChannel.WHATSAPP
  );

  if (!template) {
    return { success: false, error: 'No template configured' };
  }

  // PASO 4: LÓGICA DE DECISIÓN PRINCIPAL
  const decision = this.decideMode(config, template);

  if (decision.mode === 'TEMPLATE_MESSAGE') {
    return this.sendTemplateMessage(clientPhone, template, appointment);
  } else if (decision.mode === 'FREEFORM_MESSAGE') {
    return this.sendFreeformMessage(clientPhone, template, appointment);
  }
}

/**
 * DECISIÓN: ¿Template o Freeform?
 * 
 * REGLAS:
 * 1. Si tier es FREE/BASIC → SIEMPRE template (no choice)
 * 2. Si tier es PRO/ENTERPRISE:
 *    - Si template tiene whatsappTemplateName → TEMPLATE (más barato)
 *    - Si template NO tiene → FREEFORM (customizado)
 */
private decideMode(
  config: ClinicWhatsAppConfig,
  template: MessageTemplate
): { mode: 'TEMPLATE_MESSAGE' | 'FREEFORM_MESSAGE'; cost: number } {
  const tier = config.subscription_tier;

  // Regla 1: FREE/BASIC siempre template
  if (tier === 'free' || tier === 'basic') {
    // Si no tiene template Meta, buscar uno system
    if (!template.whatsappTemplateName) {
      // throw error o usar default
    }
    return { mode: 'TEMPLATE_MESSAGE', cost: 0.005 };
  }

  // Regla 2: PRO/ENTERPRISE opción
  if (tier === 'pro' || tier === 'enterprise') {
    if (template.whatsappTemplateName) {
      // Tiene template → usar template (más barato)
      return { mode: 'TEMPLATE_MESSAGE', cost: 0.005 };
    } else {
      // No tiene template → freeform (flexible)
      return { mode: 'FREEFORM_MESSAGE', cost: 1.0 };
    }
  }

  throw new Error(`Unknown subscription tier: ${tier}`);
}

/**
 * Buscar template:
 * 1. Primero buscas SPECIFIC de la clínica
 * 2. Si no existe, buscas SYSTEM_DEFAULT
 */
private async getTemplateForClinic(
  clinicId: string,
  trigger: MessageTrigger,
  channel: MessageChannel
): Promise<MessageTemplate> {
  // 1. Buscar template de la clínica
  let template = await this.templateRepo.findOne({
    where: {
      clinic_id: clinicId,
      trigger,
      channel,
      is_active: true,
    }
  });

  // 2. Si no existe, buscar system default
  if (!template) {
    template = await this.templateRepo.findOne({
      where: {
        clinic_id: 'SYSTEM_DEFAULT',
        trigger,
        channel,
        is_system: true,
      }
    });
  }

  return template;
}

/**
 * ENVÍO: Template Message (Meta-approved, barato)
 */
private async sendTemplateMessage(
  phone: string,
  template: MessageTemplate,
  appointment: Appointment
) {
  const message = await this.twilioClient.messages.create({
    from: `whatsapp:+1415523888`,
    to: `whatsapp:${phone}`,
    
    // ← Key difference: contentSid (template ID) en lugar de body
    contentSid: this.twilioService.getTemplateSid(
      template.whatsappTemplateName
    ),
    
    // Variables en ORDEN {{1}}, {{2}}, {{3}}
    contentVariables: JSON.stringify([
      appointment.client.first_name,
      appointment.pet.name,
      this.formatAppointmentTime(appointment)
    ])
  });

  return {
    success: true,
    messageId: message.sid,
    mode: 'TEMPLATE_MESSAGE',
    cost: 0.005
  };
}

/**
 * ENVÍO: Freeform Message (flexible, caro)
 */
private async sendFreeformMessage(
  phone: string,
  template: MessageTemplate,
  appointment: Appointment
) {
  // Interpolación: {{variable_name}} → valor real
  const body = this.interpolateTemplate(template.body, {
    client_first_name: appointment.client.first_name,
    client_last_name: appointment.client.last_name,
    client_phone: appointment.client.phone,
    pet_name: appointment.pet.name,
    pet_breed: appointment.pet.breed,
    appointment_date: this.formatDate(appointment.appointment_date),
    appointment_time: this.formatTime(appointment.appointment_date),
    appointment_type: appointment.appointment_type,
    service_name: appointment.service.name,
    clinic_name: appointment.clinic.name,
    clinic_phone: appointment.clinic.phone,
    // ... 15+ variables más
  });

  const message = await this.twilioClient.messages.create({
    from: `whatsapp:+1415523888`,
    to: `whatsapp:${phone}`,
    body  // ← Solo body, sin contentSid
  });

  return {
    success: true,
    messageId: message.sid,
    mode: 'FREEFORM_MESSAGE',
    cost: 1.00
  };
}

/**
 * Interpolación: {{client_first_name}} → "María"
 */
private interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  return result;
}
```

---

### **3. Seed: Crear Templates System**

```typescript
// src/database/seeds/create-system-templates.ts

import { MessageTemplate, MessageTrigger, MessageChannel } from '...';

export async function seedSystemWhatsAppTemplates(
  templateRepo: Repository<MessageTemplate>
) {
  const systemTemplates: Partial<MessageTemplate>[] = [
    {
      // Template 1: Recordatorio de cita
      clinic_id: 'SYSTEM_DEFAULT',
      name: 'Appointment Reminder - 4h before',
      trigger: MessageTrigger.APPOINTMENT_REMINDER,
      channel: MessageChannel.WHATSAPP,
      whatsappTemplateName: 'recordatorio_cita_4h',
      whatsappTemplateLanguage: 'es',
      body: 'Hola {{1}}, tu cita con {{2}} es en {{3}}. Confirma escribiendo OK',
      is_system: true,
      is_active: true,
    },
    
    {
      // Template 2: Confirmación de cita
      clinic_id: 'SYSTEM_DEFAULT',
      name: 'Appointment Confirmed - Same Day',
      trigger: MessageTrigger.APPOINTMENT_SAME_DAY,
      channel: MessageChannel.WHATSAPP,
      whatsappTemplateName: 'confirmacion_cita_hoy',
      whatsappTemplateLanguage: 'es',
      body: 'Hola {{1}}, tu servicio con {{2}} es HOY a {{3}}',
      is_system: true,
      is_active: true,
    },
    
    {
      // Template 3: Pago recibido
      clinic_id: 'SYSTEM_DEFAULT',
      name: 'Payment Received Confirmation',
      trigger: MessageTrigger.PAYMENT_RECEIVED,
      channel: MessageChannel.WHATSAPP,
      whatsappTemplateName: 'comprobante_pago_recibido',
      whatsappTemplateLanguage: 'es',
      body: 'Gracias {{1}}, recibimos tu pago de ${{2}}. Referencia: {{3}}',
      is_system: true,
      is_active: true,
    },
    
    {
      // Template 4: Servicio completado (freeform por defecto)
      clinic_id: 'SYSTEM_DEFAULT',
      name: 'Service Completed - Follow Up',
      trigger: MessageTrigger.SERVICE_COMPLETED,
      channel: MessageChannel.WHATSAPP,
      whatsappTemplateName: null,  // ← FREEFORM
      body: 'Hola {{client_first_name}}, {{pet_name}} completó su servicio de {{service_name}}. ¡Gracias por confiar en {{clinic_name}}! 🐾',
      is_system: true,
      is_active: true,
    },
  ];

  for (const template of systemTemplates) {
    const exists = await templateRepo.findOne({
      where: {
        clinic_id: template.clinic_id,
        trigger: template.trigger,
        channel: template.channel,
      }
    });

    if (!exists) {
      await templateRepo.insert(template);
      console.log(`✅ Created system template: ${template.name}`);
    }
  }

  console.log(`✅ System templates seeded successfully`);
}
```

---

## 📋 Ejemplos Prácticos

### **Caso 1: Clínica en Plan BASIC**

```
Clínica: "Patitas Feliz"
Plan: BASIC ($50/mes)
Mensajes/mes: 200
subscription_tier: "basic"

Evento: Cita en 4 horas
┌──────────────────────────────────┐
│ Cliente: María                   │
│ Mascota: Firulais                │
│ Hora: 14:30                      │
└──────────────────────────────────┘

FLUJO:
1. CRON trigger (13:30)
2. Busca template → Encuentra SYSTEM_DEFAULT
3. decision = "TEMPLATE_MESSAGE"
4. Envío:
   ├─ contentSid: "HX1234567890..." (Meta template)
   ├─ contentVariables: ["María", "Firulais", "14:30"]
   └─ Costo: $0.005

RESULTADO:
Cliente recibe: "Hola María, tu cita con Firulais es en 14:30. Confirma escribiendo OK"

ADMIN PANEL:
┌─────────────────────────────────────┐
│ Template Configuration              │
│ ├─ Trigger: Appointment Reminder   │
│ ├─ Channel: WhatsApp               │
│ ├─ Mode: 🔒 Template Only          │
│ │  (Disabled customization)        │
│ └─ Cost: $0.005 per message        │
└─────────────────────────────────────┘
```

---

### **Caso 2: Clínica en Plan PRO - Usando Template (Barato)**

```
Clínica: "Grooming Elite"
Plan: PRO ($200/mes)
Mensajes/mes: 500
subscription_tier: "pro"

Admin quiere ahorrar → Usa template Meta:
┌──────────────────────────────────┐
│ Template Configuration            │
│ ├─ Trigger: Appointment Reminder │
│ ├─ Channel: WhatsApp             │
│ ├─ Mode: Template (Meta)         │
│ ├─ whatsappTemplateName:         │
│ │  "recordatorio_cita_4h"        │
│ └─ Cost: $0.005 per message      │
└──────────────────────────────────┘

FLUJO:
1. CRON trigger (13:30)
2. Busca template → Encuentra de la clínica
3. template.whatsappTemplateName = "recordatorio_cita_4h"
4. decision = "TEMPLATE_MESSAGE"
5. Envío:
   ├─ contentSid: "HX1234567890..."
   ├─ contentVariables: ["María", "Firulais", "14:30"]
   └─ Costo: $0.005

RESULTADO:
Mismo mensaje que en BASIC (template aprobado por Meta)
"Hola María, tu cita con Firulais es en 14:30. Confirma escribiendo OK"
```

---

### **Caso 3: Clínica en Plan PRO - Customizado (Flexible)**

```
Clínica: "Spa Canino Premium"
Plan: PRO ($200/mes)
Mensajes/mes: 500
subscription_tier: "pro"

Admin quiere personalización → Override template:
┌──────────────────────────────────────────────────────┐
│ Template Configuration                               │
│ ├─ Trigger: Appointment Reminder                    │
│ ├─ Channel: WhatsApp                                │
│ ├─ Mode: 🎨 Freeform (Custom)                       │
│ ├─ whatsappTemplateName: NULL (custom)              │
│ ├─ Body: "¡Hola {{client_first_name}}!              │
│ │         Tu consentido {{pet_name}} está           │
│ │         listo para su sesión de spa en            │
│ │         {{clinic_name}} mañana a las              │
│ │         {{appointment_time}}.                     │
│ │         Responde SÍ para confirmar. 💆‍♀️"          │
│ └─ Cost: $1.00 per message                          │
└──────────────────────────────────────────────────────┘

FLUJO:
1. CRON trigger (13:30)
2. Busca template → Encuentra de la clínica
3. template.whatsappTemplateName = NULL
4. decision = "FREEFORM_MESSAGE"
5. Interpolación:
   output = "¡Hola María!
             Tu consentido Firulais está listo para su sesión de spa en
             Spa Canino Premium mañana a las 14:30.
             Responde SÍ para confirmar. 💆‍♀️"
6. Envío:
   ├─ body: (interpolated message)
   └─ Costo: $1.00

RESULTADO:
Cliente recibe mensaje PERSONALIZADO
"¡Hola María! Tu consentido Firulais está listo...

DIFERENCIA DE COSTOS:
├─ If template: 500 × $0.005 = $2.50/mes
└─ If freeform: 500 × $1.00 = $500/mes
  DIFERENCIA: +$497.50/mes por customización
```

---

### **Caso 4: Clínica en Plan ENTERPRISE**

```
Clínica: "VetCare Hospital"
Plan: ENTERPRISE ($500+/mes)
Mensajes/mes: UNLIMITED
subscription_tier: "enterprise"

Admin prefiere personalización siempre:
┌──────────────────────────────────────────────────┐
│ Templates (Admin puede crear múltiples)          │
├──────────────────────────────────────────────────┤
│ 1. APPOINTMENT_REMINDER (freeform)               │
│ 2. SERVICE_COMPLETED (freeform)                  │
│ 3. PAYMENT_RECEIVED (template Meta para ahorrar) │
│ 4. REVIEW_REQUEST (freeform)                     │
│ 5. CUSTOM_PROMOTION (freeform)                   │
│ ... (sin límites)                                │
└──────────────────────────────────────────────────┘

OPCIÓN A: Usa template si quiere ahorrar
OPCIÓN B: Personaliza si quiere flexibilidad
RESULTADO: Full control total
```

---

## 📊 Matriz de Decisiones

### **Matriz: Tier × Trigger × Mode**

| Tier | Trigger | Type | Chatbot | Mode | Cost |
|------|---------|---|---|---|---|
| FREE/BASIC | APPOINTMENT_REMINDER | Notificación | ❌ | Template | $0.005 |
| FREE/BASIC | APPOINTMENT_SAME_DAY | Notificación | ❌ | Template | $0.005 |
| FREE/BASIC | SERVICE_COMPLETED | Notificación | ❌ | Template | $0.005 |
| FREE/BASIC | VACCINATION_REMINDER | Notificación | ❌ | Template | $0.005 |
| PRO | APPOINTMENT_SAME_DAY | **Chatbot** | ✅ | Template | $0.005 |
| PRO | VACCINATION_REMINDER | **Chatbot** | ✅ | Template | $0.005 |
| PRO | SERVICE_COMPLETED | Notificación | ❌ | Template \| Freeform | $0.005-$1.00 |
| PRO | REVIEW_REQUEST | **Chatbot** | ✅ | Freeform | $1.00 |
| ENTERPRISE | All | **Chatbot** | ✅ | Template \| Freeform | $0.005-$1.00 |

---

### **Matriz: Botones en Admin Panel**

```
Tier: BASIC
┌─────────────────────────────────────────────┐
│ Template: recordatorio_cita_4h (locked 🔒)  │
│ ├─ Edit: ❌ DISABLED (upgrade to PRO)       │
│ ├─ Preview: "Hola {{1}}, tu cita..."       │
│ └─ Cost: $0.005 per message                │
│                                             │
│ [Upgrade to PRO to customize]              │
└─────────────────────────────────────────────┘

Tier: PRO
┌─────────────────────────────────────────────┐
│ Template: recordatorio_cita_4h (toggle 🎚️) │
│ ├─ Use Template 📝                         │
│ ├─ OR Customize 🎨                         │
│ ├─ Edit: ✅ ENABLED                        │
│ └─ Cost: $0.005 or $1.00                   │
│                                             │
│ [Create new custom template]               │
└─────────────────────────────────────────────┘

Tier: ENTERPRISE
┌─────────────────────────────────────────────┐
│ Templates (Admin Full Control)              │
│ ├─ ✅ Create new                           │
│ ├─ ✅ Edit existing                        │
│ ├─ ✅ Delete                               │
│ ├─ ✅ Duplicate & modify                   │
│ ├─ ✅ A/B test multiple                    │
│ └─ Cost: Choose per message ($0.005 or $1) │
│                                             │
│ [Advanced: Scheduling, tags, filters]      │
└─────────────────────────────────────────────┘
```

---

## 💡 Consideraciones importantes

### **1. Interpolación de Variables**

**Template Messages (Meta):**
```
Limitado a 3-5 variables posicionales: {{1}}, {{2}}, {{3}}
Ejemplo:
  "Hola {{1}}, tu {{2}} con {{3}} es en {{4}}"
  ["María", "cita", "Dr. Juan", "14:30"]
```

**Freeform Messages (Tu app):**
```
Ilimitadas variables nombradas
Ejemplo:
  "Hola {{client_first_name}}, tu {{service_name}} 
   con {{stylist_name}} es en {{appointment_time}}"
  
  Reemplazos: 25+ variables posibles
```

---

### **2. Seguridad & Validación**

**Template Messages:**
```
✅ Vienen pre-aprobados por Meta
✅ Sin riesgo de spam/abuse
✅ Garantizado cumplimiento WhatsApp Business Account rules
```

**Freeform Messages:**
```
⚠️ Responsabilidad del admin (no auto-validadas)
⚠️ Posible de ir contra WhatsApp policies (spam links, etc)
⚠️ Usar solo en 24h window después de cliente inicia conversación
```

**Recomendación:**
```
- Agregar validación: Palabras prohibidas, links sospechosos
- Agregar auditoría: Log de emails customizados
- Agregar warnings: "Este mensaje puede violar policies"
```

---

### **3. Mantenimiento de Templates Meta**

**Crear template en Meta una sola vez:**

1. Ir a https://business.facebook.com/
2. WhatsApp → Settings → Message Templates
3. Create Template
   - Name: `recordatorio_cita_4h`
   - Category: Marketing
   - Content: `Hola {{1}}, tu cita con {{2}} es en {{3}}. Confirma escribiendo OK`
4. Submit for Approval (1-2 días)
5. Get Template SID: `HX1234567890abcdef`

**En tu código:**
```typescript
// Mapear nombre → SID
const META_TEMPLATES = {
  'recordatorio_cita_4h': 'HX1234567890abcdef',
  'confirmacion_cita_hoy': 'HX0987654321fedcba',
  'comprobante_pago': 'HX1122334455667788',
};

function getTemplateSid(name: string): string {
  return META_TEMPLATES[name] || null;
}
```

---

## 🤖 Templates + Chatbot (Nueva Feature - Prioridad Phase 1)

### **Qué es Template Chatbot**

No es un chatbot NLU (AI). Es un sistema de respuestas predefinidas que cuesta 200x menos que Freeform.

```
TEMPLATE CHATBOT (Nuevo):              FREEFORM CHATBOT (Caro):
┌──────────────────────────────┐     ┌──────────────────────────┐
│ System: "¿Confirmas? SÍ/NO"  │     │ System: "¿Qué pasa hoy?" │
│ Cost: $0.005                 │     │ Cost: $1.00              │
│ Response parsing:            │     │ Response parsing:        │
│  └─ Detecta "SÍ" → confirmed │     │  └─ NLU → intent mapping │
│  └─ Detecta "NO" → cancelled │     │  └─ Entity extraction    │
│  └─ Auto-update DB           │     │  └─ Dynamic response     │
│ Ahorro: $497/mes (500 msgs)  │     │ Precio: $500/mes         │
└──────────────────────────────┘     └──────────────────────────┘
```

### **Triggers con Chatbot (implementar Phase 1)**

```
1. APPOINTMENT_SAME_DAY (CITA_HOY_CONFIRMAR)
   Template: "Hoy es tu cita a las {{1}}. ¿Confirmas? SÍ/NO"
   Chatbot Logic:
   ├─ SÍ/CONFIRMED → Update appointment.confirmed = true
   ├─ NO/CANCELLED → Send cancellation template
   └─ No response → Follow-up reminder after 1 hour
   Cost: $0.005 per template + chatbot response
   Savings: Still $0.005 (no surcharge for responses)

2. VACCINATION_REMINDER (VACUNA_POR_VENCER) ⭐ NEW
   Template: "Vacuna {{1}} de {{2}} vence en {{3}} días. ¿Agendamos? SÍ/NO"
   Chatbot Logic:
   ├─ SÍ/YES → Auto-create appointment draft
   │           Send available slots (next 3 weekdays)
   │           Client clicks slot → booking confirmed
   ├─ NO/CANCEL → Remove notification reminder for this vaccine
   └─ No response → Auto-assign earliest available
   Cost: $0.005 per template + available slot messages (templates too)
   Savings vs Freeform: $495/month (500 msgs × $0.995)

3. REVIEW_REQUEST (Futuro - Enterprise only)
   Template: "¿Qué te pareció? Rating 1-5"
   Chatbot Logic:
   ├─ "1"-"5" → Extract number, create review
   └─ Comments → Optional follow-up message
   Cost: $0.005 if via template OR $1.00 if custom message
```

### **Flujo de Confirmación de Cita (Ejemplo)**

```
Timeline:
┌─────────────────────────────────────────────────────────────────┐
│ T-4h: Send APPOINTMENT_REMINDER template (notification)         │
│       "Tu cita con Dr. López es en 4 horas"                    │
│       Cost: $0.005                                              │
├─────────────────────────────────────────────────────────────────┤
│ T-30min: Send APPOINTMENT_SAME_DAY template + CHATBOT           │
│          "Hoy 3:30 PM con Dr. López. ¿Confirmas? SÍ/NO"       │
│          Cost: $0.005                                           │
│          Webhook receives: "SÍ"                                 │
│          Action: appointment.confirmed = true, send thank you   │
│          Client sees: "¡Confirmado! Te esperamos"              │
├─────────────────────────────────────────────────────────────────┤
│ T-10min: [Optional follow-up if no response]                    │
│          "¿Sigues confirmando? SÍ/NO"                          │
│          Cost: $0.005                                           │
│          Action: If still no response, clinic gets alert        │
└─────────────────────────────────────────────────────────────────┘

Total Cost: $0.015 (3 templates) instead of $3.00 (freeform)
Savings: 200x cheaper ✅
```

### **Flujo de Recordatorio de Vacunación (Ejemplo)**

```
Timeline:
┌─────────────────────────────────────────────────────────────────┐
│ Monthly CRON: Check vaccines expiring in 30 days                 │
│              Find all appointments needing reminders             │
├─────────────────────────────────────────────────────────────────┤
│ Send: "Vacuna Rabia de {{pet_name}} vence en 25 días.           │
│        ¿Agendamos? SÍ/NO"                                       │
│ Cost: $0.005 (template)                                         │
├─────────────────────────────────────────────────────────────────┤
│ Client Response: "SÍ"                                            │
├─────────────────────────────────────────────────────────────────┤
│ System Action:                                                   │
│  1. Create appointment draft (status = 'awaiting_client_choice') │
│  2. Query available slots (next 7 days, vet availability)       │
│  3. Send interactive message: "Disponible: Lun 10am, Mar 3pm..."│
│  4. Client clicks → Appointment confirmed                       │
│ Cost: $0.005 per slot message (template)                        │
├─────────────────────────────────────────────────────────────────┤
│ Clinic Alert: "Nueva cita vacunación: {{pet_name}}, {{date}}"   │
│ Cost: $0 (internal notification, no WhatsApp)                   │
└─────────────────────────────────────────────────────────────────┘

Total Cost: $0.010-0.020 (2-4 templates) instead of $2-4 (freeform)
Savings: ~$500/month per PRO clinic (assuming 500 msgs) ✅
```

### **Code Changes for Phase 1 (Already Ready!)**

**1. WhatsAppMessageService - sendAppointmentConfirmationChatbot()**
```typescript
async sendAppointmentConfirmationChatbot(appointment) {
  // Sends APPOINTMENT_SAME_DAY template
  await this.messagesService.sendInteractiveMessage(
    clinicId, clientPhone, appointmentId,
    options: ['SÍ', 'NO', 'REAGENDAR']
  );
  // Webhook will receive response in handleAppointmentConfirmation()
}

async sendVaccinationReminderChatbot(vaccination) {
  // Sends VACCINATION_REMINDER template
  await this.messagesService.sendInteractiveMessage(
    clinicId, clientPhone, appointmentId,
    options: ['SÍ AGENDAR', 'NO'],
    metadata: { trigger: 'VACCINATION_REMINDER', vaccinationId }
  );
  // Webhook will receive response in handleVaccinationResponse()
}
```

**2. WhatsAppWebhookService - NEW Handlers**
```typescript
async handleAppointmentConfirmation(response, appointmentId) {
  if (response.match(/SÍ|YES|CONFIRMAR/i)) {
    appointment.status = 'confirmed';
    await appointmentRepo.save(appointment);
    return await this.sendConfirmationThankYou(clinicId, clientPhone);
  }
  // Handle NO → cancellation
  // Handle REAGENDAR → reschedule flow
}

async handleVaccinationResponse(response, vaccinationId) {
  if (response.match(/SÍ|YES|AGENDAR/i)) {
    // Step 1: Create appointment draft
    const appointmentDraft = await appointmentService.createVaccinationAppointment(
      clinicId, clientId, vaccinationId
    );
    // Step 2: Send available slots as template
    const slots = await appointmentService.getAvailableSlots(
      clinicId, startDate, endDate, serviceType = 'vaccination'
    );
    return await this.sendSlotSelection(clientPhone, slots, appointmentDraft.id);
  }
  // Handle NO → skip for now, remind in 30 days
}
```

**3. WhatsAppSchedulerService - NEW CRON**
```typescript
@Cron('0 9 1 * *') // First day of month at 9 AM
async sendVaccinationRemindersCron() {
  // Find all vaccinations expiring in 30 days
  const expiringVaccinations = await vaccinationService
    .findByExpiryRange(
      startDate: today,
      endDate: today + 30 days,
      statuses: ['active', 'expiring_soon']
    );
  
  for (const vaccination of expiringVaccinations) {
    await this.whatsAppMessageService.sendVaccinationReminderChatbot(vaccination);
  }
}
```

---

## 🚀 Roadmap

### **Phase 1: Immediate (Semana 1-2)** 🔥 PRIORIDAD
- ✅ SQL: Seed templates system (4 templates)
- ✅ Services: Decision logic (template vs freeform)
- ✅ Webhook: Chatbot confirmación de cita
- ✅ Webhook: Chatbot vacunación (NEW)
- ✅ CRON: 4 scheduled jobs + vaccination reminder
- ✅ Testing: Flujos completos

### **Phase 2: Admin UI (Semana 3-4)**
- 👷 View templates (PRO tier)
- 👷 Edit template UI (drag-drop variables)
- 👷 Preview with real data
- 👷 Cost calculator: "Este mensaje cuesta $0.005 (template) o $1.00 (custom)"
- 👷 Toggle: Use template vs Customize

### **Phase 3: Advanced (Semana 5-6)**
- 📅 Template scheduling (send at specific time)
- 🏷️ Tags & filters (apply template to specific appointments)
- 📊 A/B testing (compare two templates)
- 🔒 Validation & safety (block unsafe content)
- 🤖 Custom chatbot triggers (advanced PRO)

### **Phase 4: Monetization (Semana 7+)**
- 💳 Charge per freeform message ($0.50 surcharge)
- 📈 Usage tracking & billing
- 🎁 Free tier limits (50 messages/month)
- ⬆️ Upgrade prompts

---

## 📌 System Templates to Implement (Phase 1)

```
4 TEMPLATES + CHATBOT (Templates Meta, baratos):

1. recordatorio_cita_4h
   └─ Notificación: "Hola {{1}}, tu cita con {{2}} es en {{3}}"
   └─ Cost: $0.005

2. cita_hoy_confirmar ⭐ CON CHATBOT
   └─ Interactive: "Hoy es tu cita a las {{1}}. ¿Confirmas? SÍ/NO"
   └─ Chatbot: Detecta respuesta → confirmed/cancelled
   └─ Cost: $0.005

3. servicio_completado
   └─ Notificación: "¡Gracias! {{1}} está listo en {{2}}"
   └─ Cost: $0.005

4. vacuna_por_vencer ⭐ CON CHATBOT
   └─ Interactive: "Vacuna {{1}} de {{2}} vence en {{3}} días. ¿Agendamos? SÍ/NO"
   └─ Chatbot: Si SÍ → auto-create appointment draft + send available slots
   └─ Cost: $0.005
   └─ AHORRO vs Freeform: $495/mes (500 msgs × $0.995)
```

---

## 🎯 Conclusión

**La solución TEMPLATES + CHATBOT permite:**

1. ✅ **Máximo ahorro** - Templates a $0.005 vs Freeform a $1.00 (200x)
2. ✅ **Interactividad sin costo extra** - Chatbot en template no suma costo
3. ✅ **Automatización inteligente** - Respuestas predichas → acciones automáticas
4. ✅ **Monetización clara** - Freeform es premium para PRO/Enterprise
5. ✅ **Escalabilidad** - 1 shared number para 12+ clínicas

**Resultado:** 
- FREE/BASIC clinics: Templates baratos, sin customización ($0.005/msg)
- PRO clinics: Templates + Chatbot + opcional Freeform ($0.005-$1.00)
- Enterprise: Full control, A/B testing, max revenue 🎉

---

**Status:** 🟢 Ready for Implementation  
**Next Step:** Code Phase 1 (Decision Logic + Service Integration + 2 Chatbots)  
**Estimate:** 1-2 weeks (5 services + 4 CRON jobs + webhook chatbot)
