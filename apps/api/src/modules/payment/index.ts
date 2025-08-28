import { Router } from 'express';

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
  const paymentService = new PaymentService();
  const remitaService = new RemitaService();
  const paymentController = new PaymentController(paymentService);

  const router = createPaymentRoutes(paymentController);

  return {
    router,
    paymentService,
    remitaService,
    paymentController,
  };
}
