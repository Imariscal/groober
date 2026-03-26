import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Or, Equal } from 'typeorm';
import { Role, Permission, RolePermission } from '@/database/entities';
import { RoleResponseDto, PermissionResponseDto } from './roles.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) {}

  /**
   * List all roles available for a clinic (system roles + clinic-specific roles)
   */
  async listAvailableRoles(clinicId: string): Promise<RoleResponseDto[]> {
    const roles = await this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.rolePermissions', 'rp')
      .leftJoinAndSelect('rp.permission', 'permission')
      .where('role.clinic_id IS NULL OR role.clinic_id = :clinicId', { clinicId })
      .orderBy('role.is_system', 'DESC')
      .addOrderBy('role.name', 'ASC')
      .getMany();

    return roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.rolePermissions?.map((rp) => rp.permission.code) || [],
    }));
  }

  /**
   * List all system permissions
   */
  async listPermissions(): Promise<PermissionResponseDto[]> {
    const permissions = await this.permissionRepository.find({
      order: { code: 'ASC' },
    });

    return permissions.map((p) => ({
      id: p.id,
      code: p.code,
      description: p.description,
    }));
  }
}
