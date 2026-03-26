import {
  IsUUID,
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsISO8601,
  Length,
  Min,
  Max,
} from 'class-validator';

export class AddDiagnosisDto {
  @IsUUID()
  medicalVisitId!: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  diagnosisCode?: string;

  @IsString()
  @Length(1, 200)
  diagnosisName!: string;

  @IsEnum(['MILD', 'MODERATE', 'SEVERE'])
  severity!: 'MILD' | 'MODERATE' | 'SEVERE';

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  notes?: string;
}
