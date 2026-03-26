import {
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsISO8601,
  IsEnum,
  Min,
  Max,
  IsDateString,
  Length,
} from 'class-validator';

export enum VisitType {
  CHECKUP = 'CHECKUP',
  VACCINATION = 'VACCINATION',
  SURGERY = 'SURGERY',
  CONSULTATION = 'CONSULTATION',
  FOLLOWUP = 'FOLLOWUP',
  EMERGENCY = 'EMERGENCY',
}

export class CreateMedicalVisitDto {
  @IsUUID()
  appointmentId!: string;

  @IsUUID()
  petId!: string;

  @IsOptional()
  @IsUUID()
  veterinarianId?: string;

  @IsEnum(VisitType)
  visitType!: VisitType;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  reasonForVisit?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  chiefComplaint?: string;

  // === EXAM DATA ===
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(32)
  @Max(106)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(200)
  heartRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(100)
  respiratoryRate?: number;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  bloodPressure?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(9)
  bodyConditionScore?: number;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  coatCondition?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  generalNotes?: string;

  // === DIAGNOSIS & TREATMENT ===
  @IsOptional()
  @IsString()
  @Length(1, 500)
  preliminaryDiagnosis?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  treatmentPlan?: string;

  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @IsOptional()
  @IsISO8601()
  followUpDate?: string;
}
