import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, IsNull } from 'typeorm';
import {
  Role,
  Permission,
  RolePermission,
  UserRole,
} from '@/database/entities';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleWithPermissionsResponseDto,
  PermissionResponseDto,
} from '../dtos';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    private dataSource: DataSource,
  ) {}

  /**
   * List all roles available for a clinic (system roles + custom clinic roles)
   */
  async listRoles(clinicId: string): Promise<RoleWithPermissionsResponseDto[]> {
    // Fetch system roles (clinicId = null) and clinic-specific roles
    const roles = await this.roleRepository.find({
      where: [
        { clinicId: IsNull() }, // System roles
        { clinicId }, // Custom clinic roles
      ],
      order: { isSystem: 'DESC', name: 'ASC' },
    });

    if (roles.length === 0) {
      return [];
    }

    const roleIds = roles.map((r) => r.id);

    // Fetch all role permissions with permission details
    const rolePermissions = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.permission', 'permission')
      .where('rp.role_id IN (:...roleIds)', { roleIds })
      .getMany();

    // Group permissions by role
    const permissionsByRole = new Map<string, Permission[]>();
    for (const rp of rolePermissions) {
      const existing = permissionsByRole.get(rp.roleId) || [];
      existing.push(rp.permission);
      permissionsByRole.set(rp.roleId, existing);
    }

    return roles.map((role) => this.mapToResponse(role, permissionsByRole.get(role.id) || []));
  }

  /**
   * Get a specific role with its permissions
   */
  async getRole(clinicId: string, roleId: string): Promise<RoleWithPermissionsResponseDto> {
    const role = await this.roleRepository.findOne({
      where: [
        { id: roleId, clinicId: IsNull() }, // System role
        { id: roleId, clinicId }, // Custom clinic role
      ],
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId },
      relations: ['permission'],
    });

    const permissions = rolePermissions.map((rp) => rp.permission);

    return this.mapToResponse(role, permissions);
  }

  /**
   * List all available permissions
   */
  async listAllPermissions(): Promise<PermissionResponseDto[]> {
    const permissions = await this.permissionRepository.find({
      order: { category: 'ASC', code: 'ASC' },
    });

    return permissions.map((p) => ({
      code: p.code,
      name: p.name,
      description: p.description,
      category: p.category,
    }));
  }

  /**
   * Create a custom role for a clinic
   */
  async createRole(
    clinicId: string,
    dto: CreateRoleDto,
  ): Promise<RoleWithPermissionsResponseDto> {
    // Check if role code already exists for this clinic
    const existingRole = await this.roleRepository.findOne({
      where: [
        { code: dto.code, clinicId: IsNull() }, // System role with same code
        { code: dto.code, clinicId }, // Clinic role with same code
      ],
    });

    if (existingRole) {
      throw new ConflictException(`Ya existe un rol con el código "${dto.code}"`);
    }

    // Validate permissions exist
    const permissions = await this.permissionRepository.find({
      where: { code: In(dto.permissionCodes) },
    });

    if (permissions.length !== dto.permissionCodes.length) {
      const foundCodes = permissions.map((p) => p.code);
      const missing = dto.permissionCodes.filter((c) => !foundCodes.includes(c));
      throw new BadRequestException(`Permisos no encontrados: ${missing.join(', ')}`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create role
      const role = queryRunner.manager.create(Role, {
        clinicId,
        code: dto.code,
        name: dto.name,
        description: dto.description || null,
        isSystem: false,
      });

      const savedRole = await queryRunner.manager.save(Role, role);

      // Assign permissions
      const rolePermissions = permissions.map((permission) =>
        queryRunner.manager.create(RolePermission, {
          roleId: savedRole.id,
          permissionId: permission.id,
        }),
      );

      await queryRunner.manager.save(RolePermission, rolePermissions);

      await queryRunner.commitTransaction();

      return this.mapToResponse(savedRole, permissions);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update a custom role (cannot update system roles)
   */
  async updateRole(
    clinicId: string,
    roleId: string,
    dto: UpdateRoleDto,
  ): Promise<RoleWithPermissionsResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, clinicId },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado o es un rol del sistema');
    }

    if (role.isSystem) {
      throw new BadRequestException('No se pueden modificar los roles del sistema');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update role fields
      if (dto.name !== undefined) {
        role.name = dto.name;
      }
      if (dto.description !== undefined) {
        role.description = dto.description;
      }

      await queryRunner.manager.save(Role, role);

      // Update permissions if provided
      let permissions: Permission[] = [];
      if (dto.permissionCodes !== undefined) {
        // Validate new permissions
        permissions = await this.permissionRepository.find({
          where: { code: In(dto.permissionCodes) },
        });

        if (permissions.length !== dto.permissionCodes.length) {
          const foundCodes = permissions.map((p) => p.code);
          const missing = dto.permissionCodes.filter((c) => !foundCodes.includes(c));
          throw new BadRequestException(`Permisos no encontrados: ${missing.join(', ')}`);
        }

        // Delete old permissions
        await queryRunner.manager.delete(RolePermission, { roleId });

        // Add new permissions
        const rolePermissions = permissions.map((permission) =>
          queryRunner.manager.create(RolePermission, {
            roleId,
            permissionId: permission.id,
          }),
        );

        await queryRunner.manager.save(RolePermission, rolePermissions);
      } else {
        // Load existing permissions
        const rps = await queryRunner.manager.find(RolePermission, {
          where: { roleId },
          relations: ['permission'],
        });
        permissions = rps.map((rp) => rp.permission);
      }

      await queryRunner.commitTransaction();

      return this.mapToResponse(role, permissions);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete a custom role (cannot delete system roles)
   */
  async deleteRole(clinicId: string, roleId: string): Promise<void> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId, clinicId },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado o es un rol del sistema');
    }

    if (role.isSystem) {
      throw new BadRequestException('No se pueden eliminar los roles del sistema');
    }

    // Check if role is assigned to any user
    const usersWithRole = await this.userRoleRepository.count({
      where: { roleId },
    });

    if (usersWithRole > 0) {
      throw new BadRequestException(
        `No se puede eliminar el rol. Está asignado a ${usersWithRole} usuario(s). Remueva el rol de los usuarios primero.`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete role permissions first
      await queryRunner.manager.delete(RolePermission, { roleId });

      // Delete role
      await queryRunner.manager.delete(Role, { id: roleId });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private mapToResponse(
    role: Role,
    permissions: Permission[],
  ): RoleWithPermissionsResponseDto {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      permissions: permissions.map((p) => ({
        code: p.code,
        name: p.name,
        description: p.description,
        category: p.category,
      })),
    };
  }
}
