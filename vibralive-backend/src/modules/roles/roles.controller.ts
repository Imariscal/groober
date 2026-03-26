import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@/common/guards';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { PermissionGuard } from '@/modules/auth/guards/permission.guard';
import { RequirePermission } from '@/modules/auth/decorators/permission.decorator';
import { RolesService } from './roles.service';
import { RoleResponseDto, PermissionResponseDto } from './roles.dto';

@Controller('clinics/:clinicId/roles')
@UseGuards(AuthGuard, TenantGuard, PermissionGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermission('roles:read')
  async listRoles(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
  ): Promise<RoleResponseDto[]> {
    return this.rolesService.listAvailableRoles(clinicId);
  }

  @Get('permissions')
  @RequirePermission('roles:read')
  async listPermissions(): Promise<PermissionResponseDto[]> {
    return this.rolesService.listPermissions();
  }
}
