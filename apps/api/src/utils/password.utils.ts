import bcrypt from 'bcrypt';
import crypto from 'crypto';

import { logger } from '../middleware/logging.js';

export class PasswordUtils {
  private static readonly SALT_ROUNDS = 12;
  private static readonly TEMP_PASSWORD_LENGTH = 12;

  /**
   * Generate a secure temporary password
   */
  static generateTemporaryPassword(): string {
    try {
      // Generate a random password with mixed characters
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';

      // Ensure at least one character from each category
      password += charset.charAt(Math.floor(Math.random() * 26)); // Uppercase
      password += charset.charAt(26 + Math.floor(Math.random() * 26)); // Lowercase
      password += charset.charAt(52 + Math.floor(Math.random() * 10)); // Number
      password += charset.charAt(62 + Math.floor(Math.random() * 8)); // Special char

      // Fill the rest randomly
      for (let i = 4; i < this.TEMP_PASSWORD_LENGTH; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }

      // Shuffle the password
      password = password
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('');

      logger.info('Temporary password generated successfully', {
        module: 'password',
        operation: 'generateTemporaryPassword',
        metadata: { length: password.length },
      });

      return password;
    } catch (error) {
      logger.error('Failed to generate temporary password', {
        module: 'password',
        operation: 'generateTemporaryPassword',
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback to a simpler password if generation fails
      return `Temp${Math.random().toString(36).substring(2, 8)}!`;
    }
  }

  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

      logger.info('Password hashed successfully', {
        module: 'password',
        operation: 'hashPassword',
        metadata: { saltRounds: this.SALT_ROUNDS },
      });

      return hashedPassword;
    } catch (error) {
      logger.error('Failed to hash password', {
        module: 'password',
        operation: 'hashPassword',
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare a password with its hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(password, hash);

      logger.info('Password comparison completed', {
        module: 'password',
        operation: 'comparePassword',
        metadata: { isMatch },
      });

      return isMatch;
    } catch (error) {
      logger.error('Failed to compare password', {
        module: 'password',
        operation: 'comparePassword',
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one lowercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one number');
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one special character');
    }

    // Common password check (basic)
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.includes(password.toLowerCase())) {
      score -= 2;
      feedback.push('Password is too common, please choose a more unique password');
    }

    const isValid = score >= 4 && password.length >= 8;

    logger.info('Password strength validation completed', {
      module: 'password',
      operation: 'validatePasswordStrength',
      metadata: { score, isValid, feedbackCount: feedback.length },
    });

    return {
      isValid,
      score,
      feedback,
    };
  }

  /**
   * Generate a secure random token
   */
  static generateSecureToken(length: number = 32): string {
    try {
      const token = crypto.randomBytes(length).toString('hex');

      logger.info('Secure token generated successfully', {
        module: 'password',
        operation: 'generateSecureToken',
        metadata: { length, tokenLength: token.length },
      });

      return token;
    } catch (error) {
      logger.error('Failed to generate secure token', {
        module: 'password',
        operation: 'generateSecureToken',
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback to Math.random if crypto.randomBytes fails
      return Math.random()
        .toString(36)
        .substring(2, length + 2);
    }
  }

  /**
   * Check if password needs to be changed (for temporary passwords)
   */
  static isTemporaryPassword(password: string): boolean {
    // Check if password matches temporary password pattern
    const tempPattern = /^Temp[a-zA-Z0-9]{6}!$/;
    return tempPattern.test(password);
  }
}
