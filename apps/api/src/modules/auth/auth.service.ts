import { LoginResponse } from '@fuep/types';
import jwt from 'jsonwebtoken';

import { db } from '../../db/knex.js';
import { PasswordUtils } from '../../utils/password.utils.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';
const JWT_EXPIRES_IN = '1h';
const JWT_REFRESH_EXPIRES_IN = '7d';

export class AuthService {
  /**
   * Authenticate a candidate by JAMB registration number and password
   */
  async authenticateCandidate(username: string, password: string): Promise<LoginResponse | null> {
    try {
      // Look up candidate by JAMB registration number
      const candidate = await db('candidates').where({ jamb_reg_no: username }).first();

      if (!candidate) {
        return null;
      }

      // Check if candidate has a password set
      if (!candidate.password_hash) {
        // First time login - set temporary password flag
        return {
          success: true,
          data: {
            accessToken: this.generateAccessToken(candidate.id),
            refreshToken: this.generateRefreshToken(candidate.id),
            expiresIn: 3600,
            tokenType: 'Bearer',
          },
          user: {
            id: candidate.id,
            jambRegNo: candidate.jamb_reg_no,
            email: candidate.email || 'candidate@fuep.edu.ng',
            phone: candidate.phone || '08000000000',
            isActive: true,
            tempPasswordFlag: true,
          },
          timestamp: new Date(),
        };
      }

      // Verify password using existing PasswordUtils
      const isPasswordValid = await PasswordUtils.comparePassword(
        password,
        candidate.password_hash
      );
      if (!isPasswordValid) {
        return null;
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(candidate.id);
      const refreshToken = this.generateRefreshToken(candidate.id);

      // Store refresh token hash in database
      const refreshTokenHash = await PasswordUtils.hashPassword(refreshToken);
      await db('candidates').where({ id: candidate.id }).update({
        refresh_token_hash: refreshTokenHash,
        last_login: new Date(),
        updated_at: new Date(),
      });

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          expiresIn: 3600,
          tokenType: 'Bearer',
        },
        user: {
          id: candidate.id,
          jambRegNo: candidate.jamb_reg_no,
          email: candidate.email || 'candidate@fuep.edu.ng',
          phone: candidate.phone || '08000000000',
          isActive: true,
          tempPasswordFlag: candidate.temp_password_flag || false,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[AuthService.authenticateCandidate] error:', error);
      throw error;
    }
  }

  /**
   * Change candidate password
   */
  async changePassword(
    candidateId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      // Get candidate
      const candidate = await db('candidates').where({ id: candidateId }).first();
      if (!candidate) {
        return false;
      }

      // Verify current password
      if (candidate.password_hash) {
        const isCurrentPasswordValid = await PasswordUtils.comparePassword(
          currentPassword,
          candidate.password_hash
        );
        if (!isCurrentPasswordValid) {
          return false;
        }
      }

      // Hash new password
      const newPasswordHash = await PasswordUtils.hashPassword(newPassword);

      // Update password and clear temporary password flag
      await db('candidates').where({ id: candidateId }).update({
        password_hash: newPasswordHash,
        temp_password_flag: false,
        updated_at: new Date(),
      });

      return true;
    } catch (error) {
      console.error('[AuthService.changePassword] error:', error);
      throw error;
    }
  }

  /**
   * Generate JWT access token
   */
  private generateAccessToken(candidateId: string): string {
    return jwt.sign(
      {
        candidateId,
        type: 'access',
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  /**
   * Generate JWT refresh token
   */
  private generateRefreshToken(candidateId: string): string {
    return jwt.sign(
      {
        candidateId,
        type: 'refresh',
      },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
  }

  /**
   * Verify JWT access token
   */
  static verifyAccessToken(token: string): { candidateId: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.type === 'access') {
        return { candidateId: decoded.candidateId };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify JWT refresh token
   */
  static verifyRefreshToken(token: string): { candidateId: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any;
      if (decoded.type === 'refresh') {
        return { candidateId: decoded.candidateId };
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}
