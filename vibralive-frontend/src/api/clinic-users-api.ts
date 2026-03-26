import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import {
  ClinicUser,
  CreateClinicUserPayload,
  UpdateClinicUserPayload,
  ListClinicUsersQuery,
  RoleWithPermissions,
  Permission,
  Stylist,
} from '@/types';
import toast from 'react-hot-toast';

/**
 * Get the current user's clinic ID from auth store
 */
function getClinicId(): string {
  const user = useAuthStore.getState().user;
  if (!user?.clinic_id) {
    throw new Error('No clinic_id found in user context');
  }
  return user.clinic_id;
}

class ClinicUsersApi {
  // ============================================
  // USERS ENDPOINTS
  // ============================================

  /**
   * POST /api/clinics/:clinicId/users
   * Create a new clinic user
   */
  async createUser(payload: CreateClinicUserPayload): Promise<ClinicUser> {
    try {
      const clinicId = getClinicId();
      const response = await api.post(`/clinics/${clinicId}/users`, payload);
      const user = (response.data || response) as ClinicUser;
      toast.success('Usuario creado. Se ha enviado una invitación por correo.');
      return user;
    } catch (error: any) {
      console.error('[ClinicUsersApi] Error creating user:', error);
      throw error;
    }
  }

  /**
   * GET /api/clinics/:clinicId/users
   * List all users for the clinic
   */
  async listUsers(query?: ListClinicUsersQuery): Promise<ClinicUser[]> {
    try {
      const clinicId = getClinicId();
      const response = await api.get(`/clinics/${clinicId}/users`, {
        params: query,
      });
      const users = (response.data || response) as ClinicUser[];
      return Array.isArray(users) ? users : [];
    } catch (error: any) {
      console.error('[ClinicUsersApi] Error listing users:', error);
      throw error;
    }
  }

  /**
   * GET /api/clinics/:clinicId/users/:userId
   * Get a single user by ID
   */
  async getUser(userId: string): Promise<ClinicUser> {
    try {
      const clinicId = getClinicId();
      const response = await api.get(`/clinics/${clinicId}/users/${userId}`);
      const user = (response.data || response) as ClinicUser;
      return user;
    } catch (error: any) {
      console.error('[ClinicUsersApi] Error fetching user:', error);
      throw error;
    }
  }

  /**
   * PUT /api/clinics/:clinicId/users/:userId
   * Update a user
   */
  async updateUser(userId: string, payload: UpdateClinicUserPayload): Promise<ClinicUser> {
    try {
      const clinicId = getClinicId();
      const response = await api.put(`/clinics/${clinicId}/users/${userId}`, payload);
      const user = (response.data || response) as ClinicUser;
      toast.success('Usuario actualizado');
      return user;
    } catch (error: any) {
      console.error('[ClinicUsersApi] Error updating user:', error);
      throw error;
    }
  }

  /**
   * PUT /api/clinics/:clinicId/users/:userId/deactivate
   * Deactivate a user
   */
  async deactivateUser(userId: string): Promise<ClinicUser> {
    try {
      const clinicId = getClinicId();
      const response = await api.put(`/clinics/${clinicId}/users/${userId}/deactivate`);
      const user = (response.data || response) as ClinicUser;
      toast.success('Usuario desactivado');
      return user;
    } catch (error: any) {
      console.error('[ClinicUsersApi] Error deactivating user:', error);
      throw error;
    }
  }

  // ============================================
  // ROLES ENDPOINTS
  // ============================================

  /**
   * GET /api/clinics/:clinicId/roles
   * List available roles for the clinic
   */
  async listRoles(): Promise<RoleWithPermissions[]> {
    try {
      const clinicId = getClinicId();
      const response = await api.get(`/clinics/${clinicId}/roles`);
      const roles = (response.data || response) as RoleWithPermissions[];
      return Array.isArray(roles) ? roles : [];
    } catch (error: any) {
      console.error('[ClinicUsersApi] Error listing roles:', error);
      throw error;
    }
  }

