import {
  IsUUID,
  IsString,
  IsOptional,
  IsISO8601,
  IsDateString,
  Length,
} from 'class-validator';

export class CreateVaccinationDto {
  @IsUUID()
  petId!: string;

  @IsUUID()
  vaccineId!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  vaccineBatch?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  manufacturer?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lotNumber?: string;

  @IsISO8601()
  administeredDate!: string; // ISO 8601 format (UTC)

  @IsOptional()
  @IsDateString()
  expirationDate?: string; // YYYY-MM-DD format

  @IsOptional()
  @IsString()
  @Length(1, 500)
  adverseReactions?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  notes?: string;
}

