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

      const row = await db('jamb_prelist').where({ jamb_reg_no: normalizedJambRegNo }).first();
      if (!row) {
        const response: ApiResponse = {
          success: true,
          data: {
            exists: false,
            message: 'JAMB registration number not found in prelist',
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
          message: 'JAMB registration number found in prelist',
          biodata: {
            jambRegNo: row.jamb_reg_no,
            surname: row.surname,
            firstname: row.firstname,
            othernames: row.othernames,
            gender: row.gender,
            programmeCode: row.programme_code,
            departmentCode: row.department_code,
            faculty: row.faculty,
            stateOfOrigin: row.state_of_origin,
            lgaOfOrigin: row.lga_of_origin,
            email: row.email,
            phone: row.phone,
            utmeScore: row.utme_score,
            session: row.session,
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
        // For now, we'll use a real candidate ID - in production this would come from JWT token
        // TODO: Extract candidate ID from JWT token when authentication middleware is implemented
        const candidateId = '0009c312-3e0d-415b-8d7d-65f4d9124518';

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
      // TODO: Implement refresh token logic
      res.status(501).json({
        success: false,
        error: 'Not implemented yet',
        timestamp: new Date(),
      });
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
      // TODO: Implement logout logic (invalidate refresh token)
      res.json({
        success: true,
        message: 'Logged out successfully',
        timestamp: new Date(),
      });
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
