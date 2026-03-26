import { IsString, Length } from 'class-validator';

export class SuspendClinicDto {
  @IsString()
  @Length(10, 500, {
    message: 'La razón debe tener entre 10 y 500 caracteres',
  })
  reason!: string;
}
