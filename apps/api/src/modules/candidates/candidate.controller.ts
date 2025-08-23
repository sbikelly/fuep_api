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
   * Get candidate by JAMB registration number
   */
  async getCandidateByJambRegNo(req: Request, res: Response): Promise<void> {
    try {
      const { jambRegNo } = req.params;

      this.logger.log(`[CandidateController] Getting candidate by JAMB: ${jambRegNo}`);

      if (!jambRegNo) {
        res.status(400).json({
          success: false,
          error: 'JAMB registration number is required',
        });
        return;
      }

      const candidate = await this.candidateService.getCandidateByJambRegNo(jambRegNo);

      if (!candidate) {
        res.status(404).json({
          success: false,
          error: 'Candidate not found',
        });
        return;
      }

      res.json({
        success: true,
        data: candidate,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error getting candidate by JAMB:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get candidate',
      });
    }
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

  // Application management endpoints
  async createApplication(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;
      const applicationData = req.body;

      this.logger.log(`[CandidateController] Creating application for candidate: ${candidateId}`);

      const application = await this.candidateService.createApplication(
        candidateId,
        applicationData
      );

      res.status(201).json({
        success: true,
        data: application,
        message: 'Application created successfully',
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error creating application:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create application',
      });
    }
  }

  async getApplication(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;

      this.logger.log(`[CandidateController] Getting application for candidate: ${candidateId}`);

      const application = await this.candidateService.getApplication(candidateId);

      if (!application) {
        res.status(404).json({
          success: false,
          error: 'Application not found',
        });
        return;
      }

      res.json({
        success: true,
        data: application,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error getting application:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get application',
      });
    }
  }

  async updateApplication(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;
      const updateData = req.body;

      this.logger.log(`[CandidateController] Updating application for candidate: ${candidateId}`);

      const application = await this.candidateService.updateApplication(candidateId, updateData);

      res.json({
        success: true,
        data: application,
        message: 'Application updated successfully',
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error updating application:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update application',
      });
    }
  }

  // Registration form endpoints
  async getRegistrationForm(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;

      this.logger.log(
        `[CandidateController] Getting registration form for candidate: ${candidateId}`
      );

      const formData = await this.candidateService.getRegistrationFormData(candidateId);

      res.json({
        success: true,
        data: formData,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error getting registration form:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get registration form data',
      });
    }
  }

  async getRegistrationFormPDF(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;

      this.logger.log(`[CandidateController] Generating PDF for candidate: ${candidateId}`);

      const pdfBuffer = await this.candidateService.generateRegistrationFormPDF(candidateId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="registration-form-${candidateId}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error('[CandidateController] Error generating PDF:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate PDF',
      });
    }
  }

  // Admission and matriculation endpoints
  async getAdmissionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;

      this.logger.log(
        `[CandidateController] Getting admission status for candidate: ${candidateId}`
      );

      const admissionStatus = await this.candidateService.getAdmissionStatus(candidateId);

      res.json({
        success: true,
        data: admissionStatus,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error getting admission status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get admission status',
      });
    }
  }

  async getAdmissionLetterPDF(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;

      this.logger.log(
        `[CandidateController] Generating admission letter for candidate: ${candidateId}`
      );

      const pdfBuffer = await this.candidateService.generateAdmissionLetterPDF(candidateId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="admission-letter-${candidateId}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error('[CandidateController] Error generating admission letter:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate admission letter',
      });
    }
  }

  async getMatricNumber(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;

      this.logger.log(`[CandidateController] Getting matric number for candidate: ${candidateId}`);

      const matricData = await this.candidateService.getMatricNumber(candidateId);

      if (!matricData) {
        res.status(404).json({
          success: false,
          error: 'Matric number not found',
        });
        return;
      }

      res.json({
        success: true,
        data: matricData,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error getting matric number:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get matric number',
      });
    }
  }

  async getMigrationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;

      this.logger.log(
        `[CandidateController] Getting migration status for candidate: ${candidateId}`
      );

      const migrationStatus = await this.candidateService.getMigrationStatus(candidateId);

      res.json({
        success: true,
        data: migrationStatus,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error getting migration status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get migration status',
      });
    }
  }

  async getCandidateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;

      this.logger.log(`[CandidateController] Getting status for candidate: ${candidateId}`);

      const status = await this.candidateService.getCandidateStatus(candidateId);

      res.json({
        success: true,
        data: status,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error getting candidate status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get candidate status',
      });
    }
  }

  /**
   * Check JAMB registration number and initiate registration
   */
  async checkJambAndInitiateRegistration(req: Request, res: Response) {
    try {
      const { jambRegNo, email, phone } = req.body;

      if (!jambRegNo || !email || !phone) {
        return res.status(400).json({
          success: false,
          error: 'JAMB registration number, email, and phone are required',
        });
      }

      const result = await this.candidateService.checkJambAndInitiateRegistration(jambRegNo, {
        email,
        phone,
      });

      return res.json({
        success: result.success,
        message: result.message,
        data: {
          candidateId: result.candidateId,
          nextStep: result.nextStep,
          requiresContactUpdate: result.requiresContactUpdate,
        },
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error checking JAMB:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check JAMB registration',
      });
    }
  }

  /**
   * Complete contact information for existing candidate
   */
  async completeContactInfo(req: Request, res: Response) {
    try {
      const { candidateId } = req.params;
      const { email, phone } = req.body;

      if (!email || !phone) {
        return res.status(400).json({
          success: false,
          error: 'Email and phone are required',
        });
      }

      const result = await this.candidateService.completeContactInfo(candidateId, { email, phone });

      return res.json({
        success: result.success,
        message: result.message,
        data: {
          nextStep: result.nextStep,
        },
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error completing contact info:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to complete contact information',
      });
    }
  }

  /**
   * Get next step in registration process
   */
  async getNextStep(req: Request, res: Response) {
    try {
      const { candidateId } = req.params;

      const result = await this.candidateService.getNextStep(candidateId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: result.message,
        });
      }

      return res.json({
        success: true,
        data: {
          nextStep: result.nextStep,
          message: result.message,
          completedSteps: result.completedSteps,
          remainingSteps: result.remainingSteps,
        },
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error getting next step:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get next step',
      });
    }
  }

  /**
   * Complete biodata information
   */
  async completeBiodata(req: Request, res: Response) {
    try {
      const { candidateId } = req.params;
      const biodata = req.body;

      // Validate required fields
      const requiredFields = [
        'first_name',
        'last_name',
        'date_of_birth',
        'gender',
        'state',
        'lga',
        'address',
        'nationality',
      ];
      for (const field of requiredFields) {
        if (!biodata[field]) {
          return res.status(400).json({
            success: false,
            error: `${field} is required`,
          });
        }
      }

      const result = await this.candidateService.completeBiodata(candidateId, biodata);

      return res.json({
        success: result.success,
        message: result.message,
        data: {
          nextStep: result.nextStep,
        },
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error completing biodata:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to complete biodata information',
      });
    }
  }

  /**
   * Complete education information
   */
  async completeEducation(req: Request, res: Response) {
    try {
      const { candidateId } = req.params;
      const education = req.body;

      // Validate required fields
      const requiredFields = [
        'secondary_school',
        'secondary_school_year',
        'secondary_school_certificate',
        'jamb_subject_1',
        'jamb_subject_2',
        'jamb_subject_3',
        'jamb_subject_4',
        'jamb_score',
      ];
      for (const field of requiredFields) {
        if (!education[field]) {
          return res.status(400).json({
            success: false,
            error: `${field} is required`,
          });
        }
      }

      const result = await this.candidateService.completeEducation(candidateId, education);

      return res.json({
        success: result.success,
        message: result.message,
        data: {
          nextStep: result.nextStep,
        },
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error completing education:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to complete education information',
      });
    }
  }

  /**
   * Complete next of kin information
   */
  async completeNextOfKin(req: Request, res: Response) {
    try {
      const { candidateId } = req.params;
      const nextOfKin = req.body;

      // Validate required fields
      const requiredFields = [
        'next_of_kin_name',
        'next_of_kin_relationship',
        'next_of_kin_phone',
        'next_of_kin_address',
      ];
      for (const field of requiredFields) {
        if (!nextOfKin[field]) {
          return res.status(400).json({
            success: false,
            error: `${field} is required`,
          });
        }
      }

      const result = await this.candidateService.completeNextOfKin(candidateId, nextOfKin);

      return res.json({
        success: result.success,
        message: result.message,
        data: {
          nextStep: result.nextStep,
        },
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error completing next of kin:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to complete next of kin information',
      });
    }
  }

  /**
   * Complete sponsor information
   */
  async completeSponsor(req: Request, res: Response) {
    try {
      const { candidateId } = req.params;
      const sponsor = req.body;

      // Validate required fields
      const requiredFields = [
        'sponsor_name',
        'sponsor_relationship',
        'sponsor_phone',
        'sponsor_address',
        'sponsor_occupation',
        'sponsor_income_range',
      ];
      for (const field of requiredFields) {
        if (!sponsor[field]) {
          return res.status(400).json({
            success: false,
            error: `${field} is required`,
          });
        }
      }

      const result = await this.candidateService.completeSponsor(candidateId, sponsor);

      return res.json({
        success: result.success,
        message: result.message,
        data: {
          nextStep: result.nextStep,
        },
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error completing sponsor:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to complete sponsor information',
      });
    }
  }

  /**
   * Finalize registration
   */
  async finalizeRegistration(req: Request, res: Response) {
    try {
      const { candidateId } = req.params;

      const result = await this.candidateService.finalizeRegistration(candidateId);

      return res.json({
        success: result.success,
        message: result.message,
        data: {
          applicationId: result.applicationId,
        },
      });
    } catch (error) {
      this.logger.error('[CandidateController] Error finalizing registration:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to finalize registration',
      });
    }
  }
}
