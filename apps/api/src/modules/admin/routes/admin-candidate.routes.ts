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

  // TEMPORARILY DISABLED: Create auth middleware for protected routes
  // const authMiddleware = createAdminAuthMiddleware(authService, permissionService);

  // Candidate management routes (no authentication required for testing)

  // Create a new candidate
  router.post(
    '/',
    // authMiddleware(['candidates', 'create']),
    candidateController.createCandidate.bind(candidateController)
  );
  router.get(
    '/',
    // authMiddleware(['candidates', 'read']),
    candidateController.getCandidates.bind(candidateController)
  );

  // Candidate statistics (must come before /:id routes)
  router.get(
    '/stats',
    // authMiddleware(['candidates', 'read']),
    candidateController.getCandidateStats.bind(candidateController)
  );

  // Get candidate by JAMB registration number (must come before /:id routes)
  router.get(
    '/jamb/:jambRegNo',
    // authMiddleware(['candidates', 'read']),
    candidateController.getCandidateByJambRegNo.bind(candidateController)
  );

  router.get(
    '/:id',
    // authMiddleware(['candidates', 'read']),
    candidateController.getCandidate.bind(candidateController)
  );
  router.put(
    '/:id',
    // authMiddleware(['candidates', 'update']),
    candidateController.updateCandidate.bind(candidateController)
  );
  router.delete(
    '/:id',
    // authMiddleware(['candidates', 'delete']),
    candidateController.deleteCandidate.bind(candidateController)
  );

  // Candidate notes
  router.post(
    '/:id/notes',
    // authMiddleware(['candidates', 'update']),
    candidateController.addCandidateNote.bind(candidateController)
  );
  router.get(
    '/:id/notes',
    // authMiddleware(['candidates', 'read']),
    candidateController.getCandidateNotes.bind(candidateController)
  );

  // Candidate statistics
  router.get(
    '/stats',
    // authMiddleware(['candidates', 'read']),
    candidateController.getCandidateStats.bind(candidateController)
  );

  return router;
}
