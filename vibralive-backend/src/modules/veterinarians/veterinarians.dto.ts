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
import { VeterinarianSpecialty as VeterinarianSpecialtyEntity } from '@/database/entities/veterinarian.entity';
import { UnavailablePeriodReason } from '@/database/entities/veterinarian-unavailable-period.entity';

// Runtime enum for validation
export enum VeterinarianSpecialtyEnum {
  GENERAL = 'GENERAL',
  SURGERY = 'SURGERY',
  CARDIOLOGY = 'CARDIOLOGY',
  DERMATOLOGY = 'DERMATOLOGY',
  ORTHOPEDICS = 'ORTHOPEDICS',
  OPHTHALMOLOGY = 'OPHTHALMOLOGY',
  DENTISTRY = 'DENTISTRY',
  OTHER = 'OTHER',
}

// Runtime enum for unavailable reason
export enum UnavailablePeriodReasonEnum {
  VACATION = 'VACATION',
  SICK_LEAVE = 'SICK_LEAVE',
  REST_DAY = 'REST_DAY',
  PERSONAL = 'PERSONAL',
  OTHER = 'OTHER',
}

// Type alias for DTOs
export type VeterinarianSpecialty = VeterinarianSpecialtyEntity;

export class CreateVeterinarianDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsEnum(VeterinarianSpecialtyEnum)
  specialty?: VeterinarianSpecialty;

  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'calendarColor must be a valid hex color' })
  calendarColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  licenseNumber?: string;
}

export class UpdateVeterinarianDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsEnum(VeterinarianSpecialtyEnum)
  specialty?: VeterinarianSpecialty;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'calendarColor must be a valid hex color' })
  calendarColor?: string;

  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  licenseNumber?: string;
}

export class VeterinarianListResponseDto {
  id!: string;
  userId!: string;
  displayName!: string | null;
  specialty!: VeterinarianSpecialty;
  isBookable!: boolean;
  calendarColor!: string | null;
  licenseNumber!: string | null;
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

export class CreateVeterinarianAvailabilityDto {
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

export class UpdateVeterinarianAvailabilityDto {
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

export class VeterinarianAvailabilityResponseDto {
  id!: string;
  veterinarian_id!: string;
  day_of_week!: number;
  start_time!: string;
  end_time!: string;
  is_active!: boolean;
  created_at!: Date;
  updated_at!: Date;
}

// ============= UNAVAILABLE PERIOD DTOs =============

export class CreateVeterinarianUnavailablePeriodDto {
  @IsEnum(UnavailablePeriodReasonEnum)
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

export class UpdateVeterinarianUnavailablePeriodDto {
  @IsOptional()
  @IsEnum(UnavailablePeriodReasonEnum)
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

export class VeterinarianUnavailablePeriodResponseDto {
  id!: string;
  veterinarian_id!: string;
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

export class CreateVeterinarianCapacityDto {
  @IsDateString()
  date!: string; // YYYY-MM-DD

  @IsInt()
  @Min(1)
  max_appointments!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVeterinarianCapacityDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  max_appointments?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class VeterinarianCapacityResponseDto {
  id!: string;
  veterinarian_id!: string;
  date!: Date;
  max_appointments!: number;
  notes?: string | null;
  created_at!: Date;
  updated_at!: Date;
}

// ============= AVAILABILITY CHECK DTOs =============

export class CheckVeterinarianAvailabilityDto {
  @IsISO8601()
  appointment_start!: string; // ISO 8601 datetime

  @IsISO8601()
  appointment_end!: string; // ISO 8601 datetime

  @IsOptional()
  @IsUUID()
  exclude_appointment_id?: string;
}

export class VeterinarianAvailabilityCheckResponseDto {
  available!: boolean;
  reason?: string;
  details?: Record<string, any>;
}

export class GetAvailableVeterinariansDto {
  @IsISO8601()
  appointment_start!: string;

  @IsISO8601()
  appointment_end!: string;
}

export class VeterinarianAvailableSlotDto {
  veterinarian_id!: string;
  veterinarian_name!: string;
  specialty!: VeterinarianSpecialty;
  available!: boolean;
  conflicts?: string[];
}
