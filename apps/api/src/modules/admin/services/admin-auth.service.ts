import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Knex } from 'knex';

import { db } from '../../../db/knex.js';
import { AdminAuditService } from './admin-audit.service.js';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admissions_officer' | 'finance_officer' | 'registrar' | 'viewer';
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
    user: AdminUser;
  };
  message?: string;
  timestamp: Date;
}

export interface AdminAuthToken {
  sub: string;
  username: string;
  role: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export class AdminAuthService {
  constructor(private auditService: AdminAuditService) {}

  async login(
    loginData: AdminLoginRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AdminLoginResponse> {
    try {
      const { username, password } = loginData;

      // Find admin user
      const adminUser = await db('admin_users')
        .where({ username: username.trim(), is_active: true })
        .first();

      if (!adminUser) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT tokens
      const accessToken = await this.generateAccessToken(adminUser);
      const refreshToken = await this.generateRefreshToken(adminUser);

      // Update last login
      await db('admin_users').where({ id: adminUser.id }).update({ last_login_at: new Date() });

      // Audit login action
      await this.auditService.logAction({
        adminUserId: adminUser.id,
        action: 'login',
        resource: 'auth',
        resourceId: adminUser.id,
        details: { ipAddress, userAgent },
        ipAddress,
        userAgent,
      });

      const user: AdminUser = {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        isActive: adminUser.is_active,
        lastLoginAt: adminUser.last_login_at ? new Date(adminUser.last_login_at) : undefined,
        createdAt: new Date(adminUser.created_at),
        updatedAt: new Date(adminUser.updated_at),
      };

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          expiresIn: 3600, // 1 hour
          tokenType: 'Bearer',
          user,
        },
        message: 'Login successful',
        timestamp: new Date(),
      };
    } catch (error: any) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'admin-refresh-secret'
      ) as AdminAuthToken;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Get admin user
      const adminUser = await db('admin_users').where({ id: decoded.sub, is_active: true }).first();

      if (!adminUser) {
        throw new Error('User not found');
      }

      // Generate new access token
      const accessToken = await this.generateAccessToken(adminUser);

