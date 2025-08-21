import { db } from '../../db/knex.js';

export interface Permission {
  id: string;
  role: string;
  resource: string;
  action: string;
  createdAt: Date;
}

export interface PermissionCheck {
  role: string;
  resource: string;
  action: string;
}

export class AdminPermissionService {
  async checkPermission(permissionCheck: PermissionCheck): Promise<boolean> {
    try {
      const { role, resource, action } = permissionCheck;

      // Super admin has access to everything
      if (role === 'super_admin') {
        return true;
      }

      // Check specific permission
      const permission = await db('admin_permissions').where({ role, resource, action }).first();

      if (permission) {
        return true;
      }

      // Check wildcard permissions
      const wildcardPermission = await db('admin_permissions')
        .where({ role, resource: '*', action: '*' })
        .first();

      if (wildcardPermission) {
        return true;
      }

      // Check resource wildcard
      const resourceWildcard = await db('admin_permissions')
        .where({ role, resource: '*', action })
        .first();

      if (resourceWildcard) {
        return true;
      }

      // Check action wildcard
      const actionWildcard = await db('admin_permissions')
        .where({ role, resource, action: '*' })
        .first();

      if (actionWildcard) {
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  async getUserPermissions(role: string): Promise<Permission[]> {
    try {
      const permissions = await db('admin_permissions')
        .where({ role })
        .orderBy(['resource', 'action']);

      return permissions.map((permission) => ({
        id: permission.id,
        role: permission.role,
        resource: permission.resource,
        action: permission.action,
        createdAt: new Date(permission.created_at),
      }));
    } catch (error: any) {
      throw new Error(`Failed to get user permissions: ${error.message}`);
    }
  }

  async getAllPermissions(): Promise<Permission[]> {
    try {
      const permissions = await db('admin_permissions').orderBy(['role', 'resource', 'action']);

      return permissions.map((permission) => ({
        id: permission.id,
        role: permission.role,
        resource: permission.resource,
        action: permission.action,
        createdAt: new Date(permission.created_at),
      }));
    } catch (error: any) {
      throw new Error(`Failed to get all permissions: ${error.message}`);
    }
  }

  async createPermission(
    permissionData: {
      role: string;
      resource: string;
      action: string;
    },
    createdBy: string
  ): Promise<Permission> {
    try {
      // Check if permission already exists
      const existingPermission = await db('admin_permissions')
        .where({
          role: permissionData.role,
          resource: permissionData.resource,
          action: permissionData.action,
        })
        .first();

      if (existingPermission) {
        throw new Error('Permission already exists');
      }

      // Create permission
      const [newPermission] = await db('admin_permissions')
        .insert({
          role: permissionData.role,
          resource: permissionData.resource,
          action: permissionData.action,
        })
        .returning('*');

      return {
        id: newPermission.id,
        role: newPermission.role,
        resource: newPermission.resource,
        action: newPermission.action,
        createdAt: new Date(newPermission.created_at),
      };
    } catch (error: any) {
      throw new Error(`Failed to create permission: ${error.message}`);
    }
  }

  async updatePermission(
    id: string,
    updateData: Partial<Pick<Permission, 'role' | 'resource' | 'action'>>
  ): Promise<Permission> {
    try {
      // Check if permission exists
      const existingPermission = await db('admin_permissions').where({ id }).first();

      if (!existingPermission) {
        throw new Error('Permission not found');
      }

      // Check for conflicts with new values
      if (updateData.role || updateData.resource || updateData.action) {
        const conflictCheck = await db('admin_permissions')
          .where({
            role: updateData.role || existingPermission.role,
            resource: updateData.resource || existingPermission.resource,
            action: updateData.action || existingPermission.action,
          })
          .whereNot({ id })
          .first();

        if (conflictCheck) {
          throw new Error('Permission with these values already exists');
        }
      }

      // Update permission
      const [updatedPermission] = await db('admin_permissions')
        .where({ id })
        .update({
          ...(updateData.role && { role: updateData.role }),
          ...(updateData.resource && { resource: updateData.resource }),
          ...(updateData.action && { action: updateData.action }),
        })
        .returning('*');

      return {
        id: updatedPermission.id,
        role: updatedPermission.role,
        resource: updatedPermission.resource,
        action: updatedPermission.action,
        createdAt: new Date(updatedPermission.created_at),
      };
    } catch (error: any) {
      throw new Error(`Failed to update permission: ${error.message}`);
    }
  }

  async deletePermission(id: string): Promise<void> {
    try {
      const deletedCount = await db('admin_permissions').where({ id }).del();

      if (deletedCount === 0) {
        throw new Error('Permission not found');
      }
    } catch (error: any) {
      throw new Error(`Failed to delete permission: ${error.message}`);
    }
  }

  async getRolePermissions(role: string): Promise<Permission[]> {
    try {
      const permissions = await db('admin_permissions')
        .where({ role })
        .orderBy(['resource', 'action']);

      return permissions.map((permission) => ({
        id: permission.id,
        role: permission.role,
        resource: permission.resource,
        action: permission.action,
        createdAt: new Date(permission.created_at),
      }));
    } catch (error: any) {
      throw new Error(`Failed to get role permissions: ${error.message}`);
    }
  }

  async getResourcePermissions(resource: string): Promise<Permission[]> {
    try {
      const permissions = await db('admin_permissions')
        .where({ resource })
        .orderBy(['role', 'action']);

      return permissions.map((permission) => ({
        id: permission.id,
        role: permission.role,
        resource: permission.resource,
        action: permission.action,
        createdAt: new Date(permission.created_at),
      }));
    } catch (error: any) {
      throw new Error(`Failed to get resource permissions: ${error.message}`);
    }
  }

  async bulkCreatePermissions(
    permissions: Array<{
      role: string;
      resource: string;
      action: string;
    }>
  ): Promise<Permission[]> {
    try {
      // Validate permissions
      for (const permission of permissions) {
        if (!permission.role || !permission.resource || !permission.action) {
          throw new Error('Invalid permission data');
        }
      }

      // Check for existing permissions to avoid conflicts
      const existingPermissions = await db('admin_permissions').whereIn(
        ['role', 'resource', 'action'],
        permissions.map((p) => [p.role, p.resource, p.action])
      );

      if (existingPermissions.length > 0) {
        throw new Error('Some permissions already exist');
      }

      // Create permissions
      const newPermissions = await db('admin_permissions').insert(permissions).returning('*');

      return newPermissions.map((permission) => ({
        id: permission.id,
        role: permission.role,
        resource: permission.resource,
        action: permission.action,
        createdAt: new Date(permission.created_at),
      }));
    } catch (error: any) {
      throw new Error(`Failed to bulk create permissions: ${error.message}`);
    }
  }

  async getPermissionMatrix(): Promise<{
    roles: string[];
    resources: string[];
    permissions: { [role: string]: { [resource: string]: string[] } };
  }> {
    try {
      const allPermissions = await this.getAllPermissions();

      const roles = [...new Set(allPermissions.map((p) => p.role))];
      const resources = [...new Set(allPermissions.map((p) => p.resource))];

      const permissions: { [role: string]: { [resource: string]: string[] } } = {};

      for (const role of roles) {
        permissions[role] = {};
        for (const resource of resources) {
          permissions[role][resource] = allPermissions
            .filter((p) => p.role === role && p.resource === resource)
            .map((p) => p.action);
        }
      }

      return { roles, resources, permissions };
    } catch (error: any) {
      throw new Error(`Failed to get permission matrix: ${error.message}`);
    }
  }
}
