import {
  IsOptional,
  IsISO8601,
  IsString,
  IsInt,
  IsEnum,
  Length,
  Min,
  IsUUID,
  IsIn,
} from 'class-validator';
import { LocationType } from './create-appointment.dto';

const AppointmentStatus = [
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
  'UNATTENDED',
] as const;

export class UpdateAppointmentDto {
  @IsOptional()
  @IsISO8601()
  scheduled_at?: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  reason?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  duration_minutes?: number;

  @IsOptional()
  @IsUUID()
  veterinarian_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(LocationType)
  location_type?: LocationType;

  @IsOptional()
  @IsUUID()
  address_id?: string;

  @IsOptional()
  assigned_staff_user_id?: string | null; // Can be UUID string or null to unassign

  @IsOptional()
  @IsIn(AppointmentStatus)
  status?: (typeof AppointmentStatus)[number];

  @IsOptional()
  @IsISO8601()
  rescheduled_at?: string;
}
