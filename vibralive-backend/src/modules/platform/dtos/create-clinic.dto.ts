import { IsString, IsOptional, IsEmail, Length, Matches } from 'class-validator';

export class CreateClinicDto {
  @IsString()
  @Length(3, 255, {
    message: 'El nombre de la clínica debe tener entre 3 y 255 caracteres',
  })
  name!: string;

  @IsString()
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, {
    message: 'El teléfono debe ser un formato válido (ej: +525551234567)',
  })
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @Length(3, 255, {
    message: 'El nombre del responsable debe tener entre 3 y 255 caracteres',
  })
  responsable!: string;

  @IsString()
  @Length(2, 100, {
    message: 'La ciudad debe tener entre 2 y 100 caracteres',
  })
  city!: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  country?: string;

  @IsOptional()
  @IsString()
  subscription_plan?: 'starter' | 'professional' | 'enterprise';

  @IsOptional()
  @IsString()
  plan?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

  @IsOptional()
  max_staff_users?: number;

  @IsOptional()
  max_clients?: number;

  @IsOptional()
  max_pets?: number;

  @IsOptional()
  @IsString()
  whatsapp_account_id?: string;

  @IsOptional()
  @IsString()
  whatsapp_phone_id?: string;
}
