import {
  EducationSchema,
  NextOfKinSchema,
  ProfileCompletionStatusSchema,
  ProfileUpdateRequestSchema,
  ProfileUpdateResponseSchema,
  SponsorSchema,
} from '@fuep/types';
import { Request, Response } from 'express';

import { CandidateService } from './candidate.service.js';

export class CandidateController {
  private candidateService: CandidateService;
  private logger: Console;

  constructor(candidateService: CandidateService, logger: Console = console) {
    this.candidateService = candidateService;
    this.logger = logger;
  }

  /**
   * Get candidate profile with JAMB prefill
   */
  async getCandidateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { jambRegNo } = req.params;

      this.logger.log(`[CandidateController] Getting profile for JAMB: ${jambRegNo}`);

      if (!jambRegNo) {
        res.status(400).json({
          success: false,
          error: 'JAMB registration number is required',
        });
        return;
      }

      const profile = await this.candidateService.getCandidateProfile(jambRegNo);

      if (!profile) {
        res.status(404).json({
          success: false,
          error: 'Candidate not found',
        });
        return;
      }

      res.json({
        success: true,
        data: profile,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error getting candidate profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get candidate profile',
      });
    }
  }

  /**
   * Update candidate profile
   */
  async updateCandidateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;
      const requestData = req.body;

      this.logger.log(`[CandidateController] Updating profile for candidate: ${candidateId}`);

      // Validate request body
      const validationResult = ProfileUpdateRequestSchema.safeParse(requestData);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid profile data',
          details: validationResult.error.errors,
        });
        return;
      }

      // Convert string dates to Date objects if present
      const profileData = {
        ...validationResult.data,
        dob: validationResult.data.dob ? new Date(validationResult.data.dob) : undefined,
      };

      const updatedProfile = await this.candidateService.updateCandidateProfile(
        candidateId,
        profileData
      );

      // Format response
      const response = ProfileUpdateResponseSchema.parse({
        success: true,
        data: updatedProfile,
        message: 'Profile updated successfully',
        timestamp: new Date(),
      });

      res.json(response);
    } catch (error) {
      this.logger.error('[CandidateController] Error updating candidate profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update candidate profile',
      });
    }
  }

  /**
   * Get next of kin information
   */
  async getNextOfKin(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;

      this.logger.log(`[CandidateController] Getting NOK for candidate: ${candidateId}`);

      const nok = await this.candidateService.getNextOfKin(candidateId);

      if (!nok) {
        res.status(404).json({
          success: false,
          error: 'Next of kin information not found',
        });
        return;
      }

      res.json({
        success: true,
        data: nok,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error getting next of kin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get next of kin information',
      });
    }
  }

  /**
   * Create or update next of kin information
   */
  async upsertNextOfKin(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;
      const nokData = req.body;

      this.logger.log(`[CandidateController] Upserting NOK for candidate: ${candidateId}`);

      // Validate request body
      const validationResult = NextOfKinSchema.partial().safeParse(nokData);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid next of kin data',
          details: validationResult.error.errors,
        });
        return;
      }

      const nok = await this.candidateService.upsertNextOfKin(candidateId, validationResult.data);

      res.json({
        success: true,
        data: nok,
        message: 'Next of kin information saved successfully',
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error upserting next of kin:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save next of kin information',
      });
    }
  }

  /**
   * Get sponsor information
   */
  async getSponsor(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;

      this.logger.log(`[CandidateController] Getting sponsor for candidate: ${candidateId}`);

      const sponsor = await this.candidateService.getSponsor(candidateId);

      if (!sponsor) {
        res.status(404).json({
          success: false,
          error: 'Sponsor information not found',
        });
        return;
      }

      res.json({
        success: true,
        data: sponsor,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error getting sponsor:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get sponsor information',
      });
    }
  }

  /**
   * Create or update sponsor information
   */
  async upsertSponsor(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;
      const sponsorData = req.body;

      this.logger.log(`[CandidateController] Upserting sponsor for candidate: ${candidateId}`);

      // Validate request body
      const validationResult = SponsorSchema.partial().safeParse(sponsorData);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid sponsor data',
          details: validationResult.error.errors,
        });
        return;
      }

      const sponsor = await this.candidateService.upsertSponsor(candidateId, validationResult.data);

      res.json({
        success: true,
        data: sponsor,
        message: 'Sponsor information saved successfully',
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error upserting sponsor:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to save sponsor information',
      });
    }
  }

  /**
   * Get education records
   */
  async getEducationRecords(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;

      this.logger.log(
        `[CandidateController] Getting education records for candidate: ${candidateId}`
      );

      const records = await this.candidateService.getEducationRecords(candidateId);

      res.json({
        success: true,
        data: records,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error getting education records:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get education records',
      });
    }
  }

  /**
   * Create education record
   */
  async createEducationRecord(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;
      const educationData = req.body;

      this.logger.log(
        `[CandidateController] Creating education record for candidate: ${candidateId}`
      );

      // Validate request body
      const validationResult = EducationSchema.partial().safeParse(educationData);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid education data',
          details: validationResult.error.errors,
        });
        return;
      }

      const record = await this.candidateService.createEducationRecord(
        candidateId,
        validationResult.data
      );

      res.status(201).json({
        success: true,
        data: record,
        message: 'Education record created successfully',
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error creating education record:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create education record',
      });
    }
  }

  /**
   * Update education record
   */
  async updateEducationRecord(req: Request, res: Response): Promise<void> {
    try {
      const { recordId } = req.params;
      const educationData = req.body;

      this.logger.log(`[CandidateController] Updating education record: ${recordId}`);

      // Validate request body
      const validationResult = EducationSchema.partial().safeParse(educationData);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid education data',
          details: validationResult.error.errors,
        });
        return;
      }

      const record = await this.candidateService.updateEducationRecord(
        recordId,
        validationResult.data
      );

      res.json({
        success: true,
        data: record,
        message: 'Education record updated successfully',
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error updating education record:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update education record',
      });
    }
  }

  /**
   * Delete education record
   */
  async deleteEducationRecord(req: Request, res: Response): Promise<void> {
    try {
      const { recordId } = req.params;

      this.logger.log(`[CandidateController] Deleting education record: ${recordId}`);

      await this.candidateService.deleteEducationRecord(recordId);

      res.status(204).send();
    } catch (error) {
      this.logger.error('[CandidateController] Error deleting education record:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete education record',
      });
    }
  }

  /**
   * Get profile completion status
   */
  async getProfileCompletionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;

      this.logger.log(
        `[CandidateController] Getting profile completion status for candidate: ${candidateId}`
      );

      const status = await this.candidateService.getProfileCompletionStatus(candidateId);

      // Validate response
      const response = ProfileCompletionStatusSchema.parse(status);

      res.json({
        success: true,
        data: response,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error getting profile completion status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile completion status',
      });
    }
  }

  /**
   * Get candidate dashboard
   */
  async getCandidateDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;

      this.logger.log(`[CandidateController] Getting dashboard for candidate: ${candidateId}`);

      const dashboard = await this.candidateService.getCandidateDashboard(candidateId);

      res.json({
        success: true,
        data: dashboard,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error getting candidate dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get candidate dashboard',
      });
    }
  }
}
