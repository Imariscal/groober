import { IsString, IsEmail, IsOptional, IsArray, ValidateNested, IsBoolean, MaxLength, MinLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class StylistProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'calendarColor must be a valid hex color (e.g., #FF6B6B)' })
  calendarColor?: string;

  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;
}

export class VeterinarianProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'calendarColor must be a valid hex color (e.g., #FF6B6B)' })
  calendarColor?: string;

  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;
}

export class CreateClinicUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsArray()
  @IsString({ each: true })
  roles!: string[]; // Array of role codes: ['CLINIC_STAFF', 'CLINIC_STYLIST', 'CLINIC_VETERINARIAN']

  @IsOptional()
  @ValidateNested()
  @Type(() => StylistProfileDto)
  stylistProfile?: StylistProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VeterinarianProfileDto)
  veterinarianProfile?: VeterinarianProfileDto;
}

export class UpdateClinicUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => StylistProfileDto)
  stylistProfile?: StylistProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VeterinarianProfileDto)
  veterinarianProfile?: VeterinarianProfileDto;
}

export class DeactivateUserDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class StylistResponseDto {
  id!: string;
  displayName!: string | null;
  isBookable!: boolean;
  calendarColor!: string | null;
}

export class VeterinarianResponseDto {
  id!: string;
  displayName!: string | null;
  isBookable!: boolean;
  calendarColor!: string | null;
}

export class RoleResponseDto {
  code!: string;
  name!: string;
}

export class ClinicUserResponseDto {
  id!: string;
  name!: string;
  email!: string;
  phone!: string | null;
  status!: string;
  roles!: RoleResponseDto[];
  isStylist!: boolean;
  stylistProfile!: StylistResponseDto | null;
  isVeterinarian!: boolean;
  veterinarianProfile!: VeterinarianResponseDto | null;
  lastLogin!: Date | null;
  createdAt!: Date;
}

export class ListClinicUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: 'INVITED' | 'ACTIVE' | 'DEACTIVATED';

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isStylist?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isVeterinarian?: boolean;
}
