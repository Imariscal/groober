import { IsString, IsEnum, IsInt, IsOptional, IsNumber } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(['MEDICAL', 'GROOMING'])
  category!: 'MEDICAL' | 'GROOMING';

  @IsInt()
  defaultDurationMinutes!: number;

  @IsOptional()
  @IsNumber()
  price?: number;
}