  /**
   * GET /api/clinics/:clinicId/roles/permissions
   * List all available permissions
   */
  async listPermissions(): Promise<Permission[]> {
    try {
      const clinicId = getClinicId();
      const response = await api.get(`/clinics/${clinicId}/roles/permissions`);
      const permissions = (response.data || response) as Permission[];
      return Array.isArray(permissions) ? permissions : [];
    } catch (error: any) {
      console.error('[ClinicUsersApi] Error listing permissions:', error);
      throw error;
    }
  }

  /**
   * POST /api/clinics/:clinicId/roles
   * Create a custom role
   */
  async createRole(payload: {
    code: string;
    name: string;
    description?: string;
    permissionCodes: string[];
  }): Promise<RoleWithPermissions> {
    try {
      const clinicId = getClinicId();
      const response = await api.post(`/clinics/${clinicId}/roles`, payload);
      const role = (response.data || response) as RoleWithPermissions;
      toast.success('Rol creado exitosamente');
      return role;
    } catch (error: any) {
      console.error('[ClinicUsersApi] Error creating role:', error);
      const message = error.response?.data?.message || 'Error al crear rol';
      toast.error(message);
      throw error;
    }
  }

  /**
   * PUT /api/clinics/:clinicId/roles/:roleId
   * Update a custom role
   */
  async updateRole(
    roleId: string,
    payload: {
      name?: string;
      description?: string;
      permissionCodes?: string[];
    }
  ): Promise<RoleWithPermissions> {
    try {
      const clinicId = getClinicId();
      const response = await api.put(`/clinics/${clinicId}/roles/${roleId}`, payload);
      const role = (response.data || response) as RoleWithPermissions;
      toast.success('Rol actualizado exitosamente');
      return role;
    } catch (error: any) {
      console.error('[ClinicUsersApi] Error updating role:', error);
      const message = error.response?.data?.message || 'Error al actualizar rol';
      toast.error(message);
      throw error;
    }
  }

  /**
   * DELETE /api/clinics/:clinicId/roles/:roleId
   * Delete a custom role
   */
  async deleteRole(roleId: string): Promise<void> {
    try {
      const clinicId = getClinicId();
      await api.delete(`/clinics/${clinicId}/roles/${roleId}`);
      toast.success('Rol eliminado exitosamente');
    } catch (error: any) {
      console.error('[ClinicUsersApi] Error deleting role:', error);
      const message = error.response?.data?.message || 'Error al eliminar rol';
      toast.error(message);
      throw error;
    }
  }

  // ============================================
  // STYLISTS ENDPOINTS
  // ============================================

  /**
   * GET /api/clinics/:clinicId/stylists
   * List all stylists for the clinic
   */
  async listStylists(bookableOnly?: boolean): Promise<Stylist[]> {
    try {
      const clinicId = getClinicId();
      const params = bookableOnly ? { bookableOnly: 'true' } : {};
      const response = await api.get(`/clinics/${clinicId}/stylists`, { params });
      const stylists = (response.data || response) as Stylist[];
      return Array.isArray(stylists) ? stylists : [];
    } catch (error: any) {
      console.error('[ClinicUsersApi] Error listing stylists:', error);
      throw error;
    }
  }

  /**
   * GET /api/clinics/:clinicId/stylists/:stylistId
   * Get a single stylist by ID
   */
  async getStylist(stylistId: string): Promise<Stylist> {
    try {
      const clinicId = getClinicId();
      const response = await api.get(`/clinics/${clinicId}/stylists/${stylistId}`);
      const stylist = (response.data || response) as Stylist;
      return stylist;
    } catch (error: any) {
      console.error('[ClinicUsersApi] Error fetching stylist:', error);
      throw error;
    }
  }

  /**
   * PUT /api/clinics/:clinicId/stylists/:stylistId
   * Update a stylist profile
   */
  async updateStylist(
    stylistId: string,
    payload: { displayName?: string; calendarColor?: string; isBookable?: boolean }
  ): Promise<Stylist> {
    try {
      const clinicId = getClinicId();
      const response = await api.put(`/clinics/${clinicId}/stylists/${stylistId}`, payload);
      const stylist = (response.data || response) as Stylist;
      toast.success('Perfil de estilista actualizado');
      return stylist;
    } catch (error: any) {
      console.error('[ClinicUsersApi] Error updating stylist:', error);
      throw error;
    }
  }
}

export const clinicUsersApi = new ClinicUsersApi();
