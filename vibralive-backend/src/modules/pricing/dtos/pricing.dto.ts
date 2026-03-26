import { IsUUID, IsArray, IsOptional, IsNumber, Min, IsDateString, IsEnum } from 'class-validator';

export class CalculateAppointmentPricingDto {
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @IsOptional()
  @IsUUID()
  priceListId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds?: string[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  quantities?: number[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  packageIds?: string[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  packageQuantities?: number[];
}

export class CreateAppointmentWithPricingDto {
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @IsUUID()
  clientId!: string;

  @IsUUID()
  petId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  reason?: string;

  @IsOptional()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds?: string[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  quantities?: number[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  packageIds?: string[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  packageQuantities?: number[];

  @IsOptional()
  @IsUUID()
  customPriceListId?: string;

  @IsOptional()
  @IsEnum(['CLINIC', 'HOME'])
  locationType?: 'CLINIC' | 'HOME';

  @IsEnum(['MEDICAL', 'GROOMING'])
  serviceType!: 'MEDICAL' | 'GROOMING';

  @IsOptional()
  @IsUUID()
  addressId?: string;

  @IsOptional()
  @IsUUID()
  assignedStaffUserId?: string;
}

export class ValidatePricingDto {
  @IsUUID()
  appointmentId!: string;
}

export class GetAppointmentPricingDto {
  @IsUUID()
  appointmentId!: string;
}

