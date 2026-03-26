import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@/common/guards';
import { RolesService } from '../services/roles.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleWithPermissionsResponseDto,
  PermissionResponseDto,
} from '../dtos';

@Controller('clinics/:clinicId/roles')
@UseGuards(AuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * GET /api/clinics/:clinicId/roles
   * List all roles available for the clinic (system + custom)
   */
  @Get()
  async listRoles(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
  ): Promise<RoleWithPermissionsResponseDto[]> {
    return this.rolesService.listRoles(clinicId);
  }

  /**
   * GET /api/clinics/:clinicId/roles/permissions
   * List all available permissions
   */
  @Get('permissions')
  async listPermissions(): Promise<PermissionResponseDto[]> {
    return this.rolesService.listAllPermissions();
  }

  /**
   * GET /api/clinics/:clinicId/roles/:roleId
   * Get a specific role with its permissions
   */
  @Get(':roleId')
  async getRole(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<RoleWithPermissionsResponseDto> {
    return this.rolesService.getRole(clinicId, roleId);
  }

  /**
   * POST /api/clinics/:clinicId/roles
   * Create a custom role for the clinic
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRole(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Body() dto: CreateRoleDto,
  ): Promise<RoleWithPermissionsResponseDto> {
    return this.rolesService.createRole(clinicId, dto);
  }

  /**
   * PUT /api/clinics/:clinicId/roles/:roleId
   * Update a custom role (cannot update system roles)
   */
  @Put(':roleId')
  async updateRole(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<RoleWithPermissionsResponseDto> {
    return this.rolesService.updateRole(clinicId, roleId, dto);
  }

  /**
   * DELETE /api/clinics/:clinicId/roles/:roleId
   * Delete a custom role (cannot delete system roles)
   */
  @Delete(':roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(
    @Param('clinicId', ParseUUIDPipe) clinicId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ): Promise<void> {
    return this.rolesService.deleteRole(clinicId, roleId);
  }
}
