import { Router } from 'express';

import { logger } from '../../middleware/logging.js';
import { CandidateService } from '../candidates/candidate.service.js';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { RemitaService } from './remita.service.js';
import { createPaymentRoutes } from './routes/index.js';

export interface PaymentModule {
  router: Router;
  paymentService: PaymentService;
  remitaService: RemitaService;
  paymentController: PaymentController;
}

export function createPaymentModule(): PaymentModule {
  logger.info('Creating payment module');
  const paymentService = new PaymentService();
  const remitaService = new RemitaService();
  const candidateService = new CandidateService(console);
  const paymentController = new PaymentController(candidateService, paymentService, remitaService);

  const router = createPaymentRoutes(paymentController);

  return {
    router,
    paymentService,
    remitaService,
    paymentController,
  };
}
