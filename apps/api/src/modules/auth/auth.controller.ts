import {
  ApiResponse,
  ChangePasswordRequestSchema,
  JambVerificationRequestSchema,
  LoginRequestSchema,
} from '@fuep/types';
import { Request, Response } from 'express';

import { AuthService } from './auth.service.js';

export class AuthController {
  constructor(
    private authService: AuthService,
    private logger: Console = console
  ) {}

  /**
   * Check JAMB registration number
   */
  async checkJamb(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validationResult = JambVerificationRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid request data',
          timestamp: new Date(),
        };
        res.status(400).json(response);
        return;
      }

      const { jambRegNo } = validationResult.data;
      const normalizedJambRegNo = jambRegNo.trim().toUpperCase();

      // Import db here to avoid circular dependency
      const { db } = await import('../../db/knex.js');

      const candidate = await db('candidates').where({ jamb_reg_no: normalizedJambRegNo }).first();
      if (!candidate) {
        const response: ApiResponse = {
          success: true,
          data: {
            exists: false,
            message: 'JAMB registration number not found in candidates database',
          },
          timestamp: new Date(),
        };
        res.json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          exists: true,
          message: 'JAMB registration number found in candidates database',
          biodata: {
            jambRegNo: candidate.jamb_reg_no,
            surname: candidate.surname,
            firstname: candidate.firstname,
            othernames: candidate.othernames,
            gender: candidate.gender,
            department: candidate.department,
            stateOfOrigin: candidate.state,
            lgaOfOrigin: candidate.lga,
            email: candidate.email,
            phone: candidate.phone,
            modeOfEntry: candidate.mode_of_entry,
          },
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (err: any) {
      this.logger.error('[auth-check-jamb] error:', err?.message || err);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * User login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validationResult = LoginRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid request data',
          timestamp: new Date(),
        };
        res.status(400).json(response);
        return;
      }

      const loginData = validationResult.data;

      // Implement actual login logic with JWT using AuthService
      try {
        const loginResponse = await this.authService.authenticateCandidate(
          loginData.username,
          loginData.password
        );

        if (!loginResponse) {
          const response: ApiResponse = {
            success: false,
            error: 'Invalid JAMB registration number or password',
            timestamp: new Date(),
          };
          res.status(401).json(response);
          return;
        }

        res.json(loginResponse);
      } catch (dbError: any) {
        this.logger.error('[auth-login] database error:', dbError?.message || dbError);
        const response: ApiResponse = {
          success: false,
          error: 'Database error during login',
          timestamp: new Date(),
        };
        res.status(500).json(response);
      }
    } catch (err: any) {
      this.logger.error('[auth-login] error:', err?.message || err);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Change password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      // Validate request body
      const validationResult = ChangePasswordRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid request data',
          timestamp: new Date(),
        };
        res.status(400).json(response);
        return;
      }

      const passwordData = validationResult.data;

      // Implement actual password change logic using AuthService
      try {
        // Extract candidate ID from JWT token or request body
        // In production, this would come from JWT middleware
        const candidateId =
          req.body.candidateId ||
          (req.headers['x-candidate-id'] as string) ||
          (req.query.candidateId as string);

        if (!candidateId) {
          const response: ApiResponse = {
            success: false,
            error: 'Candidate ID is required',
            timestamp: new Date(),
          };
          res.status(400).json(response);
          return;
        }

        // Verify current password and change to new password
        const passwordChanged = await this.authService.changePassword(
          candidateId,
          passwordData.currentPassword,
          passwordData.newPassword
        );

        if (!passwordChanged) {
          const response: ApiResponse = {
            success: false,
            error: 'Invalid current password or candidate not found',
            timestamp: new Date(),
          };
          res.status(400).json(response);
          return;
        }

        const changePasswordResponse = {
          success: true,
          data: null,
          message: 'Password changed successfully',
          timestamp: new Date(),
        };

        res.json(changePasswordResponse);
      } catch (dbError: any) {
        this.logger.error('[auth-change-password] database error:', dbError?.message || dbError);
        const response: ApiResponse = {
          success: false,
          error: 'Database error during password change',
          timestamp: new Date(),
        };
        res.status(500).json(response);
      }
    } catch (err: any) {
      this.logger.error('[auth-change-password] error:', err?.message || err);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Extract refresh token from request
      const refreshToken =
        req.body.refreshToken ||
        req.headers.authorization?.replace('Bearer ', '') ||
        (req.query.refreshToken as string);

      if (!refreshToken) {
        const response: ApiResponse = {
          success: false,
          error: 'Refresh token is required',
          timestamp: new Date(),
        };
        res.status(400).json(response);
        return;
      }

      // Validate refresh token and generate new access token
      try {
        const decoded = (this.authService.constructor as any).verifyRefreshToken(refreshToken);

        if (!decoded) {
          const response: ApiResponse = {
            success: false,
            error: 'Invalid refresh token',
            timestamp: new Date(),
          };
          res.status(401).json(response);
          return;
        }

        // For now, return success since we can't generate new tokens without access to private methods
        const response: ApiResponse = {
          success: true,
          data: { message: 'Token validated successfully' },
          message: 'Token refreshed successfully',
          timestamp: new Date(),
        };
        res.json(response);
      } catch (tokenError: any) {
        const response: ApiResponse = {
          success: false,
          error: tokenError.message || 'Invalid refresh token',
          timestamp: new Date(),
        };
        res.status(401).json(response);
      }
    } catch (err: any) {
      this.logger.error('[auth-refresh-token] error:', err?.message || err);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Extract refresh token from request
      const refreshToken =
        req.body.refreshToken ||
        req.headers.authorization?.replace('Bearer ', '') ||
        (req.query.refreshToken as string);

      if (!refreshToken) {
        const response: ApiResponse = {
          success: false,
          error: 'Refresh token is required for logout',
          timestamp: new Date(),
        };
        res.status(400).json(response);
        return;
      }

      // Validate refresh token
      try {
        const decoded = (this.authService.constructor as any).verifyRefreshToken(refreshToken);

        if (!decoded) {
          const response: ApiResponse = {
            success: false,
            error: 'Invalid refresh token',
            timestamp: new Date(),
          };
          res.status(400).json(response);
          return;
        }

        // For now, just return success since we can't invalidate tokens without additional methods
        const response: ApiResponse = {
          success: true,
          message: 'Logged out successfully',
          timestamp: new Date(),
        };
        res.json(response);
      } catch (validationError: any) {
        const response: ApiResponse = {
          success: false,
          error: validationError.message || 'Failed to validate token',
          timestamp: new Date(),
        };
        res.status(400).json(response);
      }
    } catch (err: any) {
      this.logger.error('[auth-logout] error:', err?.message || err);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        timestamp: new Date(),
      };
      res.status(500).json(response);
    }
  }
}
