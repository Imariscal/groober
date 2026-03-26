import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  Matches,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsISO8601,
} from 'class-validator';
import { StylistType as StylistTypeEntity } from '@/database/entities/stylist.entity';

// Runtime enum for validation
export enum StylistTypeEnum {
  CLINIC = 'CLINIC',
  HOME = 'HOME',
}

// Type alias for DTOs
export type StylistType = StylistTypeEntity;

export class UpdateStylistDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'calendarColor must be a valid hex color' })
  calendarColor?: string;

  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;

  @IsOptional()
  @IsEnum(StylistTypeEnum)
  type?: StylistType;
}

export class StylistListResponseDto {
  id!: string;
  userId!: string;
  displayName!: string | null;
  type!: StylistType;
  isBookable!: boolean;
  calendarColor!: string | null;
  user!: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
  createdAt!: Date;
  updatedAt!: Date;
}

// ============= AVAILABILITY DTOs =============

export class CreateStylistAvailabilityDto {
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week!: number; // 0=Monday, 6=Sunday

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'start_time must be in HH:mm format',
  })
  start_time!: string; // HH:mm

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'end_time must be in HH:mm format',
  })
  end_time!: string; // HH:mm

  @IsOptional()
  @IsBoolean()
  is_active?: boolean; // default: true
}

export class UpdateStylistAvailabilityDto {
  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'start_time must be in HH:mm format',
  })
  start_time?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'end_time must be in HH:mm format',
  })
  end_time?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class StylistAvailabilityResponseDto {
  id!: string;
  stylist_id!: string;
  day_of_week!: number;
  start_time!: string;
  end_time!: string;
  is_active!: boolean;
  created_at!: Date;
  updated_at!: Date;
}

// ============= UNAVAILABLE PERIOD DTOs =============

export enum UnavailablePeriodReason {
  VACATION = 'VACATION',
  SICK_LEAVE = 'SICK_LEAVE',
  REST_DAY = 'REST_DAY',
  PERSONAL = 'PERSONAL',
  OTHER = 'OTHER',
}

export class CreateStylistUnavailablePeriodDto {
  @IsEnum(UnavailablePeriodReason)
  reason!: UnavailablePeriodReason;

  @IsDateString()
  start_date!: string; // YYYY-MM-DD

  @IsDateString()
  end_date!: string; // YYYY-MM-DD

  @IsOptional()
  @IsBoolean()
  is_all_day?: boolean; // default: true

  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'start_time must be in HH:mm format',
  })
  start_time?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'end_time must be in HH:mm format',
  })
  end_time?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateStylistUnavailablePeriodDto {
  @IsOptional()
  @IsEnum(UnavailablePeriodReason)
  reason?: UnavailablePeriodReason;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsBoolean()
  is_all_day?: boolean;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class StylistUnavailablePeriodResponseDto {
  id!: string;
  stylist_id!: string;
  reason!: UnavailablePeriodReason;
  start_date!: Date;
  end_date!: Date;
  is_all_day!: boolean;
  start_time?: string | null;
  end_time?: string | null;
  notes?: string | null;
  created_at!: Date;
  updated_at!: Date;
}

// ============= CAPACITY DTOs =============

export class CreateStylistCapacityDto {
  @IsDateString()
  date!: string; // YYYY-MM-DD

  @IsInt()
  @Min(1)
  max_appointments!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateStylistCapacityDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  max_appointments?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class StylistCapacityResponseDto {
  id!: string;
  stylist_id!: string;
  date!: Date;
  max_appointments!: number;
  notes?: string | null;
  created_at!: Date;
  updated_at!: Date;
}

// ============= AVAILABILITY CHECK DTOs =============

export class CheckAvailabilityDto {
  @IsISO8601()
  appointment_start!: string; // ISO 8601 datetime

  @IsISO8601()
  appointment_end!: string; // ISO 8601 datetime

  @IsOptional()
  @IsUUID()
  exclude_appointment_id?: string;

  @IsOptional()
  @IsString()
  appointment_type?: string; // GROOMING or MEDICAL to filter conflicts
}

export class AvailabilityCheckResponseDto {
  available!: boolean;
  reason?: string;
  details?: Record<string, any>;
}

export class GetAvailableStylitsDto {
  @IsISO8601()
  appointment_start!: string;

  @IsISO8601()
  appointment_end!: string;
}

export class StylistAvailableSlotDto {
  stylist_id!: string;
  stylist_name!: string;
  available!: boolean;
  conflicts?: string[];
}
