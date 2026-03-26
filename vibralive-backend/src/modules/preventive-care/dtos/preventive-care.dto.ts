import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsDateString,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';

export class CreatePetPreventiveCareEventDto {
  @IsUUID()
  clinicId!: string;

  @IsUUID()
  clientId!: string;

  @IsUUID()
  petId!: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsUUID()
  appointmentItemId?: string;

  @IsUUID()
  serviceId!: string;

  @IsEnum(['VACCINE', 'DEWORMING_INTERNAL', 'DEWORMING_EXTERNAL', 'GROOMING_MAINTENANCE', 'OTHER'])
  eventType!: 'VACCINE' | 'DEWORMING_INTERNAL' | 'DEWORMING_EXTERNAL' | 'GROOMING_MAINTENANCE' | 'OTHER';

  @IsDateString()
  appliedAt!: string;

  @IsOptional()
  @IsDateString()
  nextDueAt?: string;

  @IsOptional()
  @IsEnum(['DAY', 'WEEK', 'MONTH', 'YEAR'])
  cycleType?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

  @IsOptional()
  @IsNumber()
  @Min(1)
  cycleValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reminderDaysBefore?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  createdByUserId?: string;
}

export class UpdatePetPreventiveCareEventDto {
  @IsOptional()
  @IsEnum(['DAY', 'WEEK', 'MONTH', 'YEAR'])
  cycleType?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

  @IsOptional()
  @IsNumber()
  @Min(1)
  cycleValue?: number;

  @IsOptional()
  @IsDateString()
  nextDueAt?: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED'])
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PreventiveEventResponseDto {
  id!: string;
  clinicId!: string;
  clientId!: string;
  petId!: string;
  appointmentId?: string;
  serviceId!: string;
  eventType!: string;
  appliedAt!: Date;
  nextDueAt?: Date;
  cycleType?: string;
  cycleValue?: number;
  reminderDaysBefore!: number;
  status!: string;
  notes?: string;
  createdAt!: Date;
  updatedAt!: Date;
}
