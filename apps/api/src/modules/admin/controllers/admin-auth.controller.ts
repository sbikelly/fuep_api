import { Request, Response } from 'express';

import { createAdminAuthMiddleware } from '../middleware/admin-auth.middleware.js';
import { AdminAuthService } from '../services/admin-auth.service.js';
import { AdminPermissionService } from '../services/admin-permission.service.js';

export class AdminAuthController {
  constructor(
    private adminAuthService: AdminAuthService,
    private adminPermissionService: AdminPermissionService
  ) {}

  /**
   * Admin login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({
          success: false,
          error: 'Username and password are required',
        });
        return;
      }

      const result = await this.adminAuthService.login({ username, password });

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: {
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
            expiresIn: result.data.expiresIn,
            tokenType: result.data.tokenType,
            user: result.data.user,
          },
        });
      } else {
        res.status(401).json({
          success: false,
          error: result.message,
        });
      }
    } catch (error) {
      console.error('[AdminAuthController] Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during login',
      });
    }
  }

  /**
   * Refresh admin token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
        return;
      }

      const result = await this.adminAuthService.refreshToken(refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      console.error('[AdminAuthController] Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during token refresh',
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

      if (result.success) {
        res.json({
          success: true,
          message: 'Password changed successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message,
        });
      }
    } catch (error) {
      console.error('[AdminAuthController] Password change error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during password change',
      });
    }
  }
}
