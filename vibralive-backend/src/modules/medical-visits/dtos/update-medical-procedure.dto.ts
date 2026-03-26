import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  Length,
  Min,
} from 'class-validator';

export class UpdateMedicalProcedureDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  procedureType?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  procedureName?: string;

  @IsOptional()
  @IsDateString()
  procedureDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  anesthesiaType?: string;

  @IsOptional()
  @IsString()
  complications?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
