import { IsString, IsEmail, IsOptional, Length, Matches } from 'class-validator';

export class CreateClinicOwnerDto {
  @IsString()
  @Length(3, 255, {
    message: 'El nombre debe tener entre 3 y 255 caracteres',
  })
  name!: string;

  @IsEmail({}, { message: 'El email debe ser válido' })
  email!: string;

  @IsOptional()
  @IsString()
  @Length(10, 20)
  @Matches(/^\+?[0-9\s\-()]+$/, {
    message: 'El teléfono debe ser un formato válido',
  })
  phone?: string;
}
