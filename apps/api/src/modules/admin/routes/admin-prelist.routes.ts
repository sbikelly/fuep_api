import { Router } from 'express';

import { AdminPrelistController } from '../controllers/admin-prelist.controller.js';
import { createAdminAuthMiddleware } from '../middleware/admin-auth.middleware.js';
import { AdminAuthService } from '../services/admin-auth.service.js';
import { AdminPermissionService } from '../services/admin-permission.service.js';

export function createAdminPrelistRoutes(
  prelistController: AdminPrelistController,
  authService: AdminAuthService,
  permissionService: AdminPermissionService
): Router {
  const router = Router();

  // Create auth middleware
  const authMiddleware = createAdminAuthMiddleware(authService, permissionService);

  // Prelist management routes
  router.post(
    '/upload',
    authMiddleware(['prelist', 'upload']),
    prelistController.uploadPrelist.bind(prelistController)
  );

  router.get(
    '/stats',
    authMiddleware(['prelist', 'read']),
    prelistController.getPrelistStats.bind(prelistController)
  );

  return router;
}
