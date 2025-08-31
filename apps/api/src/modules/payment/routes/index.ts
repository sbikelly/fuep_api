import { Router } from 'express';

import { paymentRateLimit } from '../../../middleware/rateLimiting.js';
import { PaymentController } from '../payment.controller.js';

export function createPaymentRoutes(controller: PaymentController): Router {
  const router = Router();

  // Payment initiation (with strict rate limiting)
  router.post('/initiate', paymentRateLimit, controller.initiatePayment.bind(controller));

  // Static routes (must come before parameterized routes)
  router.get('/purposes', controller.getPaymentPurposes.bind(controller));
  router.get('/providers/status', controller.getProviderStatus.bind(controller));
  router.get('/statistics', controller.getPaymentStatistics.bind(controller));
  router.get(
    '/candidate/:candidateId/history',
    controller.getCandidatePaymentHistory.bind(controller)
  );

  // Webhook endpoints
  router.post('/webhook/remita', controller.processRemitaWebhook.bind(controller));

  // Parameterized routes (must come after static routes)
  router.get('/:paymentId', controller.getPaymentStatus.bind(controller));
  router.post('/:paymentId/verify', paymentRateLimit, controller.verifyPayment.bind(controller));
  router.post('/verify/rrr', controller.verifyRRR.bind(controller));
  router.get('/:paymentId/receipt', controller.getPaymentReceipt.bind(controller));

  return router;
}
