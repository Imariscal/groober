// Preventive Care Event Types

export type PreventiveEventType = 
  | 'VACCINE' 
  | 'DEWORMING_INTERNAL' 
  | 'DEWORMING_EXTERNAL' 
  | 'GROOMING_MAINTENANCE' 
  | 'OTHER';

export type CycleType = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export type PreventiveEventStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

export interface CreatePetPreventiveCareEventDto {
  clinicId: string;
  clientId: string;
  petId: string;
  appointmentId?: string;
  appointmentItemId?: string;
  serviceId: string;
  eventType: PreventiveEventType;
  appliedAt: string | Date;
  nextDueAt?: string | Date;
  cycleType?: CycleType;
  cycleValue?: number;
  reminderDaysBefore?: number;
  notes?: string;
  createdByUserId?: string;
}

export interface UpdatePetPreventiveCareEventDto {
  cycleType?: CycleType;
  cycleValue?: number;
  nextDueAt?: string | Date;
  status?: PreventiveEventStatus;
  notes?: string;
}

export interface PreventiveEventResponseDto {
  id: string;
  clinicId: string;
  clientId: string;
  petId: string;
  appointmentId?: string;
  serviceId: string;
  eventType: PreventiveEventType;
  appliedAt: Date | string;
  nextDueAt?: Date | string;
  cycleType?: CycleType;
  cycleValue?: number;
  reminderDaysBefore: number;
  status: PreventiveEventStatus;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ReminderQueueResponseDto {
  id: string;
  clinicId: string;
  clientId: string;
  petId: string;
  preventiveEventId?: string;
  appointmentId?: string;
  channel: string;
  reminderType: string;
  scheduledFor: Date | string;
  sentAt?: Date | string;
  status: string;
  templateId?: string;
  payloadJson?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
}
