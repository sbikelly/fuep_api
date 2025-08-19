import { Router } from 'express';

import { CandidateController } from './candidate.controller.js';
import { CandidateService } from './candidate.service.js';

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

    // 3. Create router and bind routes
    logger.log('[CandidateModule] Creating router and binding routes...');
    const router = Router();

    // Profile management
    router.get('/profile/:jambRegNo', controller.getCandidateProfile.bind(controller));
    router.put('/profile/:candidateId', controller.updateCandidateProfile.bind(controller));

    // Next of Kin
    router.get('/:candidateId/next-of-kin', controller.getNextOfKin.bind(controller));
    router.put('/:candidateId/next-of-kin', controller.upsertNextOfKin.bind(controller));

    // Sponsor
    router.get('/:candidateId/sponsor', controller.getSponsor.bind(controller));
    router.put('/:candidateId/sponsor', controller.upsertSponsor.bind(controller));

    // Education records
    router.get('/:candidateId/education', controller.getEducationRecords.bind(controller));
    router.post('/:candidateId/education', controller.createEducationRecord.bind(controller));
    router.put('/education/:recordId', controller.updateEducationRecord.bind(controller));
    router.delete('/education/:recordId', controller.deleteEducationRecord.bind(controller));

    // Profile completion and dashboard
    router.get(
      '/:candidateId/completion-status',
      controller.getProfileCompletionStatus.bind(controller)
    );
    router.get('/:candidateId/dashboard', controller.getCandidateDashboard.bind(controller));

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
