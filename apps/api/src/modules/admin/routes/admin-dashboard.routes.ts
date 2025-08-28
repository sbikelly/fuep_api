import { Router } from 'express';

import { healthCheckRateLimit } from '../../../middleware/rateLimiting.js';
import { AdminDashboardController } from '../controllers/admin-dashboard.controller.js';
import { createAdminAuthMiddleware } from '../middleware/admin-auth.middleware.js';
import { AdminAuthService } from '../services/admin-auth.service.js';
import { AdminPermissionService } from '../services/admin-permission.service.js';

export function createAdminDashboardRoutes(
  dashboardController: AdminDashboardController,
  authService: AdminAuthService,
  permissionService: AdminPermissionService
): Router {
  const router = Router();

  // Create auth middleware
  const authMiddleware = createAdminAuthMiddleware(authService, permissionService);

  // Health check (no auth required, with health check rate limiting)
  router.get(
    '/health',
    healthCheckRateLimit,
    dashboardController.getHealthStatus.bind(dashboardController)
  );

  // Dashboard and analytics (require authentication)
  router.get(
    '/dashboard',
    authMiddleware(['dashboard', 'read']),
    dashboardController.getDashboardSummary.bind(dashboardController)
  );
  router.get(
    '/analytics',
    authMiddleware(['analytics', 'read']),
    dashboardController.getAnalytics.bind(dashboardController)
  );

  return router;
}
