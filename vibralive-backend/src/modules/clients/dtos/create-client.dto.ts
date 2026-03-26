import {
  IsString,
  IsEmail,
  Matches,
  IsOptional,
  Length,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateClientAddressInlineDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  label?: string;

  @IsString()
  @Length(3, 255)
  street!: string;

  @IsOptional()
  @IsString()
  number_ext?: string;

  @IsOptional()
  @IsString()
  number_int?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsString()
  @Length(2, 100)
  city!: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zip_code?: string;

  @IsOptional()
  @IsString()
  references?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateClientPetInlineDto {
  @IsString({ message: 'El nombre de la mascota es requerido' })
  @Length(1, 255, { message: 'El nombre debe tener entre 1 y 255 caracteres' })
  name!: string;

  @IsEnum(['DOG', 'CAT', 'BIRD', 'RABBIT', 'HAMSTER', 'GUINEA_PIG', 'FISH', 'TURTLE', 'FERRET', 'OTHER'], {
    message: 'Especie inválida',
  })
  species!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  breed?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de nacimiento inválida' })
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'UNKNOWN'], { message: 'Sexo inválido' })
  sex?: string;

  @IsOptional()
  @IsBoolean()
  isSterilized?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  color?: string;

  @IsOptional()
  @IsEnum(['XS', 'S', 'M', 'L', 'XL'], { message: 'Tamaño inválido' })
  size?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  microchipNumber?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  tagNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  allergies?: string;
}

export class CreateClientDto {
  @IsString({ message: 'El nombre debe ser texto' })
  @Length(3, 100, {
    message: 'El nombre debe tener entre 3 y 100 caracteres',
  })
  name!: string;

  @IsString({ message: 'El teléfono debe ser válido' })
  @Matches(/^(\+)?[1-9]\d{1,14}$/, {
    message: 'El teléfono debe ser válido',
  })
  phone!: string;

  @IsOptional()
  @IsEmail({}, { message: 'Ingresa un email válido' })
  email?: string;

  @IsOptional()
  @IsString()
  priceListId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 250, {
    message: 'La dirección debe tener máximo 250 caracteres',
  })
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // --- NUEVOS CAMPOS ---
  @IsOptional()
  @IsString()
  @Matches(/^(\+)?[1-9]\d{1,14}$/, {
    message: 'El WhatsApp debe ser válido',
  })
  whatsappNumber?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+)?[1-9]\d{1,14}$/, {
    message: 'El teléfono secundario debe ser válido',
  })
  phoneSecondary?: string;

  @IsOptional()
  @IsEnum(['WHATSAPP', 'PHONE', 'EMAIL', 'SMS'], {
    message: 'El método de contacto debe ser válido',
  })
  preferredContactMethod?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Hora de inicio debe estar en formato HH:MM',
  })
  preferredContactTimeStart?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Hora de fin debe estar en formato HH:MM',
  })
  preferredContactTimeEnd?: string;

  @IsOptional()
  @IsEnum(['HOUSE', 'APARTMENT', 'OTHER'], {
    message: 'Tipo de vivienda inválido',
  })
  housingType?: string;

  @IsOptional()
  @IsString()
  accessNotes?: string;

  @IsOptional()
  @IsString()
  serviceNotes?: string;

  @IsOptional()
  @IsBoolean()
  doNotContact?: boolean;

  @IsOptional()
  @IsString()
  doNotContactReason?: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'ARCHIVED', 'BLACKLISTED'])
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateClientAddressInlineDto)
  addresses?: CreateClientAddressInlineDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateClientPetInlineDto)
  pets?: CreateClientPetInlineDto[];
}
