import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '@/database/entities/role.entity';
import { RolePermission } from '@/database/entities/role-permission.entity';
import { Permission } from '@/database/entities/permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  /**
   * Mapeo de roles cortos a códigos de BD
   */
  private mapRoleCode(roleCode: string): string {
    const roleMap: Record<string, string> = {
      'superadmin': 'SUPERADMIN',
      'owner': 'CLINIC_OWNER',
      'staff': 'CLINIC_STAFF',
      'veterinarian': 'CLINIC_VETERINARIAN',
      'manager': 'CLINIC_MANAGER',
      'receptionist': 'CLINIC_RECEPTIONIST',
      'stylist': 'CLINIC_STYLIST',
    };
    return roleMap[roleCode] || roleCode;
  }

  /**
   * Get all permissions for a user based on their role code
   * Loads from database instead of static constants
   */
  async getPermissionsByUserRole(roleCode: string): Promise<string[]> {
    try {
      const mappedRoleCode = this.mapRoleCode(roleCode);
      console.log(`[PermissionService] Loading permissions for role: ${roleCode} (mapped to ${mappedRoleCode})`);
      
      // Find the role by code
      const role = await this.roleRepository.findOne({
        where: { code: mappedRoleCode },
      });

      if (!role) {
        console.warn(`[PermissionService] Role ${mappedRoleCode} (original: ${roleCode}) not found in database`);
        const allRoles = await this.roleRepository.find();
        console.warn(`Available roles:`, allRoles.map(r => r.code));
        return [];
      }

      console.log(`[PermissionService] Found role ${mappedRoleCode}, ID: ${role.id}`);

      // Get permissions using query builder to ensure relations are loaded
      const rolePermissions = await this.rolePermissionRepository
        .createQueryBuilder('rp')
        .leftJoinAndSelect('rp.permission', 'permission')
        .where('rp.roleId = :roleId', { roleId: role.id })
        .getMany();

      console.log(`[PermissionService] Found ${rolePermissions.length} permission links for role ${mappedRoleCode}`);

      const permissions = rolePermissions
        .map((rp) => rp.permission?.code)
        .filter((code) => code !== undefined && code !== null);

      console.log(`✓ Loaded ${permissions.length} permissions for role ${mappedRoleCode}`);
      return permissions;
    } catch (error) {
      console.error('[PermissionService] Error loading permissions from database:', error);
      return [];
    }
  }

  /**
   * Get all permissions for a specific role ID
   */
  async getPermissionsByRoleId(roleId: string): Promise<string[]> {
    try {
      const rolePermResults = await this.rolePermissionRepository
        .createQueryBuilder('rp')
        .where('rp.roleId = :roleId', { roleId })
        .select('rp.permissionId', 'permissionId')
        .getRawMany();

      const permissionIds = rolePermResults.map((rp) => rp.permissionId);
      const permissions = await this.permissionRepository
        .createQueryBuilder('p')
        .whereInIds(permissionIds)
        .select('p.code', 'code')
        .getRawMany();

      return permissions.map((p) => p.code);
    } catch (error) {
      console.error('Error loading permissions by role ID:', error);
      return [];
    }
  }

  /**
   * Check if a user (by role) has a specific permission
   */
  async hasPermission(roleCode: string, permissionCode: string): Promise<boolean> {
    const permissions = await this.getPermissionsByUserRole(roleCode);
    return permissions.includes(permissionCode);
  }

  /**
   * Get all available permissions in the system
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      return await this.permissionRepository.find();
    } catch (error) {
      console.error('Error loading all permissions:', error);
      return [];
    }
  }

  /**
   * Get permissions filtered by category
   */
  async getPermissionsByCategory(category: string): Promise<Permission[]> {
    try {
      return await this.permissionRepository.find({
        where: { category },
      });
    } catch (error) {
      console.error('Error loading permissions by category:', error);
      return [];
    }
  }
}
