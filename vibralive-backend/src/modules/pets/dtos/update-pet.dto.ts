import {
  IsString,
  IsUUID,
  IsOptional,
  Length,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePetDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto' })
  @Length(2, 50, {
    message: 'El nombre debe tener entre 2 y 50 caracteres',
  })
  name?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El tipo de animal debe ser un UUID válido' })
  animal_type_id?: string;

  @IsOptional()
  @IsString({ message: 'La fecha de nacimiento es requerida' })
  birth_date?: string;

  @IsOptional()
  @IsString({ message: 'El género debe ser válido' })
  gender?: 'male' | 'female';

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El peso debe ser un número' })
  @Min(0.1, { message: 'El peso debe ser mayor a 0' })
  @Max(500, { message: 'El peso debe ser menor a 500 kg' })
  weight_kg?: number;

  @IsOptional()
  @IsString()
  @Length(0, 100, {
    message: 'La descripción debe tener máximo 100 caracteres',
  })
  color_description?: string;

  @IsOptional()
  @IsString({ message: 'La fecha de próxima vacuna es requerida' })
  next_vaccine_date?: string;

  @IsOptional()
  @IsString({ message: 'La fecha de próxima desparasitación es requerida' })
  next_deworming_date?: string;
}
