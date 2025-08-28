import { Router } from 'express';
import multer from 'multer';

import { AdminPrelistController } from '../controllers/admin-prelist.controller.js';
import { createAdminAuthMiddleware } from '../middleware/admin-auth.middleware.js';
import { AdminAuthService } from '../services/admin-auth.service.js';
import { AdminPermissionService } from '../services/admin-permission.service.js';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
});

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
    upload.single('file'),
    prelistController.uploadPrelist.bind(prelistController)
  );

  router.get(
    '/stats',
    authMiddleware(['prelist', 'read']),
    prelistController.getPrelistStats.bind(prelistController)
  );

  return router;
}
