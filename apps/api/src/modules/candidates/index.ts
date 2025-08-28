import { Router } from 'express';

import { CandidateController } from './candidate.controller.js';
import { CandidateService } from './candidate.service.js';
import { createCandidateRoutes } from './routes/index.js';

export interface CandidateModuleDependencies {
  logger?: Console;
}

export interface CandidateModule {
  router: Router;
  service: CandidateService;
  controller: CandidateController;
}

export function createCandidateModule(deps: CandidateModuleDependencies = {}): CandidateModule {
  const logger = deps.logger || console;

  logger.log('[CandidateModule] Initializing candidate module...');

  try {
    // 1. Create candidate service
    logger.log('[CandidateModule] Creating CandidateService...');
    const service = new CandidateService(logger);
    logger.log('[CandidateModule] CandidateService created successfully');

    // 2. Create candidate controller with service
    logger.log('[CandidateModule] Creating CandidateController...');
    const controller = new CandidateController(service, logger);
    logger.log('[CandidateModule] CandidateController created successfully');

    // 3. Create router using the new routes structure
    logger.log('[CandidateModule] Creating router and binding routes...');
    const router = createCandidateRoutes(controller);
    logger.log('[CandidateModule] Router created and routes bound successfully');

    return {
      router,
      service,
      controller,
    };
  } catch (error) {
    logger.error('[CandidateModule] Failed to initialize candidate module:', error);
    throw error;
  }
}
