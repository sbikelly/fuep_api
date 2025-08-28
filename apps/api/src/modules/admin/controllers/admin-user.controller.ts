import { Request, Response } from 'express';

import { AdminAuthService } from '../services/admin-auth.service.js';

export class AdminUserController {
  constructor(private adminAuthService: AdminAuthService) {}

  /**
   * Get all admin users
   */
  async getAdminUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search, role, isActive } = req.query;

      const filters = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        role: role as string,
        isActive: isActive === 'true',
      };

      const users = await this.adminAuthService.listAdminUsers();

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error('[AdminUserController] Get admin users error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get admin users',
      });
    }
  }

  /**
   * Create new admin user
   */
  async createAdminUser(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, role } = req.body;

      if (!username || !email || !password || !role) {
        res.status(400).json({
          success: false,
          error: 'Username, email, password, and role are required',
        });
        return;
      }

      // TODO: Get createdBy from auth middleware
      const createdBy = 'temp-admin-id';
      const result = await this.adminAuthService.createAdminUser(
        {
          username,
          email,
          password,
          role,
        },
        createdBy
      );

      res.status(201).json({
        success: true,
        message: 'Admin user created successfully',
        data: result,
      });
    } catch (error) {
      console.error('[AdminUserController] Create admin user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create admin user',
      });
    }
  }

  /**
   * Get admin user by ID
   */
  async getAdminUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await this.adminAuthService.getAdminUserById(id);

      if (user) {
        res.json({
          success: true,
          data: user,
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Admin user not found',
        });
      }
    } catch (error) {
      console.error('[AdminUserController] Get admin user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get admin user',
      });
    }
  }

  /**
   * Update admin user
   */
  async updateAdminUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      // TODO: Get updatedBy from auth middleware
      const updatedBy = 'temp-admin-id';
      const result = await this.adminAuthService.updateAdminUser(id, updates, updatedBy);

      res.json({
        success: true,
        message: 'Admin user updated successfully',
        data: result,
      });
    } catch (error) {
      console.error('[AdminUserController] Update admin user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update admin user',
      });
    }
  }

  /**
   * Delete admin user
   */
  async deleteAdminUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // TODO: Get deletedBy from auth middleware
      const deletedBy = 'temp-admin-id';
      await this.adminAuthService.deleteAdminUser(id, deletedBy);

      res.json({
        success: true,
        message: 'Admin user deleted successfully',
      });
    } catch (error) {
      console.error('[AdminUserController] Delete admin user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete admin user',
      });
    }
  }

  /**
   * Change admin password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Current password and new password are required',
        });
        return;
      }

      const result = await this.adminAuthService.changePassword(id, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('[AdminUserController] Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password',
      });
    }
  }
}
