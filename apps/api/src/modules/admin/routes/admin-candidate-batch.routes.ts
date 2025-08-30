import { Router } from 'express';

import { AdminCandidateBatchController } from '../controllers/admin-candidate-batch.controller.js';

export function createAdminCandidateBatchRoutes(): Router {
  const router = Router();
  const controller = new AdminCandidateBatchController();

  // Upload candidate batch from Excel file
  router.post('/upload', controller.uploadCandidateBatch.bind(controller));

  // Get batch upload statistics
  router.get('/stats', controller.getBatchUploadStats.bind(controller));

  // Download template (UTME or DE)
  router.get('/template/:type', controller.downloadTemplate.bind(controller));

  return router;
}
