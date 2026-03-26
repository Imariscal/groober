import { DataSource } from 'typeorm';
import { MessageTemplate, MessageTrigger, MessageChannel, MessageTiming } from '../entities';

/**
 * Plantillas de mensajes predeterminadas
 * 
 * Cada clínica podrá personalizar estas plantillas.
 * Las variables disponibles están documentadas en message-template.entity.ts
 */

interface TemplateDef {
  name: string;
  trigger: MessageTrigger;
  channel: MessageChannel;
  subject?: string;
  body: string;
  bodyHtml?: string;
  timing: MessageTiming;
  timingValue?: number;
  whatsappTemplateName?: string;
}

// =====================================================
// PLANTILLAS DE WHATSAPP
// =====================================================
const WHATSAPP_TEMPLATES: TemplateDef[] = [
  // Cita agendada
  {
    name: 'WhatsApp - Cita Agendada',
    trigger: MessageTrigger.APPOINTMENT_SCHEDULED,
    channel: MessageChannel.WHATSAPP,
    body: `¡Hola {{client_first_name}}! 🐾

Tu cita para *{{pet_name}}* ha sido agendada:

📅 *Fecha:* {{appointment_date}}
🕐 *Hora:* {{appointment_time}}
✂️ *Servicio:* {{service_name}}
👤 *Estilista:* {{stylist_name}}

{{#if appointment_type_home}}
📍 Te visitaremos en tu domicilio.
{{else}}
📍 Te esperamos en: {{clinic_address}}
{{/if}}

Para confirmar o reagendar, responde a este mensaje o llámanos al {{clinic_phone}}.

*{{clinic_name}}*`,
    timing: MessageTiming.IMMEDIATE,
  },

  // Recordatorio 24h antes
  {
    name: 'WhatsApp - Recordatorio 24h',
    trigger: MessageTrigger.APPOINTMENT_REMINDER,
    channel: MessageChannel.WHATSAPP,
    body: `¡Hola {{client_first_name}}! 👋

Te recordamos que *mañana* tienes cita para *{{pet_name}}*:

📅 {{appointment_date}}
🕐 {{appointment_time}}
✂️ {{service_name}}

¿Nos confirmas tu asistencia? Responde:
✅ *CONFIRMO* 
❌ *REAGENDAR*

*{{clinic_name}}*`,
    timing: MessageTiming.HOURS_BEFORE,
    timingValue: 24,
  },

  // Recordatorio día de la cita
  {
    name: 'WhatsApp - Hoy es tu cita',
    trigger: MessageTrigger.APPOINTMENT_SAME_DAY,
    channel: MessageChannel.WHATSAPP,
    body: `¡Buenos días {{client_first_name}}! ☀️

Hoy es el día del spa de *{{pet_name}}*

🕐 *Hora:* {{appointment_time}}
✂️ *Servicio:* {{service_name}}
👤 *Estilista:* {{stylist_name}}

{{#if appointment_type_home}}
El estilista llegará a tu domicilio a la hora indicada.
{{else}}
Te esperamos en {{clinic_address}}
{{/if}}

*{{clinic_name}}* 🐾`,
    timing: MessageTiming.HOURS_BEFORE,
    timingValue: 2,
  },

  // Estilista en camino (domicilio)
  {
    name: 'WhatsApp - Estilista en Camino',
    trigger: MessageTrigger.STYLIST_ON_WAY,
    channel: MessageChannel.WHATSAPP,
    body: `¡Hola {{client_first_name}}! 🚗

*{{stylist_name}}* está en camino para la cita de *{{pet_name}}*.

Tiempo estimado de llegada: *15-20 minutos*

Por favor, ten todo listo para recibir al estilista.

*{{clinic_name}}*`,
    timing: MessageTiming.IMMEDIATE,
  },

  // Estilista llegó
  {
    name: 'WhatsApp - Estilista Llegó',
    trigger: MessageTrigger.STYLIST_ARRIVED,
    channel: MessageChannel.WHATSAPP,
    body: `¡{{client_first_name}}! 

*{{stylist_name}}* ha llegado a tu domicilio para atender a *{{pet_name}}*. 🏠

*{{clinic_name}}*`,
    timing: MessageTiming.IMMEDIATE,
  },

  // Mascota registrada (clínica)
  {
    name: 'WhatsApp - Mascota Recibida',
    trigger: MessageTrigger.PET_CHECKED_IN,
    channel: MessageChannel.WHATSAPP,
    body: `¡Hola {{client_first_name}}! 

*{{pet_name}}* ya está con nosotros y comenzaremos su servicio en breve. 🛁

Te avisaremos cuando esté list{{pet_gender_o_a}}.

*{{clinic_name}}* 🐾`,
    timing: MessageTiming.IMMEDIATE,
  },

  // Servicio completado
  {
    name: 'WhatsApp - Mascota Lista',
    trigger: MessageTrigger.SERVICE_COMPLETED,
    channel: MessageChannel.WHATSAPP,
    body: `¡{{client_first_name}}! 🎉

*{{pet_name}}* ya terminó su spa y está list{{pet_gender_o_a}} para verte.

{{#if appointment_type_clinic}}
Puedes pasar a recogerl{{pet_gender_o_a}} en:
📍 {{clinic_address}}
{{/if}}

¡Quedó hermoso/a! 🐾✨

*{{clinic_name}}*`,
    timing: MessageTiming.IMMEDIATE,
  },

  // Cita cancelada
  {
    name: 'WhatsApp - Cita Cancelada',
    trigger: MessageTrigger.APPOINTMENT_CANCELLED,
    channel: MessageChannel.WHATSAPP,
    body: `Hola {{client_first_name}},

Tu cita para *{{pet_name}}* del {{appointment_date}} a las {{appointment_time}} ha sido *cancelada*.

Si deseas reagendar, contáctanos al {{clinic_phone}} o responde este mensaje.

*{{clinic_name}}*`,
    timing: MessageTiming.IMMEDIATE,
  },

  // Seguimiento post-servicio
  {
    name: 'WhatsApp - Seguimiento',
    trigger: MessageTrigger.APPOINTMENT_FOLLOW_UP,
    channel: MessageChannel.WHATSAPP,
    body: `¡Hola {{client_first_name}}! 👋

¿Cómo está *{{pet_name}}* después de su visita al spa?

Nos encantaría saber tu opinión. Tu feedback nos ayuda a mejorar. ⭐

¿Te gustaría agendar su próxima cita?

*{{clinic_name}}* 🐾`,
    timing: MessageTiming.DAYS_AFTER,
    timingValue: 2,
  },
];

