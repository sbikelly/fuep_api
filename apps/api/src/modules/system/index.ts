import { Router } from 'express';

import { cacheInstances, createCacheMiddleware } from '../../middleware/caching.js';
import { metricsStore } from '../../middleware/metrics.js';
import { healthCheckRateLimit } from '../../middleware/rateLimiting.js';
import { SystemController } from './system.controller.js';
import { SystemService } from './system.service.js';

export interface SystemModuleDependencies {
  logger?: Console;
}

export interface SystemModule {
  router: Router;
  service: SystemService;
  controller: SystemController;
}

export function createSystemModule(deps: SystemModuleDependencies = {}): SystemModule {
  const logger = deps.logger || console;

  logger.log('[SystemModule] Initializing system module...');

  try {
    // 1. Create system service
    logger.log('[SystemModule] Creating SystemService...');
    const service = new SystemService();
    logger.log('[SystemModule] SystemService created successfully');

    // 2. Create system controller with service
    logger.log('[SystemModule] Creating SystemController...');
    const controller = new SystemController(service, logger);
    logger.log('[SystemModule] SystemController created successfully');

    // 3. Create router and bind routes
    logger.log('[SystemModule] Creating router and binding routes...');
    const router = Router();

    // Root health endpoint for Render health checks
    router.get('/', controller.rootHealth.bind(controller));

    // Health check endpoint (with fast caching)
    router.get(
      '/health',
      healthCheckRateLimit,
      createCacheMiddleware(cacheInstances.fast, 10000),
      controller.healthCheck.bind(controller)
    );

    // Database connectivity check
    router.get('/health/db', healthCheckRateLimit, controller.databaseHealth.bind(controller));

    // Health endpoint with metrics
    router.get(
      '/health/detailed',
      createCacheMiddleware(cacheInstances.fast, 30000),
      controller.detailedHealth.bind(controller)
    );

    // Rate limit monitoring endpoint (admin only)
    router.get('/admin/rate-limit-stats', controller.rateLimitStats.bind(controller));

    // Metrics endpoint (admin only)
    router.get('/admin/metrics', controller.systemMetrics.bind(controller));

    // Cache health endpoint
    router.get('/admin/cache-stats', controller.cacheStats.bind(controller));

    logger.log('[SystemModule] Router created and routes bound successfully');

    return {
      router,
      service,
      controller,
    };
  } catch (error) {
    logger.error('[SystemModule] Failed to initialize system module:', error);
    throw error;
  }
}
