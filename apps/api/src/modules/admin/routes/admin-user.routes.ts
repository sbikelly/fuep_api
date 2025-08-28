import { Router } from 'express';

import { AdminUserController } from '../controllers/admin-user.controller.js';
import { createAdminAuthMiddleware } from '../middleware/admin-auth.middleware.js';
import { AdminAuthService } from '../services/admin-auth.service.js';
import { AdminPermissionService } from '../services/admin-permission.service.js';

export function createAdminUserRoutes(
  userController: AdminUserController,
  authService: AdminAuthService,
  permissionService: AdminPermissionService
): Router {
  const router = Router();

  // Create auth middleware
  const authMiddleware = createAdminAuthMiddleware(authService, permissionService);

  // Admin user management routes
  router.get(
    '/',
    authMiddleware(['admin_users', 'read']),
    userController.getAdminUsers.bind(userController)
  );
  router.post(
    '/',
    authMiddleware(['admin_users', 'create']),
    userController.createAdminUser.bind(userController)
  );
  router.get(
    '/:id',
    authMiddleware(['admin_users', 'read']),
    userController.getAdminUser.bind(userController)
  );
  router.put(
    '/:id',
    authMiddleware(['admin_users', 'update']),
    userController.updateAdminUser.bind(userController)
  );
  router.delete(
    '/:id',
    authMiddleware(['admin_users', 'delete']),
    userController.deleteAdminUser.bind(userController)
  );

  // Password management
  router.post(
    '/:id/change-password',
    authMiddleware(['admin_users', 'update']),
    userController.changePassword.bind(userController)
  );

  return router;
}
