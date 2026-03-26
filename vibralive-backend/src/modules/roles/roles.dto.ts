export class RoleResponseDto {
  id!: string;
  code!: string;
  name!: string;
  description!: string | null;
  isSystem!: boolean;
  permissions!: string[];
}

export class PermissionResponseDto {
  id!: string;
  code!: string;
  description!: string | null;
}
