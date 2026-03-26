import {
  IsUUID,
  IsString,
  IsEnum,
  IsOptional,
  Length,
  IsISO8601,
  IsDateString,
} from 'class-validator';

export enum TestType {
  BLOOD_TEST = 'BLOOD_TEST',
  URINE_TEST = 'URINE_TEST',
  FECAL_TEST = 'FECAL_TEST',
  XRAY = 'XRAY',
  ULTRASOUND = 'ULTRASOUND',
  ECG = 'ECG',
  ENDOSCOPY = 'ENDOSCOPY',
}

export class CreateDiagnosticOrderDto {
  // medicalVisitId viene como parámetro de ruta, NO en el body
  // petId es el único UUID requerido en el body

  @IsUUID()
  petId!: string;

  @IsEnum(TestType)
  testType!: TestType;

  @IsString()
  @Length(1, 100)
  testName!: string;

  @IsString()
  @Length(1, 500)
  reason!: string;

  @IsDateString()
  dueDate!: string; // YYYY-MM-DD format

  @IsOptional()
  @IsString()
  @Length(1, 100)
  labName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  labReferenceId?: string;
}
