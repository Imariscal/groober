import {
  IsString,
  IsArray,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  MinLength,
  Matches,
  ArrayUnique,
} from 'class-validator';

/**
 * DTO for creating a custom role
 */
export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'El código debe ser en mayúsculas, empezar con letra y solo contener letras, números y guiones bajos',
  })
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionCodes!: string[];
}

/**
 * DTO for updating a custom role
 */
export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsArray()
  @IsOptional()
  @ArrayUnique()
  @IsString({ each: true })
  permissionCodes?: string[];
}

/**
 * Response DTO for a permission
 */
export class PermissionResponseDto {
  code!: string;
  name!: string;
  description!: string | null;
  category!: string;
}

/**
 * Response DTO for a role with permissions
 */
export class RoleWithPermissionsResponseDto {
  id!: string;
  code!: string;
  name!: string;
  description!: string | null;
  isSystem!: boolean;
  permissions!: PermissionResponseDto[];
  createdAt!: Date;
}
