import {
  IsString,
  IsPhoneNumber,
  IsUUID,
  IsOptional,
  Length,
  IsEnum,
} from 'class-validator';

export enum WhatsAppMessageType {
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CONFIRMATION = 'appointment_confirmation',
  APPOINTMENT_CANCELLATION = 'appointment_cancellation',
  CUSTOM = 'custom',
}

export class SendWhatsAppMessageDto {
  @IsString()
  @IsPhoneNumber()
  phone_number!: string; // E.164 format: +34612345678

  @IsString()
  @Length(1, 1000)
  message_body!: string;

  @IsUUID()
  @IsOptional()
  client_id?: string; // Link to client if exists

  @IsEnum(WhatsAppMessageType)
  @IsOptional()
  message_type?: WhatsAppMessageType = WhatsAppMessageType.CUSTOM;

  @IsString()
  @IsOptional()
  @Length(1, 255)
  idempotency_key?: string; // Client-provided or server-generated
}
