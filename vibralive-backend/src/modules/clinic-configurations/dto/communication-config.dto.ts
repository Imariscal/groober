import { IsString, IsOptional, IsBoolean, IsNumber, IsEmail, Min, Max, Length, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

// =====================================================
// BILLING CONFIG DTOs
// =====================================================

export class UpdateBillingConfigDto {
  @IsOptional()
  @IsString()
  @Length(1, 200)
  legalName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  taxId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  taxRegime?: string;

  @IsOptional()
  @IsString()
  @Length(1, 300)
  fiscalAddress?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  fiscalCity?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  fiscalState?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  fiscalZip?: string;

  @IsOptional()
  @IsString()
  @Length(2, 3)
  fiscalCountry?: string;

  @IsOptional()
  @IsEmail()
  billingEmail?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  billingPhone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  taxRate?: number;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  invoicePrefix?: string;

  @IsOptional()
  @IsString()
  invoiceLogoUrl?: string;

  @IsOptional()
  @IsString()
  invoiceFooterText?: string;

  @IsOptional()
  @IsString()
  billingProvider?: string;

  @IsOptional()
  @IsString()
  billingApiKey?: string;

  @IsOptional()
  @IsBoolean()
  isBillingActive?: boolean;
}

export class BillingConfigResponseDto {
  clinicId!: string;
  legalName?: string;
  taxId?: string;
  taxRegime?: string;
  fiscalAddress?: string;
  fiscalCity?: string;
  fiscalState?: string;
  fiscalZip?: string;
  fiscalCountry!: string;
  billingEmail?: string;
  billingPhone?: string;
  currency!: string;
  taxRate!: number;
  invoicePrefix?: string;
  invoiceNextNumber!: number;
  invoiceLogoUrl?: string;
  invoiceFooterText?: string;
  billingProvider?: string;
  isBillingActive!: boolean;
  // No exponemos billingApiKey por seguridad
}

// =====================================================
// EMAIL CONFIG DTOs
// =====================================================

export enum EmailProviderDto {
  SMTP = 'smtp',
  SENDGRID = 'sendgrid',
  MAILGUN = 'mailgun',
  SES = 'ses',
  RESEND = 'resend',
  POSTMARK = 'postmark',
  PLATFORM = 'platform',
}

export class UpdateEmailConfigDto {
  @IsOptional()
  @IsEnum(EmailProviderDto)
  provider?: EmailProviderDto;

  // SMTP
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  smtpPort?: number;

  @IsOptional()
  @IsString()
  smtpUser?: string;

  @IsOptional()
  @IsString()
  smtpPassword?: string;

  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  // API
  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  apiDomain?: string;

  // Sender
  @IsOptional()
  @IsEmail()
  fromEmail?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  fromName?: string;

  @IsOptional()
  @IsEmail()
  replyToEmail?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class EmailConfigResponseDto {
  clinicId!: string;
  provider!: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpSecure!: boolean;
  apiDomain?: string;
  fromEmail?: string;
  fromName?: string;
  replyToEmail?: string;
  isActive!: boolean;
  isVerified!: boolean;
  lastVerifiedAt?: Date;
  lastError?: string;
  // No exponemos apiKey ni smtpPassword
}

export class TestEmailDto {
  @IsEmail()
  testEmail!: string;
}

// =====================================================
// WHATSAPP CONFIG DTOs
// =====================================================

export enum WhatsAppProviderDto {
  META = 'meta',
  TWILIO = 'twilio',
  DIALOG360 = '360dialog',
  MESSAGEBIRD = 'messagebird',
  VONAGE = 'vonage',
  WATI = 'wati',
}

export class UpdateWhatsAppConfigDto {
  @IsOptional()
  @IsEnum(WhatsAppProviderDto)
  provider?: WhatsAppProviderDto;

  // Meta
  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  phoneNumberId?: string;

  @IsOptional()
  @IsString()
  businessAccountId?: string;

  @IsOptional()
  @IsString()
  appId?: string;

  // Twilio
  @IsOptional()
  @IsString()
  accountSid?: string;

  @IsOptional()
  @IsString()
  authToken?: string;

  @IsOptional()
  @IsString()
  twilioPhoneNumber?: string;

  // Common
  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  senderPhone?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  dailyLimit?: number;

  // Preferences
  @IsOptional()
  @IsBoolean()
  sendAppointmentConfirmation?: boolean;

  @IsOptional()
  @IsBoolean()
  sendAppointmentReminder?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  reminderHoursBefore?: number;

  @IsOptional()
  @IsBoolean()
  sendStylistOnWay?: boolean;

  @IsOptional()
  @IsBoolean()
  sendServiceCompleted?: boolean;
}

export class WhatsAppConfigResponseDto {
  clinicId!: string;
  provider!: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  appId?: string;
  accountSid?: string;
  twilioPhoneNumber?: string;
  senderPhone?: string;
  webhookUrl?: string;
  isActive!: boolean;
  isVerified!: boolean;
  lastVerifiedAt?: Date;
  lastError?: string;
  dailyLimit!: number;
  messagesSentToday!: number;
  sendAppointmentConfirmation!: boolean;
  sendAppointmentReminder!: boolean;
  reminderHoursBefore!: number;
  sendStylistOnWay!: boolean;
  sendServiceCompleted!: boolean;
  // No exponemos tokens ni api keys
}

export class TestWhatsAppDto {
  @IsString()
  testPhone!: string; // Con código de país: +521234567890
}

// =====================================================
// MESSAGE TEMPLATE DTOs
// =====================================================

export enum MessageChannelDto {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  PUSH = 'push',
}

export enum MessageTriggerDto {
  APPOINTMENT_SCHEDULED = 'appointment_scheduled',
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_SAME_DAY = 'appointment_same_day',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',
  STYLIST_ON_WAY = 'stylist_on_way',
  STYLIST_ARRIVED = 'stylist_arrived',
  PET_CHECKED_IN = 'pet_checked_in',
  SERVICE_IN_PROGRESS = 'service_in_progress',
  SERVICE_COMPLETED = 'service_completed',
  PET_READY_PICKUP = 'pet_ready_pickup',
  APPOINTMENT_FOLLOW_UP = 'appointment_follow_up',
  REVIEW_REQUEST = 'review_request',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_REMINDER = 'payment_reminder',
  INVOICE_SENT = 'invoice_sent',
  WELCOME = 'welcome',
  BIRTHDAY = 'birthday',
  PET_BIRTHDAY = 'pet_birthday',
  LOYALTY_REWARD = 'loyalty_reward',
  VACCINATION_REMINDER = 'vaccination_reminder',
  GROOMING_DUE = 'grooming_due',
}

export enum MessageTimingDto {
  IMMEDIATE = 'immediate',
  HOURS_BEFORE = 'hours_before',
  DAYS_BEFORE = 'days_before',
  HOURS_AFTER = 'hours_after',
  DAYS_AFTER = 'days_after',
  SCHEDULED = 'scheduled',
}

export class CreateMessageTemplateDto {
  @IsString()
  @Length(1, 100)
  name!: string;

  @IsEnum(MessageTriggerDto)
  trigger!: MessageTriggerDto;

  @IsEnum(MessageChannelDto)
  channel!: MessageChannelDto;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  subject?: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @IsOptional()
  @IsEnum(MessageTimingDto)
  timing?: MessageTimingDto;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  timingValue?: number;

  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @IsOptional()
  @IsString()
  whatsappTemplateName?: string;

  @IsOptional()
  @IsString()
  whatsappTemplateLanguage?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMessageTemplateDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  subject?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @IsOptional()
  @IsEnum(MessageTimingDto)
  timing?: MessageTimingDto;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  timingValue?: number;

  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @IsOptional()
  @IsString()
  whatsappTemplateName?: string;

  @IsOptional()
  @IsString()
  whatsappTemplateLanguage?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class MessageTemplateResponseDto {
  id!: string;
  clinicId!: string;
  name!: string;
  trigger!: string;
  channel!: string;
  subject?: string;
  body!: string;
  bodyHtml?: string;
  timing!: string;
  timingValue?: number;
  scheduledTime?: string;
  whatsappTemplateName?: string;
  whatsappTemplateLanguage?: string;
  isActive!: boolean;
  isSystem!: boolean;
  timesSent!: number;
  lastSentAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

// Variables disponibles para plantillas
export const TEMPLATE_VARIABLES = {
  client: ['client_name', 'client_first_name', 'client_phone', 'client_email'],
  pet: ['pet_name', 'pet_breed', 'pet_species', 'pet_gender_o_a'],
  appointment: [
    'appointment_date',
    'appointment_date_short', 
    'appointment_time',
    'appointment_type',
    'appointment_type_home',
    'appointment_type_clinic',
    'appointment_address',
  ],
  service: ['service_name', 'service_duration', 'service_price'],
  stylist: ['stylist_name', 'stylist_phone'],
  clinic: ['clinic_name', 'clinic_phone', 'clinic_address', 'clinic_email'],
  payment: ['total_amount', 'payment_link'],
  system: ['current_date', 'current_time'],
};
