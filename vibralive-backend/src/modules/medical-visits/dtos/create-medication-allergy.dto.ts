import {
  IsUUID,
  IsString,
  IsEnum,
  IsOptional,
  Length,
  IsISO8601,
} from 'class-validator';

export class CreateMedicationAllergyDto {
  @IsUUID()
  petId!: string;

  @IsString()
  @Length(1, 200)
  medicationName!: string;

  @IsEnum(['MILD', 'MODERATE', 'SEVERE'])
  severity!: 'MILD' | 'MODERATE' | 'SEVERE';

  @IsString()
  @Length(1, 500)
  reaction!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  medicationId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}
