import { Router } from 'express';

import { createAdminModule } from '../admin/admin.module.js';
import { createAuthModule } from '../auth/index.js';
import { createCandidateModule } from '../candidates/index.js';
import { createPaymentModule } from '../payment/index.js';
import { createSystemModule } from '../system/index.js';

export function createRoutesModule(): Router {
  const router = Router();

  // API health endpoint for Docker health checks and general API health
  router.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: 'FUEP Post-UTME Portal API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Mount all feature modules
  router.use('/auth', createAuthModule().router); //to be changed to auth
  router.use('/system', createSystemModule().router);
  router.use('/candidates', createCandidateModule().router);
  router.use('/payments', createPaymentModule().router);
  router.use('/admin', createAdminModule().router);

  return router;
}
