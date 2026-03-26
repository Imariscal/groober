import {
  IsArray,
  IsString,
  IsInt,
  Min,
  Max,
  ValidateNested,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ServiceItemDto {
  @IsString()
  serviceId!: string;

  @IsInt()
  @Min(1)
  quantity: number = 1;
}

export class UpdateAppointmentServicesDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceItemDto)
  services?: ServiceItemDto[];

  @IsOptional()
  @IsUUID()
  address_id?: string;

  @ValidateIf((o) => o.assigned_staff_user_id !== null)
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => (value === null ? null : value))
  assigned_staff_user_id?: string | null; // null = unassign

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  @Transform(({ obj }) => {
    // Aceptar tanto duration_minutes como durationMinutes
    return obj.duration_minutes ?? obj.durationMinutes;
  })
  durationMinutes?: number; // Duración personalizada (15-480 min). Si no se proporciona, se recalcula automáticamente.

  // Nota: scheduled_at, location_type, pet_id, client_id son readonly en modo EDIT
}
