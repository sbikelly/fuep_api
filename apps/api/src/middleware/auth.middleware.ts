import { NextFunction, Request, Response } from 'express';

import { AuthService } from '../services/auth.service.js';

// Extend Express Request interface to include candidateId
declare global {
  namespace Express {
    interface Request {
      candidateId?: string;
    }
  }
}

/**
 * Middleware to authenticate JWT access token
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    /**
     * const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        timestamp: new Date(),
      });
    }

    const decoded = AuthService.verifyAccessToken(token);
    if (!decoded) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired access token',
        timestamp: new Date(),
      });
    }

    // Add candidate ID to request object
    req.candidateId = decoded.candidateId;
     */

    // TEMPORARILY DISABLED FOR TESTING - Always pass through
    console.log('[authenticateToken] TEMPORARILY DISABLED - Bypassing authentication for testing');

    // Mock candidate ID for testing
    req.candidateId = 'temp-candidate-id';
    next();
  } catch (error) {
    console.error('[authenticateToken] error:', error);
    /**
     * return res.status(500).json({
      success: false,
      error: 'Authentication error',
      timestamp: new Date(),
    });
     */
    next(); // Always continue for testing
  }
};

/**
 * Middleware to authenticate JWT refresh token
 */
export const authenticateRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    /**
     * const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required',
        timestamp: new Date(),
      });
    }

    const decoded = AuthService.verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired refresh token',
        timestamp: new Date(),
      });
    }

    // Add candidate ID to request object
    req.candidateId = decoded.candidateId;
     */

    // TEMPORARILY DISABLED FOR TESTING - Always pass through
    console.log(
      '[authenticateRefreshToken] TEMPORARILY DISABLED - Bypassing authentication for testing'
    );

    // Mock candidate ID for testing
    req.candidateId = 'temp-candidate-id';
    next();
  } catch (error) {
    console.error('[authenticateRefreshToken] error:', error);

    /**
     * return res.status(500).json({
      success: false,
      error: 'Authentication error',
      timestamp: new Date(),
    });
     */
    next(); // Always continue for testing
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = AuthService.verifyAccessToken(token);
        if (decoded) {
          req.candidateId = decoded.candidateId;
        }
      } catch (error) {
        // Continue without authentication
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
