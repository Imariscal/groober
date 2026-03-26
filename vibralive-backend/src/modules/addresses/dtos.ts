import {
  IsString,
  IsOptional,
  IsNumber,
  Length,
  IsUUID,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

// Helper to convert empty strings to undefined
const emptyToUndefined = ({ value }: { value: unknown }) => 
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export class CreateClientAddressDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @Length(1, 100)
  label?: string; // e.g., "Casa", "Trabajo"

  @IsString()
  @Length(3, 255)
  street!: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(20)
  number_ext?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(20)
  number_int?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @Length(2, 100)
  neighborhood?: string;

  @IsString()
  @Length(2, 100)
  city!: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(50)
  state?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(20)
  zip_code?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  references?: string; // Observaciones, referencias

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean; // SI es primera => auto true
}

export class UpdateClientAddressDto {
  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @Length(1, 100)
  label?: string;

  @IsOptional()
  @IsString()
  @Length(3, 255)
  street?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(20)
  number_ext?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(20)
  number_int?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @Length(2, 100)
  neighborhood?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  city?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(50)
  state?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(20)
  zip_code?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  references?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}

export class SetDefaultAddressDto {
  @IsBoolean()
  is_default!: boolean; // true para marcar como default
}

export class ClientAddressResponseDto {
  id!: string;
  clinic_id!: string;
  client_id!: string;
  label?: string;
  street!: string;
  number_ext?: string;
  number_int?: string;
  neighborhood?: string;
  city!: string;
  state?: string;
  zip_code?: string;
  references?: string;
  lat?: number;
  lng?: number;
  geocode_status!: string; // PENDING|OK|FAILED
  is_default!: boolean;
  created_at!: Date;
  updated_at!: Date;
}
