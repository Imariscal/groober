import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';

export class CreateClinicDto {
  @IsString()
  name!: string;

  @IsString()
  city!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  whatsapp_number?: string;

  @IsOptional()
  @IsEnum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE'])
  plan?: string;

  @IsOptional()
  @IsString()
  internal_notes?: string;
}

export class UpdateClinicDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE'])
  plan?: string;

  @IsOptional()
  @IsString()
  internal_notes?: string;
}

export class SuspendClinicDto {
  @IsString()
  reason!: string;

  @IsOptional()
  notify_clinic?: boolean;
}
