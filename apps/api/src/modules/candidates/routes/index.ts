import { Router } from 'express';

import { candidateRateLimit } from '../../../middleware/rateLimiting.js';
import { CandidateController } from '../candidate.controller.js';

export function createCandidateRoutes(controller: CandidateController): Router {
  const router = Router();

  // Apply candidate-specific rate limiting to all routes
  router.use(candidateRateLimit);

  // JAMB verification and registration initiation (specific routes first)
  // Check JAMB registration number and return candidate information
  router.post('/check-jamb-info', candidateRateLimit, controller.checkJamb.bind(controller));

  // Initiate registration for a candidate
  router.post(
    '/:candidateId/initiate-registration',
    candidateRateLimit,
    controller.initiateRegistration.bind(controller)
  );

  // Legacy combined endpoint (keeping for backward compatibility)
  router.post(
    '/check-jamb',
    candidateRateLimit,
    controller.checkJambAndInitiateRegistration.bind(controller)
  );

  // Contact information completion
  router.post(
    '/:candidateId/complete-contact',
    candidateRateLimit,
    controller.completeContactInfo.bind(controller)
  );

  // Get next step in registration process
  router.get(
    '/:candidateId/next-step',
    candidateRateLimit,
    controller.getNextStep.bind(controller)
  );

  // Mark first login as completed
  router.post(
    '/:candidateId/first-login-completed',
    candidateRateLimit,
    controller.markFirstLoginCompleted.bind(controller)
  );

  // Progressive profile completion
  router.post('/:candidateId/biodata', controller.completeBiodata.bind(controller));
  router.post('/:candidateId/education', controller.completeEducation.bind(controller));
  router.post('/:candidateId/next-of-kin', controller.completeNextOfKin.bind(controller));
  router.post('/:candidateId/sponsor', controller.completeSponsor.bind(controller));

  // Application submission
  router.post('/:candidateId/application', controller.submitApplication.bind(controller));

  // Payment integration endpoints
  router.get(
    '/:candidateId/payment/purposes',
    controller.getAvailablePaymentPurposes.bind(controller)
  );

  // Profile management
  // Get candidate profile by candidateId
  router.get('/:candidateId/profile', controller.getCandidateById.bind(controller));
  // Get candidate profile by JAMB registration number
  router.get('/profile/jamb/:jambRegNo', controller.getCandidateProfile.bind(controller));
  //get all candidates
  router.get('/candidates', controller.getAllCandidates.bind(controller));
  // Update candidate profile
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
  router.get('/:candidateId/status', controller.getCandidateStatus.bind(controller));

  // New endpoints aligned with sequence diagrams
  router.get('/:candidateId/application', controller.getApplication.bind(controller));
  router.put('/:candidateId/application', controller.updateApplication.bind(controller));
  router.get('/:candidateId/registration-form', controller.getRegistrationForm.bind(controller));
  router.get('/:candidateId/admission-status', controller.getAdmissionStatus.bind(controller));
  router.get('/:candidateId/matric-number', controller.getMatricNumber.bind(controller));
  router.get('/:candidateId/migration-status', controller.getMigrationStatus.bind(controller));

  // Legacy routes for backward compatibility (moved from main.ts)
  router.put('/profile', controller.updateCandidateProfile.bind(controller));
  router.post('/applications', controller.createApplication.bind(controller));

  return router;
}
