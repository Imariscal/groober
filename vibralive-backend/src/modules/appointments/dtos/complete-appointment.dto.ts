import { IsUUID, IsOptional } from 'class-validator';

export class CompleteAppointmentDto {
  @IsOptional()
  @IsUUID()
  performed_by_user_id?: string; // Stylist/vet who performed the appointment (required for CLINIC grooming)
}
