import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsObject,
  IsString,
} from 'class-validator';

export class CreateReminderQueueDto {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  clientId!: string;

  @IsUUID()
  petId!: string;

  @IsOptional()
  @IsUUID()
  preventiveEventId?: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsEnum(['WHATSAPP', 'EMAIL'])
  channel!: 'WHATSAPP' | 'EMAIL';

  @IsEnum(['UPCOMING_PREVENTIVE_EVENT', 'OVERDUE_PREVENTIVE_EVENT', 'APPOINTMENT_REMINDER'])
  reminderType!: 'UPCOMING_PREVENTIVE_EVENT' | 'OVERDUE_PREVENTIVE_EVENT' | 'APPOINTMENT_REMINDER';

  @IsDateString()
  scheduledFor!: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  @IsObject()
  payloadJson?: Record<string, any>;
}

export class UpdateReminderQueueStatusDto {
  @IsEnum(['PENDING', 'SENT', 'FAILED', 'CANCELLED'])
  status!: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';

  @IsOptional()
  @IsDateString()
  sentAt?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}

export class ReminderQueueResponseDto {
  id!: string;
  clinicId!: string;
  clientId!: string;
  petId!: string;
  preventiveEventId?: string;
  appointmentId?: string;
  channel!: string;
  reminderType!: string;
  scheduledFor!: Date;
  sentAt?: Date;
  status!: string;
  templateId?: string;
  payloadJson?: Record<string, any>;
  createdAt!: Date;
  updatedAt!: Date;
}

export class BulkCreateRemindersDto {
  @IsEnum(['WHATSAPP', 'EMAIL'], { each: true })
  channels!: ('WHATSAPP' | 'EMAIL')[];

  @IsEnum(['UPCOMING_PREVENTIVE_EVENT', 'OVERDUE_PREVENTIVE_EVENT'], { each: false })
  reminderType!: 'UPCOMING_PREVENTIVE_EVENT' | 'OVERDUE_PREVENTIVE_EVENT';
}
