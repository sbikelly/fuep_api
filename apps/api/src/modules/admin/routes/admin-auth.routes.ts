import { Router } from 'express';

import { adminRateLimit, authRateLimit } from '../../../middleware/rateLimiting.js';
import { AdminAuthController } from '../controllers/admin-auth.controller.js';

export function createAdminAuthRoutes(authController: AdminAuthController): Router {
  const router = Router();

  // Public admin authentication routes (with auth-specific rate limiting)
  router.post('/login', authRateLimit, authController.login.bind(authController));
  router.post('/refresh', authRateLimit, authController.refreshToken.bind(authController));

  // Protected routes (require authentication)
  // Note: changePassword will be handled in user management routes

  return router;
}
