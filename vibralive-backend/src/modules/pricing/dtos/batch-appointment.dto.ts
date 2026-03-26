import {
  IsUUID,
  IsArray,
  IsOptional,
  IsNumber,
  IsDateString,
  IsEnum,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BatchAppointmentPetDto {
  @IsUUID()
  petId!: string;

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
  reason?: string;
}

export class CreateBatchAppointmentWithPricingDto {
  @IsOptional()
  @IsUUID()
  clinicId?: string;

  @IsUUID()
  clientId!: string;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsNumber()
  @Min(15)
  durationMinutes?: number;

  @IsOptional()
  reason?: string;

  @IsOptional()
  notes?: string;

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

  @IsOptional()
  @IsUUID()
  customPriceListId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchAppointmentPetDto)
  @ArrayMinSize(1)
  pets!: BatchAppointmentPetDto[];
}