// =====================================================
// PLANTILLAS DE EMAIL
// =====================================================
const EMAIL_TEMPLATES: TemplateDef[] = [
  // Confirmación de cita
  {
    name: 'Email - Cita Confirmada',
    trigger: MessageTrigger.APPOINTMENT_SCHEDULED,
    channel: MessageChannel.EMAIL,
    subject: '🐾 Cita confirmada para {{pet_name}} - {{clinic_name}}',
    body: `Hola {{client_name}},

Tu cita ha sido agendada exitosamente.

DETALLES DE LA CITA:
- Mascota: {{pet_name}}
- Fecha: {{appointment_date}}
- Hora: {{appointment_time}}
- Servicio: {{service_name}}
- Estilista: {{stylist_name}}
- Ubicación: {{appointment_type}}

Si necesitas modificar o cancelar tu cita, contáctanos al {{clinic_phone}} o responde a este correo.

Saludos,
{{clinic_name}}`,
    bodyHtml: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">¡Cita Confirmada! 🐾</h1>
  </div>
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
    <p>Hola <strong>{{client_name}}</strong>,</p>
    <p>Tu cita ha sido agendada exitosamente.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
      <h3 style="margin-top: 0; color: #334155;">Detalles de la cita</h3>
      <table style="width: 100%;">
        <tr><td style="padding: 8px 0; color: #64748b;">🐕 Mascota:</td><td><strong>{{pet_name}}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">📅 Fecha:</td><td><strong>{{appointment_date}}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">🕐 Hora:</td><td><strong>{{appointment_time}}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">✂️ Servicio:</td><td><strong>{{service_name}}</strong></td></tr>
        <tr><td style="padding: 8px 0; color: #64748b;">👤 Estilista:</td><td><strong>{{stylist_name}}</strong></td></tr>
      </table>
    </div>
    
    <p style="color: #64748b; font-size: 14px;">
      Si necesitas modificar tu cita, contáctanos al <strong>{{clinic_phone}}</strong>
    </p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
      {{clinic_name}} | {{clinic_address}}<br>
      {{clinic_phone}} | {{clinic_email}}
    </p>
  </div>
</body>
</html>`,
    timing: MessageTiming.IMMEDIATE,
  },

  // Recordatorio
  {
    name: 'Email - Recordatorio de Cita',
    trigger: MessageTrigger.APPOINTMENT_REMINDER,
    channel: MessageChannel.EMAIL,
    subject: '⏰ Recordatorio: Cita mañana para {{pet_name}}',
    body: `Hola {{client_name}},

Te recordamos que mañana tienes una cita agendada:

- Mascota: {{pet_name}}
- Fecha: {{appointment_date}}
- Hora: {{appointment_time}}
- Servicio: {{service_name}}

Por favor, confirma tu asistencia respondiendo a este correo.

Saludos,
{{clinic_name}}`,
    timing: MessageTiming.HOURS_BEFORE,
    timingValue: 24,
  },

  // Servicio completado
  {
    name: 'Email - Servicio Completado',
    trigger: MessageTrigger.SERVICE_COMPLETED,
    channel: MessageChannel.EMAIL,
    subject: '✨ {{pet_name}} está listo - {{clinic_name}}',
    body: `Hola {{client_name}},

¡Buenas noticias! {{pet_name}} ha terminado su servicio de {{service_name}} y está listo para verte.

Ya puedes pasar a recogerlo.

¡Gracias por confiar en nosotros!

{{clinic_name}}`,
    timing: MessageTiming.IMMEDIATE,
  },

  // Bienvenida
  {
    name: 'Email - Bienvenida',
    trigger: MessageTrigger.WELCOME,
    channel: MessageChannel.EMAIL,
    subject: '🎉 ¡Bienvenido a {{clinic_name}}!',
    body: `¡Hola {{client_name}}!

¡Bienvenido a {{clinic_name}}! Estamos muy contentos de que hayas elegido confiar en nosotros para el cuidado de {{pet_name}}.

Nuestro equipo de estilistas profesionales está listo para hacer que tu mascota luzca increíble.

Si tienes alguna pregunta, no dudes en contactarnos al {{clinic_phone}}.

¡Esperamos verte pronto!

El equipo de {{clinic_name}}`,
    timing: MessageTiming.IMMEDIATE,
  },
];

// =====================================================
// FUNCIÓN PARA CREAR PLANTILLAS
// =====================================================
export async function seedMessageTemplates(
  dataSource: DataSource,
  clinicId: string,
): Promise<void> {
  const templateRepo = dataSource.getRepository(MessageTemplate);
  
  const allTemplates = [...WHATSAPP_TEMPLATES, ...EMAIL_TEMPLATES];
  
  console.log(`📝 Creando ${allTemplates.length} plantillas para clínica ${clinicId}...`);
  
  for (const tmpl of allTemplates) {
    // Verificar si ya existe
    const existing = await templateRepo.findOne({
      where: {
        clinicId,
        trigger: tmpl.trigger,
        channel: tmpl.channel,
      },
    });

    if (!existing) {
      const template = templateRepo.create({
        clinicId,
        name: tmpl.name,
        trigger: tmpl.trigger,
        channel: tmpl.channel,
        subject: tmpl.subject,
        body: tmpl.body,
        bodyHtml: tmpl.bodyHtml,
        timing: tmpl.timing,
        timingValue: tmpl.timingValue,
        isActive: true,
        isSystem: false,
      });
      await templateRepo.save(template);
      console.log(`   ✅ ${tmpl.name}`);
    } else {
      console.log(`   ♻️  ${tmpl.name} (ya existe)`);
    }
  }
}

// =====================================================
// RESUMEN DE PLANTILLAS DISPONIBLES
// =====================================================
export const MESSAGE_TEMPLATES_SUMMARY = {
  whatsapp: [
    { trigger: 'appointment_scheduled', description: 'Confirmación de cita agendada' },
    { trigger: 'appointment_reminder', description: 'Recordatorio 24h antes', timing: '24h antes' },
    { trigger: 'appointment_same_day', description: 'Recordatorio día de la cita', timing: '2h antes' },
    { trigger: 'stylist_on_way', description: 'Estilista en camino (domicilio)' },
    { trigger: 'stylist_arrived', description: 'Estilista llegó (domicilio)' },
    { trigger: 'pet_checked_in', description: 'Mascota recibida (clínica)' },
    { trigger: 'service_completed', description: 'Servicio terminado / Mascota lista' },
    { trigger: 'appointment_cancelled', description: 'Cita cancelada' },
    { trigger: 'appointment_follow_up', description: 'Seguimiento post-servicio', timing: '2 días después' },
  ],
  email: [
    { trigger: 'appointment_scheduled', description: 'Confirmación de cita con detalles' },
    { trigger: 'appointment_reminder', description: 'Recordatorio 24h antes' },
    { trigger: 'service_completed', description: 'Notificación de servicio completado' },
    { trigger: 'welcome', description: 'Bienvenida a nuevo cliente' },
  ],
};
