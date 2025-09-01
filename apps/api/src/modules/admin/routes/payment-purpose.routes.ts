import { Router } from 'express';

import { adminRateLimit } from '../../../middleware/rateLimiting.js';
import { PaymentPurposeController } from '../controllers/payment-purpose.controller.js';
import { createAdminAuthMiddleware } from '../middleware/admin-auth.middleware.js';
import { AdminAuditService } from '../services/admin-audit.service.js';
import { AdminAuthService } from '../services/admin-auth.service.js';
import { AdminPermissionService } from '../services/admin-permission.service.js';

export function createPaymentPurposeRoutes(controller: PaymentPurposeController): Router {
  const router = Router();

  // Apply rate limiting to all payment purpose routes
  router.use(adminRateLimit);

  // TEMPORARILY DISABLED: Create admin auth middleware for protected routes
  // const adminAuditService = new AdminAuditService();
  // const adminAuthService = new AdminAuthService(adminAuditService);
  // const adminPermissionService = new AdminPermissionService();
  // const authMiddleware = createAdminAuthMiddleware(adminAuthService, adminPermissionService);

  // Public routes (no authentication required)
  router.get('/purposes', controller.getPaymentPurposes.bind(controller));
  router.get('/purposes/session/:session', controller.getPaymentPurposesBySession.bind(controller));
  router.get('/purposes/level/:level', controller.getPaymentPurposesByLevel.bind(controller));
  router.get('/purposes/purpose/:purpose', controller.getPaymentPurposesByPurpose.bind(controller));
  router.get(
    '/purposes/category/:category',
    controller.getPaymentPurposesByCategory.bind(controller)
  );
  router.get('/purposes/statistics', controller.getPaymentPurposeStatistics.bind(controller));
  router.get(
    '/purposes/key/:session/:purpose/:level',
    controller.getPaymentPurposeByKey.bind(controller)
  );
  router.get('/purposes/:id', controller.getPaymentPurposeById.bind(controller));

  // TEMPORARILY DISABLED: Protected routes (require authentication)
  router.post(
    '/purposes',
    /* authMiddleware(['admin_payment_purposes', 'create']), */ controller.createPaymentPurpose.bind(
      controller
    )
  );
  router.put(
    '/purposes/:id',
    /* authMiddleware(['admin_payment_purposes', 'update']), */ controller.updatePaymentPurpose.bind(
      controller
    )
  );
  router.delete(
    '/purposes/:id',
    /* authMiddleware(['admin_payment_purposes', 'delete']), */ controller.deletePaymentPurpose.bind(
      controller
    )
  );
  router.patch(
    '/purposes/:id/toggle',
    /* authMiddleware(['admin_payment_purposes', 'update']), */ controller.togglePaymentPurposeStatus.bind(
      controller
    )
  );

  return router;
}
