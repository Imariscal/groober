import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject, IsUUID, IsDateString, IsBoolean, IsNumber } from 'class-validator';
import { CampaignChannel, CampaignStatus, RecurrenceType } from '@/database/entities/campaign.entity';

/**
 * Filter structure for audience targeting
 * 
 * Supports:
 * - Pet filters: species, breed, sex, size, sterilized, age, microchip, active, deceased
 * - Client filters: has_whatsapp, has_email, active_client, created_after, last_visit_date, etc.
 */
export class CampaignFilterDto {
  // Pet filters
  @IsOptional()
  species?: string[]; // DOG, CAT, etc.

  @IsOptional()
  breed?: string[];

  @IsOptional()
  sex?: string[]; // MALE, FEMALE

  @IsOptional()
  size?: string[]; // SMALL, MEDIUM, LARGE

  @IsOptional()
  sterilized?: boolean;

  @IsOptional()
  ageMin?: number;

  @IsOptional()
  ageMax?: number;

  @IsOptional()
  microchip?: boolean;

  @IsOptional()
  petActive?: boolean;

  @IsOptional()
  petDeceased?: boolean;

  // Client filters
  @IsOptional()
  clientHasWhatsapp?: boolean;

  @IsOptional()
  clientHasEmail?: boolean;

  @IsOptional()
  clientActive?: boolean;

  @IsOptional()
  @IsDateString()
  clientCreatedAfter?: string;

  @IsOptional()
  @IsDateString()
  clientLastVisitBefore?: string;

  @IsOptional()
  @IsDateString()
  clientLastVisitAfter?: string;

  @IsOptional()
  clientMinPets?: number;

  @IsOptional()
  clientMaxPets?: number;

  @IsOptional()
  clientHasPendingAppointments?: boolean;
}

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CampaignChannel)
  @IsNotEmpty()
  channel!: CampaignChannel;

  @IsUUID()
  @IsNotEmpty()
  campaignTemplateId!: string;

  @IsObject()
  @IsNotEmpty()
  filter!: CampaignFilterDto;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  estimatedRecipients?: number;

  // Recurrence fields
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrenceType?: RecurrenceType;

  @IsOptional()
  @IsNumber()
  recurrenceInterval?: number;

  @IsOptional()
  @IsDateString()
  recurrenceEndDate?: string;
}

export class UpdateCampaignDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  filter?: CampaignFilterDto;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrenceType?: RecurrenceType;

  @IsOptional()
  @IsNumber()
  recurrenceInterval?: number;

  @IsOptional()
  @IsDateString()
  recurrenceEndDate?: string;
}

export class ExecuteCampaignDto {
  @IsUUID()
  @IsNotEmpty()
  campaignId!: string;

  // Optional: override scheduled time
  @IsOptional()
  @IsDateString()
  executeNow?: boolean;
}

export class PauseCampaignDto {
  @IsUUID()
  @IsNotEmpty()
  campaignId!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class ResumeCampaignDto {
  @IsUUID()
  @IsNotEmpty()
  campaignId!: string;
}

export class CancelCampaignDto {
  @IsUUID()
  @IsNotEmpty()
  campaignId!: string;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class PreviewAudienceDto {
  @IsUUID()
  @IsNotEmpty()
  campaignTemplateId!: string;

  @IsObject()
  @IsNotEmpty()
  filter!: CampaignFilterDto;

  @IsOptional()
  limit?: number; // Preview first N recipients
}

export class CampaignResponseDto {
  id!: string;
  clinicId!: string;
  name!: string;
  description?: string;
  channel!: CampaignChannel;
  campaignTemplateId!: string;
  status!: CampaignStatus;
  filtersJson!: Record<string, any>;
  estimatedRecipients!: number;
  actualRecipients!: number;
  successfulCount!: number;
  failedCount!: number;
  skippedCount!: number;
  openedCount!: number;
  readCount!: number;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdByUserId!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