      return {
        accessToken,
        expiresIn: 3600, // 1 hour
      };
    } catch (error: any) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  async changePassword(
    adminUserId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get admin user
      const adminUser = await db('admin_users').where({ id: adminUserId, is_active: true }).first();

      if (!adminUser) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, adminUser.password_hash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await db('admin_users').where({ id: adminUserId }).update({ password_hash: newPasswordHash });

      // Audit password change
      await this.auditService.logAction({
        adminUserId,
        action: 'change_password',
        resource: 'auth',
        resourceId: adminUserId,
        details: { passwordChanged: true },
      });

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error: any) {
      throw new Error(`Password change failed: ${error.message}`);
    }
  }

  async validateToken(token: string): Promise<AdminAuthToken> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'admin-secret') as AdminAuthToken;

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      // Check if user still exists and is active
      const adminUser = await db('admin_users').where({ id: decoded.sub, is_active: true }).first();

      if (!adminUser) {
        throw new Error('User not found or inactive');
      }

      return decoded;
    } catch (error: any) {
      throw new Error(`Token validation failed: ${error.message}`);
    }
  }

  private async generateAccessToken(adminUser: any): Promise<string> {
    const payload: Omit<AdminAuthToken, 'iat' | 'exp'> = {
      sub: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      type: 'access',
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'admin-secret', {
      expiresIn: '1h',
    });
  }

  private async generateRefreshToken(adminUser: any): Promise<string> {
    const payload: Omit<AdminAuthToken, 'iat' | 'exp'> = {
      sub: adminUser.id,
      username: adminUser.username,
      role: adminUser.role,
      type: 'refresh',
    };

    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'admin-refresh-secret', {
      expiresIn: '7d',
    });
  }

  async createAdminUser(
    adminData: {
      username: string;
      email: string;
      password: string;
      role: AdminUser['role'];
    },
    createdBy: string
  ): Promise<AdminUser> {
    try {
      // Check if username or email already exists
      const existingUser = await db('admin_users')
        .where({ username: adminData.username })
        .orWhere({ email: adminData.email })
        .first();

      if (existingUser) {
        throw new Error('Username or email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(adminData.password, 12);

      // Create admin user
      const [newAdminUser] = await db('admin_users')
        .insert({
          username: adminData.username,
          email: adminData.email,
          password_hash: passwordHash,
          role: adminData.role,
          is_active: true,
        })
        .returning('*');

      // Audit user creation
      await this.auditService.logAction({
        adminUserId: createdBy,
        action: 'create',
        resource: 'admin_users',
        resourceId: newAdminUser.id,
        details: {
          createdUser: {
            username: adminData.username,
            email: adminData.email,
            role: adminData.role,
          },
        },
      });

      return {
        id: newAdminUser.id,
        username: newAdminUser.username,
        email: newAdminUser.email,
        role: newAdminUser.role,
        isActive: newAdminUser.is_active,
        createdAt: new Date(newAdminUser.created_at),
        updatedAt: new Date(newAdminUser.updated_at),
      };
    } catch (error: any) {
      throw new Error(`Admin user creation failed: ${error.message}`);
    }
  }

  async getAdminUserById(id: string): Promise<AdminUser | null> {
    try {
      const adminUser = await db('admin_users').where({ id, is_active: true }).first();

      if (!adminUser) {
        return null;
      }

      return {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        isActive: adminUser.is_active,
        lastLoginAt: adminUser.last_login_at ? new Date(adminUser.last_login_at) : undefined,
        createdAt: new Date(adminUser.created_at),
        updatedAt: new Date(adminUser.updated_at),
      };
    } catch (error: any) {
      throw new Error(`Failed to get admin user: ${error.message}`);
    }
  }

  async updateAdminUser(
    id: string,
    updateData: Partial<Pick<AdminUser, 'email' | 'role' | 'isActive'>>,
    updatedBy: string
  ): Promise<AdminUser> {
    try {
      // Check if user exists
      const existingUser = await db('admin_users').where({ id }).first();
      if (!existingUser) {
        throw new Error('Admin user not found');
      }

      // Update user
      const [updatedUser] = await db('admin_users')
        .where({ id })
        .update({
          ...(updateData.email && { email: updateData.email }),
          ...(updateData.role && { role: updateData.role }),
          ...(updateData.isActive !== undefined && { is_active: updateData.isActive }),
        })
        .returning('*');

      // Audit user update
      await this.auditService.logAction({
        adminUserId: updatedBy,
        action: 'update',
        resource: 'admin_users',
        resourceId: id,
        details: {
          updatedFields: updateData,
          previousData: {
            email: existingUser.email,
            role: existingUser.role,
            isActive: existingUser.is_active,
          },
        },
      });

      return {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.is_active,
        lastLoginAt: updatedUser.last_login_at ? new Date(updatedUser.last_login_at) : undefined,
        createdAt: new Date(updatedUser.created_at),
        updatedAt: new Date(updatedUser.updated_at),
      };
    } catch (error: any) {
      throw new Error(`Failed to update admin user: ${error.message}`);
    }
  }

  async listAdminUsers(): Promise<AdminUser[]> {
    try {
      const adminUsers = await db('admin_users').orderBy('created_at', 'desc');

      return adminUsers.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.is_active,
        lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : undefined,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      }));
    } catch (error: any) {
      throw new Error(`Failed to list admin users: ${error.message}`);
    }
  }

  async deleteAdminUser(id: string, deletedBy: string): Promise<void> {
    try {
      // Check if user exists
      const existingUser = await db('admin_users').where({ id }).first();
      if (!existingUser) {
        throw new Error('Admin user not found');
      }

      // Prevent self-deletion
      if (id === deletedBy) {
        throw new Error('Cannot delete your own account');
      }

      // Prevent deletion of super_admin users
      if (existingUser.role === 'super_admin') {
        throw new Error('Cannot delete super admin users');
      }

      // Soft delete by setting is_active to false
      await db('admin_users').where({ id }).update({
        is_active: false,
        updated_at: new Date(),
      });

      // Audit user deletion
      await this.auditService.logAction({
        adminUserId: deletedBy,
        action: 'delete',
        resource: 'admin_users',
        resourceId: id,
        details: {
          deletedUser: {
            username: existingUser.username,
            email: existingUser.email,
            role: existingUser.role,
          },
          deletionMethod: 'soft_delete',
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to delete admin user: ${error.message}`);
    }
  }
}
