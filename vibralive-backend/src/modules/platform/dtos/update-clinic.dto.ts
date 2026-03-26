import { IsString, IsOptional, Length } from 'class-validator';

export class UpdateClinicDto {
  @IsOptional()
  @IsString()
  @Length(3, 255, {
    message: 'El nombre debe tener entre 3 y 255 caracteres',
  })
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  city?: string;

  @IsOptional()
  @IsString()
  plan?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

  @IsOptional()
  @IsString()
  subscription_plan?: 'starter' | 'professional' | 'enterprise';
}
