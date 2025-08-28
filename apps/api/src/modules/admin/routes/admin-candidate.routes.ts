import { Router } from 'express';

import { AdminCandidateController } from '../controllers/admin-candidate.controller.js';
import { createAdminAuthMiddleware } from '../middleware/admin-auth.middleware.js';
import { AdminAuthService } from '../services/admin-auth.service.js';
import { AdminPermissionService } from '../services/admin-permission.service.js';

export function createAdminCandidateRoutes(
  candidateController: AdminCandidateController,
  authService: AdminAuthService,
  permissionService: AdminPermissionService
): Router {
  const router = Router();

  // Create auth middleware
  const authMiddleware = createAdminAuthMiddleware(authService, permissionService);

  // Candidate management routes
  router.get(
    '/',
    authMiddleware(['candidates', 'read']),
    candidateController.getCandidates.bind(candidateController)
  );
  router.get(
    '/:id',
    authMiddleware(['candidates', 'read']),
    candidateController.getCandidate.bind(candidateController)
  );
  router.put(
    '/:id',
    authMiddleware(['candidates', 'update']),
    candidateController.updateCandidate.bind(candidateController)
  );
  router.delete(
    '/:id',
    authMiddleware(['candidates', 'delete']),
    candidateController.deleteCandidate.bind(candidateController)
  );

  // Candidate notes
  router.post(
    '/:id/notes',
    authMiddleware(['candidates', 'update']),
    candidateController.addCandidateNote.bind(candidateController)
  );
  router.get(
    '/:id/notes',
    authMiddleware(['candidates', 'read']),
    candidateController.getCandidateNotes.bind(candidateController)
  );

  return router;
}
