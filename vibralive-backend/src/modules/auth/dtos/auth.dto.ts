import {
  IsEmail,
  IsString,
  Length,
  IsOptional,
  Matches,
  ValidateIf,
} from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Ingresa un email válido' })
  email!: string;

  @IsString()
  @Length(6, 255, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;
}

export class RegisterDto {
  @IsString({ message: 'El nombre de la clínica debe ser texto' })
  @Length(3, 100, {
    message: 'El nombre debe tener entre 3 y 100 caracteres',
  })
  clinic_name!: string;

  @IsString({ message: 'El teléfono debe ser válido' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message:
      'El teléfono debe ser válido (formato E.164, ej: +525512345678)',
  })
  clinic_phone!: string;

  @IsString()
  @Length(3, 100, {
    message: 'El nombre debe tener entre 3 y 100 caracteres',
  })
  owner_name!: string;

  @IsEmail({}, { message: 'Ingresa un email válido' })
  owner_email!: string;

  @IsString()
  @Length(8, 255, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  @Matches(/[A-Z]/, {
    message: 'La contraseña debe contener al menos una mayúscula',
  })
  @Matches(/[a-z]/, {
    message: 'La contraseña debe contener al menos una minúscula',
  })
  @Matches(/[0-9]/, {
    message: 'La contraseña debe contener al menos un número',
  })
  @Matches(/[!@#$%^&*]/, {
    message:
      'La contraseña debe contener al menos un carácter especial (!@#$%^&*)',
  })
  password!: string;

  @IsOptional()
  @IsString()
  @Length(3, 100, { message: 'La ciudad debe tener entre 3 y 100 caracteres' })
  city?: string;
}

export class AcceptInvitationDto {
  @IsString({ message: 'El token de invitación es requerido' })
  invitation_token!: string;

  @IsString()
  @Length(8, 255, {
    message: 'La contraseña debe tener al menos 8 caracteres',
  })
  @Matches(/[A-Z]/, {
    message: 'La contraseña debe contener al menos una mayúscula',
  })
  @Matches(/[a-z]/, {
    message: 'La contraseña debe contener al menos una minúscula',
  })
  @Matches(/[0-9]/, {
    message: 'La contraseña debe contener al menos un número',
  })
  @Matches(/[!@#$%^&*]/, {
    message:
      'La contraseña debe contener al menos un carácter especial (!@#$%^&*)',
  })
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  refresh_token!: string;
}

export class AuthResponseDto {
  access_token!: string;
  refresh_token?: string;
  user!: {
    id: string;
    clinic_id: string | null;
    email: string;
    name: string;
    role: string;
    status: string;
    permissions: string[];
    available_features: string[];
    available_menu: string[];
  };
}
