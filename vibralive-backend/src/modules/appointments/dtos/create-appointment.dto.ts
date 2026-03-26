import {
  IsUUID,
  IsISO8601,
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  Length,
  Min,
} from 'class-validator';

export enum LocationType {
  CLINIC = 'CLINIC',
  HOME = 'HOME',
}

export enum AssignmentSource {
  NONE = 'NONE',
  AUTO_ROUTE = 'AUTO_ROUTE',
  MANUAL_RECEPTION = 'MANUAL_RECEPTION',
  COMPLETED_IN_CLINIC = 'COMPLETED_IN_CLINIC',
}

export class CreateAppointmentDto {
  @IsUUID()
  pet_id!: string;

  @IsUUID()
  client_id!: string;

  @IsISO8601()
  scheduled_at!: string; // ISO 8601 format

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
  @IsEnum(LocationType)
  location_type?: LocationType; // CLINIC (default) | HOME

  @IsOptional()
  @IsUUID()
  address_id?: string; // Required if location_type=HOME

  @IsOptional()
  @IsUUID()
  assigned_staff_user_id?: string; // For MANUAL_RECEPTION grooming assignments
}
