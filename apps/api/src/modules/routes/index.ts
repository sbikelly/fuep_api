import { Router } from 'express';

import { createAdminModule } from '../admin/admin.module.js';
import { createAuthModule } from '../auth/index.js';
import { createCandidateModule } from '../candidates/index.js';
import { createDocumentsModule } from '../documents/index.js';
import { createPaymentModule } from '../payment/index.js';
import { createSystemModule } from '../system/index.js';

export function createRoutesModule(): Router {
  const router = Router();

  // Mount all feature modules
  router.use('/auth', createAuthModule().router); //to be changed to auth
  router.use('/system', createSystemModule().router);
  router.use('/candidates', createCandidateModule().router);
  router.use('/payments', createPaymentModule().router);
  router.use('/documents', createDocumentsModule().router);
  router.use('/admin', createAdminModule().router);

  return router;
}
