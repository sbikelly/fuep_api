import { Router } from 'express';

import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';
import { PaymentProviderRegistry } from './providers/provider-registry.js';
import { paymentRateLimit } from '../middleware/rateLimiting.js';

export interface PaymentsModuleDependencies {
  logger?: Console;
}

export interface PaymentsModule {
  router: Router;
  registry: PaymentProviderRegistry;
  service: PaymentService;
  controller: PaymentController;
}

export function createPaymentsModule(deps: PaymentsModuleDependencies = {}): PaymentsModule {
  const logger = deps.logger || console;

  logger.log('[PaymentsModule] Initializing payments module...');

  try {
    // 1. Create provider registry
    logger.log('[PaymentsModule] Creating PaymentProviderRegistry...');
    const registry = new PaymentProviderRegistry();
    logger.log('[PaymentsModule] PaymentProviderRegistry created successfully');

    // 2. Create payment service with registry
    logger.log('[PaymentsModule] Creating PaymentService...');
    const service = new PaymentService(registry);
    logger.log('[PaymentsModule] PaymentService created successfully');

    // 3. Create payment controller with service
    logger.log('[PaymentsModule] Creating PaymentController...');
    const controller = new PaymentController(service);
    logger.log('[PaymentsModule] PaymentController created successfully');

    // 4. Create router and bind routes
    logger.log('[PaymentsModule] Creating router and binding routes...');
    const router = Router();

    // Payment initiation (with strict rate limiting)
    router.post('/initiate', paymentRateLimit, controller.initiatePayment.bind(controller));

    // Static routes (must come before parameterized routes)
    router.get('/types', controller.getPaymentTypes.bind(controller));
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
    router.get('/:paymentId/receipt', controller.getPaymentReceipt.bind(controller));

    logger.log('[PaymentsModule] Router created and routes bound successfully');

    // 5. Log provider status
    const providerStatus = registry.getProviderStatus();
    const enabledProviders = Object.keys(providerStatus).filter(
      (name) => providerStatus[name].enabled
    );
    logger.log(`[PaymentsModule] Payment providers initialized: ${enabledProviders.join(', ')}`);
    logger.log(`[PaymentsModule] Total providers: ${Object.keys(providerStatus).length}`);

    return {
      router,
      registry,
      service,
      controller,
    };
  } catch (error) {
    logger.error('[PaymentsModule] Failed to initialize payments module:', error);
    throw error;
  }
}
