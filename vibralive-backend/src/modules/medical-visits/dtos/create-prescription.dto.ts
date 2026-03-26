import {
  IsUUID,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Length,
  Min,
  IsISO8601,
  IsDateString,
} from 'class-validator';

export enum MedicationRoute {
  ORAL = 'ORAL',
  INJECTION = 'INJECTION',
  TOPICAL = 'TOPICAL',
  INHALED = 'INHALED',
}

export class CreatePrescriptionDto {
  @IsUUID()
  medicalVisitId!: string;

  @IsUUID()
  petId!: string;

  @IsString()
  @Length(1, 200)
  medicationName!: string;

  @IsString()
  @Length(1, 50)
  dosage!: string;

  @IsString()
  @Length(1, 20)
  dosageUnit!: string; // mg, ml, units, etc

  @IsString()
  @Length(1, 100)
  frequency!: string; // "2x daily", "Every 8 hours", etc

  @IsNumber()
  @Min(1)
  durationDays!: number;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsEnum(MedicationRoute)
  route!: MedicationRoute;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  instructions?: string;

  @IsNumber()
  @Min(0)
  refillsAllowed?: number;

  @IsDateString()
  startDate!: string; // YYYY-MM-DD format

  @IsDateString()
  endDate!: string; // YYYY-MM-DD format

  @IsOptional()
  @IsString()
  @Length(1, 100)
  medicationId?: string;
}
