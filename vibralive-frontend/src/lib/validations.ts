import { z } from 'zod';
import { format } from 'date-fns';

// 🎯 Helper for date-only comparisons (calendar dates without time)
// Compares YYYY-MM-DD strings to avoid timezone issues
const getTodayDateString = (): string => format(new Date(), 'yyyy-MM-dd');

// ============================================
// Auth Schemas
// ============================================

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  clinic_name: z
    .string()
    .min(1, 'El nombre de la clínica es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre debe tener máximo 100 caracteres'),
  clinic_phone: z
    .string()
    .min(1, 'El teléfono de la clínica es requerido')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Ingresa un teléfono válido (E.164)'),
  owner_name: z
    .string()
    .min(1, 'El nombre del propietario es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres'),
  owner_email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[!@#$%^&*]/, 'Debe contener al menos un carácter especial (!@#$%^&*)'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm_password'],
});

export type RegisterFormData = z.infer<typeof RegisterSchema>;

// ============================================
// Client Schemas
// ============================================

export const ClientSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre debe tener máximo 100 caracteres'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  phone: z
    .string()
    .min(1, 'El teléfono es requerido')
    .regex(/^(\+)?[1-9]\d{1,14}$/, 'Ingresa un teléfono válido'),
  city: z
    .string()
    .min(1, 'La ciudad es requerida')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(250, 'La dirección debe tener máximo 250 caracteres')
    .optional()
    .or(z.literal('')),
});

export type ClientFormData = z.infer<typeof ClientSchema>;

// ============================================
// Pet Schemas
// ============================================

export const PetSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre de la mascota es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre debe tener máximo 50 caracteres'),
  animal_type_id: z
    .string()
    .uuid('Selecciona un tipo de animal válido'),
  birth_date: z
    .string()
    .min(1, 'La fecha de nacimiento es requerida')
    // 🎯 FIX: Compare date strings to avoid timezone issues
    .refine((date) => date < getTodayDateString(), 'La fecha debe ser en el pasado'),
  gender: z
    .enum(['male', 'female'], {
      errorMap: () => ({ message: 'Selecciona un género válido' }),
    }),
  weight_kg: z
    .number()
    .positive('El peso debe ser mayor a 0')
    .max(500, 'El peso debe ser menor a 500 kg'),
  color_description: z
    .string()
    .max(100, 'La descripción debe tener máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  next_vaccine_date: z
    .string()
    .min(1, 'La fecha de próxima vacuna es requerida')
    // 🎯 FIX: Compare date strings to avoid timezone issues
    .refine((date) => date > getTodayDateString(), 'La fecha debe ser en el futuro'),
  next_deworming_date: z
    .string()
    .min(1, 'La fecha de próxima desparasitación es requerida')
    // 🎯 FIX: Compare date strings to avoid timezone issues
    .refine((date) => date > getTodayDateString(), 'La fecha debe ser en el futuro'),
});

export type PetFormData = z.infer<typeof PetSchema>;

// ============================================
// Utility function to format validation errors
// ============================================
// Client Preferences Schemas (Evolved Profile)
// ============================================

export const ClientPreferencesSchema = z.object({
  whatsapp_number: z
    .string()
    .regex(/^(\+)?[1-9]\d{1,14}$/, 'Ingresa un teléfono WhatsApp válido')
    .optional()
    .or(z.literal('')),
  phone_secondary: z
    .string()
    .regex(/^(\+)?[1-9]\d{1,14}$/, 'Ingresa un teléfono válido')
    .optional()
    .or(z.literal('')),
  preferred_contact_method: z
    .enum(['WHATSAPP', 'PHONE', 'EMAIL', 'SMS'])
    .optional(),
  preferred_contact_time_start: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido')
    .optional()
    .or(z.literal('')),
  preferred_contact_time_end: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido')
    .optional()
    .or(z.literal('')),
  housing_type: z
    .enum(['HOUSE', 'APARTMENT', 'COMMERCIAL', 'OTHER'])
    .optional(),
  access_notes: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  service_notes: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  do_not_contact: z.boolean().optional(),
  do_not_contact_reason: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
  status: z
    .enum(['ACTIVE', 'INACTIVE', 'ARCHIVED', 'BLACKLISTED'])
    .optional(),
}).refine(
  (data) => {
    // If time_start is provided, time_end must be provided
    if (data.preferred_contact_time_start && !data.preferred_contact_time_end) {
      return false;
    }
    return true;
  },
  {
    message: 'Si proporcionas una hora de inicio, debes proporcionar una hora de fin',
    path: ['preferred_contact_time_end'],
  },
).refine(
  (data) => {
    // If time_end is provided, time_start must be provided
    if (data.preferred_contact_time_end && !data.preferred_contact_time_start) {
      return false;
    }
    return true;
  },
  {
    message: 'Si proporcionas una hora de fin, debes proporcionar una hora de inicio',
    path: ['preferred_contact_time_start'],
  },
).refine(
  (data) => {
    // Time validation: start < end
    if (data.preferred_contact_time_start && data.preferred_contact_time_end) {
      const [startH, startM] = data.preferred_contact_time_start.split(':').map(Number);
      const [endH, endM] = data.preferred_contact_time_end.split(':').map(Number);
      const startTime = startH * 60 + startM;
      const endTime = endH * 60 + endM;
      if (startTime >= endTime) {
        return false;
      }
    }
    return true;
  },
  {
    message: 'La hora de inicio debe ser menor a la hora de fin',
    path: ['preferred_contact_time_end'],
  },
).refine(
  (data) => {
    // If do_not_contact is true, reason is required
    if (data.do_not_contact && !data.do_not_contact_reason?.trim()) {
      return false;
    }
    return true;
  },
  {
    message: 'La razón es requerida cuando se marca "no contactar"',
    path: ['do_not_contact_reason'],
  },
);

export type ClientPreferencesFormData = z.infer<typeof ClientPreferencesSchema>;

// ============================================
// Utility function to format validation errors
// ============================================

export interface ValidationError {
  field: string;
  message: string;
}

export function formatValidationErrors(error: z.ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

