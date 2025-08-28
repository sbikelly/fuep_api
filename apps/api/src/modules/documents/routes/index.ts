import { Router } from 'express';

import { uploadRateLimit } from '../../../middleware/rateLimiting.js';
import { DocumentsController } from '../documents.controller.js';

export function createDocumentsRoutes(controller: DocumentsController): Router {
  const router = Router();

  // Mount document routes (with upload rate limiting)
  router.post('/upload', uploadRateLimit, controller.uploadDocument.bind(controller));
  router.get('/:documentId', controller.getDocument.bind(controller));
  router.get('/candidate/:candidateId', controller.getDocumentsByCandidate.bind(controller));
  router.get('/:documentId/download', controller.downloadDocument.bind(controller));
  router.get('/:documentId/secure-url', controller.getSecureDownloadUrl.bind(controller));
  router.delete('/:documentId', controller.deleteDocument.bind(controller));
  router.get('/health/status', controller.getHealthStatus.bind(controller));
  router.post('/:documentId/scan-status', controller.updateScanStatus.bind(controller));

  return router;
}
