import {
  Application,
  ApplicationCreateRequest,
  Candidate,
  CandidateProfileUpdateRequest,
  EducationRecord,
  NextOfKin,
  NextStepInfo,
  PaymentHistoryResponse,
  PaymentPurpose,
  PaymentPurposeName,
  PaymentStatus,
  ProfileCompletionStatus,
  Sponsor,
} from '@fuep/types';

import { db } from '../../db/knex.js';
import { logger } from '../../middleware/logging.js';
import { withDatabaseLogging, withPerformanceLogging } from '../../middleware/logging.js';
import { EmailService } from '../../services/email.service.js';
import { PDFService } from '../../services/pdf.service.js';
import { SMSService } from '../../services/sms.service.js';
import { PasswordUtils } from '../../utils/password.utils.js';
import { PaymentService } from '../payment/payment.service.js';

export class CandidateService {
  private emailService: EmailService;
  private smsService: SMSService;
  private pdfService: PDFService;
  private _paymentService?: PaymentService;

  constructor(private logger: Console) {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.pdfService = new PDFService();
  }

  // Lazy getter for payment service
  private get paymentService(): PaymentService {
    if (!this._paymentService) {
      this._paymentService = new PaymentService();
    }
    return this._paymentService;
  }

  /**
   * ***** Registration Process *****
   * **** Admin flow ****
   * Admin upload the candidates from jamb using the excel template(whose content will be extracted from the frontend) to the candidates database table
   *
   * **** Candidate registration flow ****
   * ** JAMB Verification & Account Creation **
   * Check JAMB registration number from the application page to initiate registration
   * if the registration number exists in the candidates table
   * check whether the candidate already has password_hash(which will be used to different between candidate who have initiated registration and those who have not because the ones who have initiated registration will have a password_hash automatically created and sent to their email)
   * if the candidate is have already initiated registration, redirect the candidate to the login page to login and complete the registration process
   * but if the password_hash is not found in the "candidates" table, it means the candidate has not initiated/completed registration
   * check if the candidate's contact info(email and phone) exists
   * if the contact info exists, proceed to create and send a temporary password to the candidate's email and also flag the password_hash (by setting the value of candidate's isFirstLogin to true)
   * else if the contact info does not exist, prompt the candidate to complete the contact info by calling the "completeContactInfo" function
   * after the contact info are provided by the candidate, proceed to create and send a temporary password to the candidate's email and also flag the password_hash (by setting the value of candidate's isFirstLogin to true)  send a temporary password to the candidate's email
   * display the newly created logins details(Jamb reg no and the newly created password) to the candidate and then redirect the candidate to the login page to login page
   * after the candidate successfully logged in using his jambregno as username and the temporary password,check if the candidate's isFirstLogin is set to tru
   * if isFirstLogin is true, propmt the candidate to change his password.
   * check if the candidate has completed the registration process
   * if the candidate has completed the registration process, redirect the candidate to the dashboard home page
   * else if the candidate has not completed the registration process, redirect the candidate to the biodata page to complete the biodata registration process
   */
  async checkJambAndInitiateRegistration(jambRegNo: string): Promise<{
    success: boolean;
    message: string;
    candidateId?: string;
    nextStep?: string;
    requiresContactUpdate?: boolean;
    candidateType?: 'UTME' | 'DE';
    loginDetails?: {
      username: string;
      password: string;
    };
  }> {
    return await withDatabaseLogging('checkJambAndInitiateRegistration', 'candidates', async () => {
      try {
        // Check if JAMB number exists in candidates table
        const candidateRecord = await db('candidates').where('jamb_reg_no', jambRegNo).first();

        if (!candidateRecord) {
          return {
            success: false,
            message:
              'JAMB registration number not found in candidates database. Please contact admin for assistance.',
            nextStep: 'error',
          };
        }

        // Check if candidate already has password_hash (has initiated registration)
        if (candidateRecord.password_hash) {
          return {
            success: true,
            message: 'Candidate has already initiated registration. Please login to continue.',
            candidateId: candidateRecord.id,
            nextStep: 'login',
            candidateType: candidateRecord.mode_of_entry,
          };
        }

        // Candidate exists but no password_hash, it means he hasn't inititated registration yet
        // check contact info before initiating the registration process
        if (!candidateRecord.email || !candidateRecord.phone) {
          return {
            success: false,
            message: 'Contact information required to complete registration',
            candidateId: candidateRecord.id,
            nextStep: 'complete_contact',
            requiresContactUpdate: true,
            candidateType: candidateRecord.mode_of_entry,
          };
        }

        // Contact info exists - create password and send email
        const tempPassword = PasswordUtils.generateTemporaryPassword();
        const hashedPassword = await PasswordUtils.hashPassword(tempPassword);

        // Update candidate with password and set isFirstLogin to true
        await db('candidates').where('id', candidateRecord.id).update({
          password_hash: hashedPassword,
          is_first_login: true,
          updated_at: new Date(),
        });

        // Send temporary password email
        try {
          await this.emailService.sendTemporaryPassword(
            candidateRecord.email,
            jambRegNo,
            tempPassword,
            `${candidateRecord.firstname} ${candidateRecord.surname}`
          );
        } catch (emailError) {
          logger.warn('Failed to send temporary password email', {
            module: 'candidate',
            operation: 'checkJambAndInitiateRegistration',
            metadata: { candidateId: candidateRecord.id, email: candidateRecord.email },
            error: emailError instanceof Error ? emailError.message : String(emailError),
          });
        }

        // Send SMS notification
        try {
          await this.smsService.sendTemporaryPasswordSMS(
            candidateRecord.phone,
            jambRegNo,
            tempPassword,
            `${candidateRecord.firstname} ${candidateRecord.surname}`
          );
        } catch (smsError) {
          logger.warn('Failed to send SMS notification', {
            module: 'candidate',
            operation: 'checkJambAndInitiateRegistration',
            metadata: { candidateId: candidateRecord.id, phone: candidateRecord.phone },
            error: smsError instanceof Error ? smsError.message : String(smsError),
          });
        }

        return {
          success: true,
          message: 'Temporary password sent to your email. Please login to continue.',
          candidateId: candidateRecord.id,
          nextStep: 'login',
          candidateType: candidateRecord.mode_of_entry,
          loginDetails: {
            username: jambRegNo,
            password: tempPassword,
          },
        };
      } catch (error) {
        logger.error('Failed to check JAMB and initiate registration', {
          module: 'candidate',
          operation: 'checkJambAndInitiateRegistration',
          metadata: { jambRegNo },
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });
  }

  /**
   * Phase 1: Complete contact information for existing candidate
   */
  async completeContactInfo(
    candidateId: string,
    contactInfo: {
      email: string;
      phone: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    nextStep?: string;
    loginDetails?: {
      username: string;
      password: string;
    };
  }> {
    return await withDatabaseLogging('completeContactInfo', 'candidates', async () => {
      try {
        // Check if candidate exists
        const candidate = await db('candidates').where('id', candidateId).first();

        if (!candidate) {
          return {
            success: false,
            message: 'Candidate not found',
          };
        }

        // Update candidate contact information (simplified schema)
        await db('candidates').where('id', candidateId).update({
          email: contactInfo.email,
          phone: contactInfo.phone,
        });

        logger.info('Contact information completed successfully', {
          module: 'candidate',
          operation: 'completeContactInfo',
          metadata: { candidateId, contactInfo },
        });

        // If candidate needs new password, generate and send
        let tempPassword: string | undefined;
        if (!candidate.password_hash) {
          tempPassword = PasswordUtils.generateTemporaryPassword();
          const hashedPassword = await PasswordUtils.hashPassword(tempPassword);

          // Update password
          await db('candidates').where('id', candidateId).update({
            password_hash: hashedPassword,
          });

          // Send email
          await this.emailService.sendTemporaryPassword(
            contactInfo.email,
            candidate.jamb_reg_no,
            tempPassword,
            `${candidate.firstname} ${candidate.surname}`
          );

          // Send SMS notification
          try {
            await this.smsService.sendTemporaryPasswordSMS(
              contactInfo.phone,
              candidate.jamb_reg_no,
              tempPassword,
              `${candidate.firstname} ${candidate.surname}`
            );
          } catch (smsError) {
            logger.warn('Failed to send SMS notification', {
              module: 'candidate',
              operation: 'completeContactInfo',
              metadata: { candidateId, phone: contactInfo.phone },
              error: smsError instanceof Error ? smsError.message : String(smsError),
            });
          }
        }

        logger.info('Contact information completed successfully', {
          module: 'candidate',
          operation: 'completeContactInfo',
          metadata: { candidateId, contactInfo },
        });

        const response: {
          success: boolean;
          message: string;
          nextStep?: string;
          loginDetails?: {
            username: string;
            password: string;
          };
        } = {
          success: true,
          message: 'Contact information updated successfully',
          nextStep: 'login',
        };

        // Include login details if password was generated
        if (tempPassword) {
          response.loginDetails = {
            username: candidate.jamb_reg_no,
            password: tempPassword,
          };
        }

        return response;
      } catch (error) {
        logger.error('Failed to complete contact information', {
          module: 'candidate',
          operation: 'completeContactInfo',
          metadata: { candidateId, contactInfo },
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });
  }

  /**
   * Phase 2: Complete biodata information
   */
  async completeBiodata(
    candidateId: string,
    biodata: {
      firstname: string;
      surname: string;
      othernames?: string;
      gender: string;
      dob: string;
      state: string;
      lga: string;
      address: string;
      emergencyContact: {
        name: string;
        relationship: string;
        phone: string;
        address: string;
      };
    }
  ): Promise<{
    success: boolean;
    message: string;
    nextStep?: string;
  }> {
    return await withDatabaseLogging('completeBiodata', 'candidates', async () => {
      try {
        // Update candidate with biodata (simplified schema)
        await db('candidates').where('id', candidateId).update({
          firstname: biodata.firstname,
          surname: biodata.surname,
          othernames: biodata.othernames,
          gender: biodata.gender,
          dob: biodata.dob,
          state: biodata.state,
          lga: biodata.lga,
          address: biodata.address,
          biodata_completed: true,
        });

        logger.info('Biodata completed successfully', {
          module: 'candidate',
          operation: 'completeBiodata',
          metadata: { candidateId },
        });

        return {
          success: true,
          message: 'Biodata completed successfully',
          nextStep: 'education',
        };
      } catch (error) {
        logger.error('Failed to complete biodata', {
          module: 'candidate',
          operation: 'completeBiodata',
          metadata: { candidateId, biodata },
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });
  }

  /**
   * Phase 2: Complete educational background
   */
  async completeEducation(
    candidateId: string,
    education: {
      secondarySchool: string;
      certificateType: 'SSCE' | 'GCE';
      examYear: number;
      examType: 'WAEC' | 'NECO' | 'NABTEB';
      examNumber: string;
      seatingCount: number;
      subjects: Array<{
        subject: string;
        grade: string;
      }>;
      // For UTME candidates
      jambSubjects?: Array<{
        subject: string;
        score: number;
      }>;
      // For DE candidates
      certificateTypeDE?: 'NCE' | 'ND' | 'HND';
      certificateNumber?: string;
      aLevelGrade?: string;
      // Certificate upload removed - documents module no longer exists
    }
  ): Promise<{
    success: boolean;
    message: string;
    nextStep?: string;
  }> {
    return await withDatabaseLogging('completeEducation', 'education_records', async () => {
      try {
        // Get candidate type
        const candidate = await db('candidates').where('id', candidateId).first();
        if (!candidate) {
          logger.error('Candidate not found for education completion', {
            module: 'candidate',
            operation: 'completeEducation',
            metadata: { candidateId },
          });
          throw new Error('Candidate not found. Please ensure you are properly registered.');
        }

        // Create education record
        const [educationRecord] = await db('education_records')
          .insert({
            candidate_id: candidateId,
            secondary_school: education.secondarySchool,
            certificate_type: education.certificateType,
            exam_year: education.examYear,
            exam_type: education.examType,
            exam_numbers: [education.examNumber], // Convert to array as per table schema
            seating_count: education.seatingCount,
            subjects: JSON.stringify(education.subjects),
            jamb_subjects:
              candidate.candidate_type === 'UTME' ? JSON.stringify(education.jambSubjects) : null,
            certificate_type_de:
              candidate.candidate_type === 'DE' ? education.certificateTypeDE : null,
            certificate_number:
              candidate.candidate_type === 'DE' ? education.certificateNumber : null,
            grade: candidate.candidate_type === 'DE' ? education.aLevelGrade : null,
            // Certificate upload removed - documents module no longer exists
            created_at: new Date(),
            updated_at: new Date(),
          })
          .returning('*');

        // Update candidate education completion status
        await db('candidates').where('id', candidateId).update({
          education_completed: true,
          updated_at: new Date(),
        });

        logger.info('Education completed successfully', {
          module: 'candidate',
          operation: 'completeEducation',
          metadata: { candidateId, educationRecordId: educationRecord.id },
        });

        return {
          success: true,
          message: 'Education completed successfully',
          nextStep: 'next_of_kin',
        };
      } catch (error) {
        logger.error('Failed to complete education', {
          module: 'candidate',
          operation: 'completeEducation',
          metadata: { candidateId, education },
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });
  }

  /**
   * Phase 2: Complete next of kin information
   */
  async completeNextOfKin(
    candidateId: string,
    nextOfKin: {
      surname: string;
      firstname: string;
      othernames?: string;
      relationship: string;
      phone: string;
      email?: string;
      address: string;
      occupation: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    nextStep?: string;
  }> {
    return await withDatabaseLogging('completeNextOfKin', 'next_of_kin', async () => {
      try {
        // Upsert next of kin information
        await db('next_of_kin').where('candidate_id', candidateId).del();

        await db('next_of_kin').insert({
          candidate_id: candidateId,
          surname: nextOfKin.surname,
          firstname: nextOfKin.firstname,
          othernames: nextOfKin.othernames,
          relationship: nextOfKin.relationship,
          phone: nextOfKin.phone,
          email: nextOfKin.email,
          address: nextOfKin.address,
          occupation: nextOfKin.occupation,
          created_at: new Date(),
          updated_at: new Date(),
        });

        // Update candidate next of kin completion status
        await db('candidates').where('id', candidateId).update({
          next_of_kin_completed: true,
          updated_at: new Date(),
        });

        logger.info('Next of kin completed successfully', {
          module: 'candidate',
          operation: 'completeNextOfKin',
          metadata: { candidateId },
        });

        return {
          success: true,
          message: 'Next of kin completed successfully',
          nextStep: 'sponsor',
        };
      } catch (error) {
        logger.error('Failed to complete next of kin', {
          module: 'candidate',
          operation: 'completeNextOfKin',
          metadata: { candidateId, nextOfKin },
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });
  }

  /**
   * Phase 2: Complete sponsor information
   */
  async completeSponsor(
    candidateId: string,
    sponsor: {
      surname: string;
      firstname: string;
      othernames?: string;
      relationship: string;
      phone: string;
      email?: string;
      address: string;
      occupation: string;
      paymentResponsibility: boolean;
    }
  ): Promise<{
    success: boolean;
    message: string;
    nextStep?: string;
  }> {
    return await withDatabaseLogging('completeSponsor', 'sponsors', async () => {
      try {
        // Upsert sponsor information
        await db('sponsors').where('candidate_id', candidateId).del();

        await db('sponsors').insert({
          candidate_id: candidateId,
          surname: sponsor.surname,
          firstname: sponsor.firstname,
          othernames: sponsor.othernames,
          relationship: sponsor.relationship,
          phone: sponsor.phone,
          email: sponsor.email,
          address: sponsor.address,
          occupation: sponsor.occupation,
          payment_responsibility: sponsor.paymentResponsibility,
          created_at: new Date(),
          updated_at: new Date(),
        });

        // Update candidate sponsor completion status
        await db('candidates').where('id', candidateId).update({
          sponsor_completed: true,
          updated_at: new Date(),
        });

        logger.info('Sponsor completed successfully', {
          module: 'candidate',
          operation: 'completeSponsor',
          metadata: { candidateId },
        });

        return {
          success: true,
          message: 'Sponsor completed successfully',
          nextStep: 'application_submission',
        };
      } catch (error) {
        logger.error('Failed to complete sponsor', {
          module: 'candidate',
          operation: 'completeSponsor',
          metadata: { candidateId, sponsor },
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });
  }

  /**
   * Phase 2: Submit application
   */
  async submitApplication(
    candidateId: string,
    application: {
      session: string;
      programmeCode: string;
      departmentCode: string;
      facultyCode: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    nextStep?: string;
    applicationId?: string;
  }> {
    return await withDatabaseLogging('submitApplication', 'applications', async () => {
      try {
        // Create application record
        const [applicationRecord] = await db('applications')
          .insert({
            candidate_id: candidateId,
            session: application.session,
            programme_code: application.programmeCode,
            department_code: application.departmentCode,
            faculty_code: application.facultyCode,
            status: 'pending',
            submitted_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          })
          .returning('*');

        logger.info('Application submitted successfully', {
          module: 'candidate',
          operation: 'submitApplication',
          metadata: { candidateId, applicationId: applicationRecord.id },
        });

        return {
          success: true,
          message: 'Application submitted successfully',
          nextStep: 'payment',
          applicationId: applicationRecord.id,
        };
      } catch (error) {
        logger.error('Failed to submit application', {
          module: 'candidate',
          operation: 'submitApplication',
          metadata: { candidateId, application },
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });
  }

  /**
   * Mark candidate as having completed first login
   */
  async markFirstLoginCompleted(candidateId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return await withDatabaseLogging('markFirstLoginCompleted', 'candidates', async () => {
      try {
        await db('candidates').where('id', candidateId).update({
          is_first_login: false,
          updated_at: new Date(),
        });

        logger.info('First login marked as completed', {
          module: 'candidate',
          operation: 'markFirstLoginCompleted',
          metadata: { candidateId },
        });

        return {
          success: true,
          message: 'First login completed successfully',
        };
      } catch (error) {
        logger.error('Failed to mark first login as completed', {
          module: 'candidate',
          operation: 'markFirstLoginCompleted',
          metadata: { candidateId },
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });
  }

  /**
   * Phase 3: Get next step in registration process
   */
  async getNextStep(candidateId: string): Promise<{
    success: boolean;
    nextStep: string;
    message: string;
    completedSteps: string[];
    remainingSteps: string[];
    candidateType?: 'UTME' | 'DE';
  }> {
    return await withDatabaseLogging('getNextStep', 'candidates', async () => {
      try {
        const candidate = await db('candidates').where('id', candidateId).first();

        if (!candidate) {
          return {
            success: false,
            nextStep: 'error',
            message: 'Candidate not found',
            completedSteps: [],
            remainingSteps: [],
          };
        }

        const application = await db('applications').where('candidate_id', candidateId).first();
        const payments = await db('payments')
          .where('candidate_id', candidateId)
          .andWhere('purpose', 'POST_UTME')
          .andWhere('status', 'success');

        const completedSteps: string[] = [];
        const remainingSteps: string[] = [];

        // Check completed steps
        if (candidate.email && candidate.phone) {
          completedSteps.push('contact_info');
        } else {
          remainingSteps.push('contact_info');
        }

        if (candidate.biodata_completed) {
          completedSteps.push('biodata');
        } else {
          remainingSteps.push('biodata');
        }

        if (candidate.education_completed) {
          completedSteps.push('education');
        } else {
          remainingSteps.push('education');
        }

        if (candidate.next_of_kin_completed) {
          completedSteps.push('next_of_kin');
        } else {
          remainingSteps.push('next_of_kin');
        }

        if (candidate.sponsor_completed) {
          completedSteps.push('sponsor');
        } else {
          remainingSteps.push('sponsor');
        }

        if (application?.status === 'pending') {
          completedSteps.push('application_submission');
        } else {
          remainingSteps.push('application_submission');
        }

        if (payments.length > 0) {
          completedSteps.push('post_utme_payment');
        } else {
          remainingSteps.push('post_utme_payment');
        }

        // Determine next step based on completed steps
        let nextStep = 'contact_info';
        let message = 'Please provide your contact information';

        if (completedSteps.includes('contact_info')) {
          // the next step after contact info is login page
          if (candidate.email && candidate.phone) {
            nextStep = 'login';
            message = 'Please login to continue';
          } else if (!candidate.biodata_completed) {
            nextStep = 'biodata';
            message = 'Please complete your biodata information';
          } else if (!candidate.education_completed) {
            nextStep = 'education';
            message = 'Please provide your educational background';
          } else if (!candidate.next_of_kin_completed) {
            nextStep = 'next_of_kin';
            message = 'Please provide next of kin information';
          } else if (!candidate.sponsor_completed) {
            nextStep = 'sponsor';
            message = 'Please provide sponsor information';
          } else if (!application) {
            nextStep = 'application_submission';
            message = 'Please submit your application';
          } else if (payments.length === 0) {
            nextStep = 'post_utme_payment';
            message = 'Please complete Post-UTME payment';
          } else {
            nextStep = 'registration_complete';
            message = 'Registration completed successfully';
          }
        }

        logger.info('Next step retrieved successfully', {
          module: 'candidate',
          operation: 'getNextStep',
          metadata: { candidateId, nextStep, completedSteps: completedSteps.length },
        });

        return {
          success: true,
          nextStep,
          message,
          completedSteps,
          remainingSteps,
          candidateType: candidate.candidate_type,
        };
      } catch (error) {
        logger.error('Failed to get next step', {
          module: 'candidate',
          operation: 'getNextStep',
          metadata: { candidateId },
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });
  }

  /**
   * Get candidate profile by JAMB registration number or candidate ID.
   * Includes department and faculty information, application, and admission details.
   * Accepts either jambRegNo (string) or candidateId (string).
   * And optionally, some custom fields
   */
  /**
   * Get candidate profile by jambRegNo or candidateId, with optional custom fields.
   * Accepts a single parameter: string (jambRegNo or candidateId), and optional customFields.
   */
  async getCandidateProfile(
    identifier: string,
    customFields?: Record<string, any>
  ): Promise<any | null> {
    return withPerformanceLogging(
      'getCandidateProfile',
      async () => {
        return withDatabaseLogging(
          'SELECT',
          'candidates,departments,faculties,applications,admissions',
          async () => {
            try {
              // Try to detect if identifier is a jambRegNo (contains only digits/letters, usually length 10) or candidateId (uuid)
              let candidateQuery = db('candidates as c')
                .select(
                  'c.*',
                  'd.id as department_id',
                  'd.name as department_name',
                  'd.code as department_code',
                  'd.description as department_description',
                  'f.id as faculty_id',
                  'f.name as faculty_name',
                  'f.code as faculty_code'
                )
                .leftJoin('departments as d', 'c.department_id', 'd.id')
                .leftJoin('faculties as f', 'd.faculty_id', 'f.id');

              // If identifier looks like a UUID, treat as candidateId, else as jambRegNo
              if (/^[0-9a-fA-F-]{36}$/.test(identifier)) {
                candidateQuery = candidateQuery.where('c.id', identifier);
              } else {
                candidateQuery = candidateQuery.where('c.jamb_reg_no', identifier);
              }

              // Apply custom fields if provided
              if (customFields && typeof customFields === 'object') {
                Object.entries(customFields).forEach(([key, value]) => {
                  candidateQuery = candidateQuery.andWhere(`c.${key}`, value);
                });
              }

              const candidate = await candidateQuery.first();

              if (!candidate) {
                logger.info('Candidate not found for profile', {
                  module: 'candidates',
                  operation: 'getCandidateProfile',
                  metadata: { identifier, found: false },
                });
                return null;
              }

              // Get additional data from related tables
              const application = await db('applications')
                .where('candidate_id', candidate.id)
                .first();
              const admission = await db('admissions').where('candidate_id', candidate.id).first();

              const result = {
                id: candidate.id,
                jambRegNo: candidate.jamb_reg_no,
                firstname: candidate.firstname,
                surname: candidate.surname,
                othernames: candidate.othernames,
                gender: candidate.gender,
                dob: candidate.dob,
                nationality: candidate.nationality,
                state: candidate.state,
                lga: candidate.lga,
                address: candidate.address,
                email: candidate.email,
                phone: candidate.phone,
                department: candidate.department, // For backward compatibility
                departmentId: candidate.department_id,
                departmentInfo: candidate.department_id
                  ? {
                      id: candidate.department_id,
                      name: candidate.department_name,
                      code: candidate.department_code,
                      description: candidate.department_description,
                      faculty: candidate.faculty_id
                        ? {
                            id: candidate.faculty_id,
                            name: candidate.faculty_name,
                            code: candidate.faculty_code,
                          }
                        : undefined,
                    }
                  : undefined,
                modeOfEntry: candidate.mode_of_entry,
                maritalStatus: candidate.marital_status,
                passportPhotoUrl: candidate.passport_photo_url,
                signatureUrl: candidate.signature_url,
                registrationCompleted: candidate.registration_completed,
                biodataCompleted: candidate.biodata_completed,
                educationCompleted: candidate.education_completed,
                nextOfKinCompleted: candidate.next_of_kin_completed,
                sponsorCompleted: candidate.sponsor_completed,
                admissionStatus: candidate.admission_status,
                paymentStatus: candidate.payment_status,
                rrr: candidate.rrr,
                application: application
                  ? {
                      id: application.id,
                      session: application.session,
                      departmentCode: application.department_code,
                      facultyCode: application.faculty_code,
                      status: application.status,
                    }
                  : null,
                admission: admission
                  ? {
                      id: admission.id,
                      decision: admission.decision,
                      decidedAt: admission.decided_at,
                      notes: admission.notes,
                    }
                  : null,
                createdAt: candidate.created_at,
                updatedAt: candidate.updated_at,
              };

              logger.info('Candidate profile retrieved successfully', {
                module: 'candidates',
                operation: 'getCandidateProfile',
                metadata: {
                  identifier,
                  candidateId: candidate.id,
                  found: true,
                  hasDepartment: !!candidate.department_id,
                },
              });

              return result;
            } catch (error) {
              logger.error('Failed to get candidate profile', {
                module: 'candidates',
                operation: 'getCandidateProfile',
                metadata: { identifier },
                error: error instanceof Error ? error.message : String(error),
              });
              throw new Error('Failed to retrieve candidate profile. Please try again later.');
            }
          },
          { metadata: { identifier, customFields } }
        );
      },
      { metadata: { identifier, customFields } }
    );
  }

  /**
   * Get All Candidates along with their data from other related tables
   */
  async getAllCandidates(): Promise<any[]> {
    return withPerformanceLogging('getAllCandidatesWithDetails', async () => {
      return withDatabaseLogging(
        'SELECT',
        'candidates,departments,faculties,applications,admissions',
        async () => {
          try {
            // Get all candidates
            const candidates = await db('candidates as c')
              .select(
                'c.*',
                'd.id as department_id',
                'd.name as department_name',
                'd.code as department_code',
                'f.id as faculty_id',
                'f.name as faculty_name',
                'f.code as faculty_code'
              )
              .leftJoin('departments as d', 'c.department_id', 'd.id')
              .leftJoin('faculties as f', 'd.faculty_id', 'f.id');

            // For each candidate, get related data
            const results = await Promise.all(
              candidates.map(async (candidate: any) => {
                const [application, admission, education, nextOfKin, sponsor] = await Promise.all([
                  db('applications').where('candidate_id', candidate.id).first(),
                  db('admissions').where('candidate_id', candidate.id).first(),
                  db('education_records').where('candidate_id', candidate.id),
                  db('next_of_kin').where('candidate_id', candidate.id).first(),
                  db('sponsors').where('candidate_id', candidate.id).first(),
                ]);

                return {
                  id: candidate.id,
                  jambRegNo: candidate.jamb_reg_no,
                  firstname: candidate.firstname,
                  surname: candidate.surname,
                  othernames: candidate.othernames,
                  gender: candidate.gender,
                  dob: candidate.dob,
                  nationality: candidate.nationality,
                  state: candidate.state,
                  lga: candidate.lga,
                  address: candidate.address,
                  email: candidate.email,
                  phone: candidate.phone,
                  department: candidate.department,
                  departmentId: candidate.department_id,
                  departmentInfo: candidate.department_id
                    ? {
                        id: candidate.department_id,
                        name: candidate.department_name,
                        code: candidate.department_code,
                        faculty: candidate.faculty_id
                          ? {
                              id: candidate.faculty_id,
                              name: candidate.faculty_name,
                              code: candidate.faculty_code,
                            }
                          : undefined,
                      }
                    : undefined,
                  modeOfEntry: candidate.mode_of_entry,
                  maritalStatus: candidate.marital_status,
                  passportPhotoUrl: candidate.passport_photo_url,
                  signatureUrl: candidate.signature_url,
                  registrationCompleted: candidate.registration_completed,
                  biodataCompleted: candidate.biodata_completed,
                  educationCompleted: candidate.education_completed,
                  nextOfKinCompleted: candidate.next_of_kin_completed,
                  sponsorCompleted: candidate.sponsor_completed,
                  admissionStatus: candidate.admission_status,
                  paymentStatus: candidate.payment_status,
                  rrr: candidate.rrr,
                  application: application
                    ? {
                        id: application.id,
                        session: application.session,
                        departmentCode: application.department_code,
                        facultyCode: application.faculty_code,
                        status: application.status,
                      }
                    : null,
                  admission: admission
                    ? {
                        id: admission.id,
                        decision: admission.decision,
                        decidedAt: admission.decided_at,
                        notes: admission.notes,
                      }
                    : null,
                  educationRecords: education,
                  nextOfKin,
                  sponsor,
                  createdAt: candidate.created_at,
                  updatedAt: candidate.updated_at,
                };
              })
            );

            logger.info('All candidates with details retrieved successfully', {
              module: 'candidates',
              operation: 'getAllCandidatesWithDetails',
              metadata: { count: results.length },
            });

            return results;
          } catch (error) {
            logger.error('Failed to get all candidates with details', {
              module: 'candidates',
              operation: 'getAllCandidatesWithDetails',
              error: error instanceof Error ? error.message : String(error),
            });
            throw new Error('Failed to retrieve all candidates with details.');
          }
        }
      );
    });
  }

  /**
   * Update candidate profile
   */
  async updateCandidate(candidateId: string, profileData: Partial<any>): Promise<any> {
    try {
      this.logger.log(`[CandidateService] Updating profile for candidate: ${candidateId}`);
      this.logger.log(`[CandidateService] Update data:`, profileData);

      // Check if candidate exists first
      const existingCandidate = await db('candidates').where('id', candidateId).first();
      if (!existingCandidate) {
        this.logger.error(`[CandidateService] Candidate not found: ${candidateId}`);
        throw new Error('Candidate not found. Please ensure you are properly registered.');
      }

      // Map camelCase fields to snake_case for database
      const dbUpdateData: any = {
        updated_at: new Date(),
      };

      // Map fields from camelCase to snake_case
      if (profileData.firstname !== undefined) dbUpdateData.firstname = profileData.firstname;
      if (profileData.surname !== undefined) dbUpdateData.surname = profileData.surname;
      if (profileData.othernames !== undefined) dbUpdateData.othernames = profileData.othernames;
      if (profileData.gender !== undefined) dbUpdateData.gender = profileData.gender;
      if (profileData.dob !== undefined) dbUpdateData.dob = profileData.dob;
      if (profileData.nationality !== undefined) dbUpdateData.nationality = profileData.nationality;
      if (profileData.state !== undefined) dbUpdateData.state = profileData.state;
      if (profileData.lga !== undefined) dbUpdateData.lga = profileData.lga;
      if (profileData.address !== undefined) dbUpdateData.address = profileData.address;
      if (profileData.email !== undefined) dbUpdateData.email = profileData.email;
      if (profileData.phone !== undefined) dbUpdateData.phone = profileData.phone;
      if (profileData.passportPhotoUrl !== undefined)
        dbUpdateData.passport_photo_url = profileData.passportPhotoUrl;
      if (profileData.signatureUrl !== undefined)
        dbUpdateData.signature_url = profileData.signatureUrl;
      if (profileData.department !== undefined) dbUpdateData.department = profileData.department;
      if (profileData.departmentId !== undefined)
        dbUpdateData.department_id = profileData.departmentId;
      if (profileData.modeOfEntry !== undefined)
        dbUpdateData.mode_of_entry = profileData.modeOfEntry;
      if (profileData.maritalStatus !== undefined)
        dbUpdateData.marital_status = profileData.maritalStatus;
      if (profileData.registrationCompleted !== undefined)
        dbUpdateData.registration_completed = profileData.registrationCompleted;
      if (profileData.biodataCompleted !== undefined)
        dbUpdateData.biodata_completed = profileData.biodataCompleted;
      if (profileData.educationCompleted !== undefined)
        dbUpdateData.education_completed = profileData.educationCompleted;
      if (profileData.nextOfKinCompleted !== undefined)
        dbUpdateData.next_of_kin_completed = profileData.nextOfKinCompleted;
      if (profileData.sponsorCompleted !== undefined)
        dbUpdateData.sponsor_completed = profileData.sponsorCompleted;
      if (profileData.admissionStatus !== undefined)
        dbUpdateData.admission_status = profileData.admissionStatus;
      if (profileData.paymentStatus !== undefined)
        dbUpdateData.payment_status = profileData.paymentStatus;
      if (profileData.rrr !== undefined) dbUpdateData.rrr = profileData.rrr;
      if (profileData.isFirstLogin !== undefined)
        dbUpdateData.is_first_login = profileData.isFirstLogin;
      if (profileData.isActive !== undefined) dbUpdateData.is_active = profileData.isActive;

      // Prevent JAMB number updates
      if (profileData.jambRegNo !== undefined) {
        this.logger.warn(
          `[CandidateService] Attempted to update JAMB number for candidate: ${candidateId}`
        );
        throw new Error('JAMB registration number cannot be updated.');
      }

      this.logger.log(`[CandidateService] Database update data:`, dbUpdateData);

      const [updatedCandidate] = await db('candidates')
        .where('id', candidateId)
        .update(dbUpdateData)
        .returning('*');

      if (!updatedCandidate) {
        this.logger.error(`[CandidateService] Failed to update candidate: ${candidateId}`);
        throw new Error('Failed to update candidate profile. Please try again.');
      }

      this.logger.log(`[CandidateService] Candidate updated successfully: ${candidateId}`);

      // Return the updated candidate with camelCase field names
      return this.mapCandidateFromDb(updatedCandidate);
    } catch (error) {
      this.logger.error('[CandidateService] Error updating candidate profile:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        'Failed to update candidate profile. Please ensure all required fields are provided and try again.'
      );
    }
  }

  /**
   * Map database candidate record to API format (snake_case to camelCase)
   */
  private mapCandidateFromDb(dbCandidate: any): any {
    return {
      id: dbCandidate.id,
      jambRegNo: dbCandidate.jamb_reg_no,
      firstname: dbCandidate.firstname,
      surname: dbCandidate.surname,
      othernames: dbCandidate.othernames,
      gender: dbCandidate.gender,
      dob: dbCandidate.dob,
      nationality: dbCandidate.nationality,
      state: dbCandidate.state,
      lga: dbCandidate.lga,
      address: dbCandidate.address,
      email: dbCandidate.email,
      phone: dbCandidate.phone,
      passportPhotoUrl: dbCandidate.passport_photo_url,
      signatureUrl: dbCandidate.signature_url,
      department: dbCandidate.department,
      departmentId: dbCandidate.department_id,
      modeOfEntry: dbCandidate.mode_of_entry,
      maritalStatus: dbCandidate.marital_status,
      registrationCompleted: dbCandidate.registration_completed,
      biodataCompleted: dbCandidate.biodata_completed,
      educationCompleted: dbCandidate.education_completed,
      nextOfKinCompleted: dbCandidate.next_of_kin_completed,
      sponsorCompleted: dbCandidate.sponsor_completed,
      admissionStatus: dbCandidate.admission_status,
      paymentStatus: dbCandidate.payment_status,
      rrr: dbCandidate.rrr,
      passwordHash: dbCandidate.password_hash,
      isFirstLogin: dbCandidate.is_first_login,
      isActive: dbCandidate.is_active,
      createdAt: dbCandidate.created_at,
      updatedAt: dbCandidate.updated_at,
    };
  }

  /**
   * Get next of kin information
   */
  async getNextOfKin(candidateId: string): Promise<NextOfKin | null> {
    try {
      this.logger.log(`[CandidateService] Getting NOK for candidate: ${candidateId}`);

      const nok = await db('next_of_kin').where('candidate_id', candidateId).first();

      return nok as NextOfKin | null;
    } catch (error) {
      this.logger.error('[CandidateService] Error getting next of kin:', error);
      throw new Error('Failed to retrieve next of kin information. Please try again later.');
    }
  }

  /**
   * Create or update next of kin information
   */
  async upsertNextOfKin(candidateId: string, nokData: Partial<NextOfKin>): Promise<NextOfKin> {
    try {
      this.logger.log(`[CandidateService] Upserting NOK for candidate: ${candidateId}`);

      const existingNok = await db('next_of_kin').where('candidate_id', candidateId).first();

      if (existingNok) {
        // Update existing
        const [updatedNok] = await db('next_of_kin')
          .where('id', existingNok.id)
          .update({
            ...nokData,
            updated_at: new Date(),
          })
          .returning('*');

        this.logger.log(`[CandidateService] NOK updated for candidate: ${candidateId}`);
        return updatedNok as NextOfKin;
      } else {
        // Create new
        const [newNok] = await db('next_of_kin')
          .insert({
            ...nokData,
            candidate_id: candidateId,
          })
          .returning('*');

        this.logger.log(`[CandidateService] NOK created for candidate: ${candidateId}`);
        return newNok as NextOfKin;
      }
    } catch (error) {
      this.logger.error('[CandidateService] Error upserting next of kin:', error);
      throw new Error(
        'Failed to save next of kin information. Please ensure all required fields are provided and try again.'
      );
    }
  }

  /**
   * Get sponsor information
   */
  async getSponsor(candidateId: string): Promise<Sponsor | null> {
    try {
      this.logger.log(`[CandidateService] Getting sponsor for candidate: ${candidateId}`);

      const sponsor = await db('sponsors').where('candidate_id', candidateId).first();

      return sponsor as Sponsor | null;
    } catch (error) {
      this.logger.error('[CandidateService] Error getting sponsor:', error);
      throw new Error('Failed to retrieve sponsor information. Please try again later.');
    }
  }

  /**
   * Create or update sponsor information
   */
  async upsertSponsor(candidateId: string, sponsorData: Partial<Sponsor>): Promise<Sponsor> {
    try {
      this.logger.log(`[CandidateService] Upserting sponsor for candidate: ${candidateId}`);

      const existingSponsor = await db('sponsors').where('candidate_id', candidateId).first();

      if (existingSponsor) {
        // Update existing
        const [updatedSponsor] = await db('sponsors')
          .where('id', existingSponsor.id)
          .update({
            ...sponsorData,
            updated_at: new Date(),
          })
          .returning('*');

        this.logger.log(`[CandidateService] Sponsor updated for candidate: ${candidateId}`);
        return updatedSponsor as Sponsor;
      } else {
        // Create new
        const [newSponsor] = await db('sponsors')
          .insert({
            ...sponsorData,
            candidate_id: candidateId,
          })
          .returning('*');

        this.logger.log(`[CandidateService] Sponsor created for candidate: ${candidateId}`);
        return newSponsor as Sponsor;
      }
    } catch (error) {
      this.logger.error('[CandidateService] Error upserting sponsor:', error);
      throw new Error(
        'Failed to save sponsor information. Please ensure all required fields are provided and try again.'
      );
    }
  }

  /**
   * Get education records
   */
  async getEducationRecords(candidateId: string): Promise<EducationRecord[]> {
    try {
      this.logger.log(`[CandidateService] Getting education records for candidate: ${candidateId}`);

      const records = await db('education_records')
        .where('candidate_id', candidateId)
        .orderBy('created_at', 'desc');

      return records as EducationRecord[];
    } catch (error) {
      this.logger.error('[CandidateService] Error getting education records:', error);
      throw new Error('Failed to get education records');
    }
  }

  /**
   * Create education record
   */
  async createEducationRecord(
    candidateId: string,
    educationData: Partial<EducationRecord>
  ): Promise<EducationRecord> {
    try {
      this.logger.log(`[CandidateService] Creating education record for candidate: ${candidateId}`);

      const [newRecord] = await db('education_records')
        .insert({
          ...educationData,
          candidate_id: candidateId,
        })
        .returning('*');

      this.logger.log(`[CandidateService] Education record created for candidate: ${candidateId}`);
      return newRecord as EducationRecord;
    } catch (error) {
      this.logger.error('[CandidateService] Error creating education record:', error);
      throw new Error('Failed to create education record');
    }
  }

  /**
   * Update education record
   */
  async updateEducationRecord(
    recordId: string,
    educationData: Partial<EducationRecord>
  ): Promise<EducationRecord> {
    try {
      this.logger.log(`[CandidateService] Updating education record: ${recordId}`);

      const [updatedRecord] = await db('education_records')
        .where('id', recordId)
        .update({
          ...educationData,
          updated_at: new Date(),
        })
        .returning('*');

      if (!updatedRecord) {
        logger.error('Education record not found during update', {
          module: 'candidate',
          operation: 'updateEducationRecord',
          metadata: { recordId },
        });
        throw new Error(
          'Education record not found. Please ensure the record exists before updating.'
        );
      }

      this.logger.log(`[CandidateService] Education record updated: ${recordId}`);
      return updatedRecord as EducationRecord;
    } catch (error) {
      this.logger.error('[CandidateService] Error updating education record:', error);
      throw new Error('Failed to update education record');
    }
  }

  /**
   * Delete education record
   */
  async deleteEducationRecord(recordId: string): Promise<void> {
    try {
      this.logger.log(`[CandidateService] Deleting education record: ${recordId}`);

      const deleted = await db('education_records').where('id', recordId).del();

      if (deleted === 0) {
        logger.error('Education record not found during deletion', {
          module: 'candidate',
          operation: 'deleteEducationRecord',
          metadata: { recordId },
        });
        throw new Error(
          'Education record not found. Please ensure the record exists before deleting.'
        );
      }

      this.logger.log(`[CandidateService] Education record deleted: ${recordId}`);
    } catch (error) {
      this.logger.error('[CandidateService] Error deleting education record:', error);
      throw new Error('Failed to delete education record');
    }
  }

  /**
   * Get profile completion status
   */
  async getProfileCompletionStatus(candidateId: string): Promise<any> {
    try {
      this.logger.log(
        `[CandidateService] Getting profile completion status for candidate: ${candidateId}`
      );

      // Check each section
      const candidate = await db('candidates').where('id', candidateId).first();
      const [nok] = await db('next_of_kin').where('candidate_id', candidateId);
      const [sponsor] = await db('sponsors').where('candidate_id', candidateId);
      const [education] = await db('education_records').where('candidate_id', candidateId);
      // Calculate completion percentages
      const profileComplete = !!(
        candidate?.surname &&
        candidate?.firstname &&
        candidate?.gender &&
        candidate?.dob
      );
      const nokComplete = !!(nok?.surname && nok?.firstname && nok?.phone);
      const sponsorComplete = !!(sponsor?.surname && sponsor?.firstname && sponsor?.phone);
      const educationComplete = !!education;

      const overall = [
        profileComplete ? 25 : 0,
        nokComplete ? 25 : 0,
        sponsorComplete ? 25 : 0,
        educationComplete ? 25 : 0,
      ].reduce((sum, score) => sum + score, 0);

      const status: any = {
        candidate: profileComplete,
        nextOfKin: nokComplete,
        sponsor: sponsorComplete,
        education: educationComplete,
        overall,
      };

      this.logger.log(
        `[CandidateService] Profile completion: ${overall}% for candidate: ${candidateId}`
      );
      return status;
    } catch (error) {
      this.logger.error('[CandidateService] Error getting profile completion status:', error);
      throw new Error('Failed to get profile completion status');
    }
  }

  /**
   * Get candidate dashboard data
   */
  async getCandidateDashboard(candidateId: string) {
    try {
      this.logger.log(`[CandidateService] Getting dashboard data for candidate: ${candidateId}`);

      const [profile, nok, sponsor, educationRecords, applications, payments, completionStatus] =
        await Promise.all([
          this.getCandidateProfile(candidateId),
          this.getNextOfKin(candidateId),
          this.getSponsor(candidateId),
          this.getEducationRecords(candidateId),
          db('applications').where('candidate_id', candidateId).first(),
          db('payments').where('candidate_id', candidateId).orderBy('created_at', 'desc'),
          this.getProfileCompletionStatus(candidateId),
        ]);

      return {
        profile,
        nextOfKin: nok,
        sponsor,
        educationRecords,
        application: applications,
        payments,
        completionStatus,
      };
    } catch (error) {
      this.logger.error('[CandidateService] Error getting candidate dashboard:', error);
      throw new Error('Failed to get candidate dashboard data');
    }
  }

  // Application management methods
  async createApplication(candidateId: string, applicationData: any): Promise<any> {
    return withPerformanceLogging(
      'createApplication',
      async () => {
        return withDatabaseLogging(
          'INSERT',
          'applications',
          async () => {
            const [application] = await db('applications')
              .insert({
                candidate_id: candidateId,
                session: applicationData.session,
                programme_code: applicationData.programmeCode,
                department_code: applicationData.departmentCode,
                status: 'pending', // Use valid enum value from decision_status
                submitted_at: new Date(),
                created_at: new Date(),
                updated_at: new Date(),
              })
              .returning('*');

            logger.info('Application created successfully', {
              module: 'candidates',
              operation: 'createApplication',
              metadata: { candidateId, applicationId: application.id },
            });

            return application;
          },
          { metadata: { candidateId, session: applicationData.session } }
        );
      },
      { metadata: { candidateId } }
    );
  }

  async getApplication(candidateId: string): Promise<any> {
    return withPerformanceLogging(
      'getApplication',
      async () => {
        return withDatabaseLogging(
          'SELECT',
          'applications',
          async () => {
            try {
              logger.info('Getting application for candidate', {
                module: 'candidates',
                operation: 'getApplication',
                metadata: { candidateId },
              });

              const application = await db('applications')
                .where('candidate_id', candidateId)
                .orderBy('created_at', 'desc')
                .first();

              if (application) {
                logger.info('Application retrieved successfully', {
                  module: 'candidates',
                  operation: 'getApplication',
                  metadata: { candidateId, applicationId: application.id, found: true },
                });
              } else {
                logger.info('No application found for candidate', {
                  module: 'candidates',
                  operation: 'getApplication',
                  metadata: { candidateId, found: false },
                });
              }

              return application;
            } catch (error) {
              logger.error('Failed to get application', {
                module: 'candidates',
                operation: 'getApplication',
                metadata: { candidateId },
                error: error instanceof Error ? error.message : String(error),
              });
              throw new Error('Failed to get application');
            }
          },
          { metadata: { candidateId } }
        );
      },
      { metadata: { candidateId } }
    );
  }

  async updateApplication(
    candidateId: string,
    updateData: {
      programChoice1?: string;
      programChoice2?: string;
      programChoice3?: string;
      jambScore?: number;
    }
  ): Promise<any> {
    return withPerformanceLogging(
      'updateApplication',
      async () => {
        return withDatabaseLogging(
          'UPDATE',
          'candidates,applications',
          async () => {
            try {
              logger.info('Updating application for candidate', {
                module: 'candidates',
                operation: 'updateApplication',
                metadata: { candidateId, updates: updateData },
              });

              // Update the candidate's program choices and JAMB score
              if (
                updateData.programChoice1 ||
                updateData.programChoice2 ||
                updateData.programChoice3 ||
                updateData.jambScore
              ) {
                const candidateUpdates: any = {};

                if (updateData.programChoice1)
                  candidateUpdates.program_choice_1 = updateData.programChoice1;
                if (updateData.programChoice2)
                  candidateUpdates.program_choice_2 = updateData.programChoice2;
                if (updateData.programChoice3)
                  candidateUpdates.program_choice_3 = updateData.programChoice3;
                if (updateData.jambScore) candidateUpdates.jamb_score = updateData.jambScore;

                await db('candidates').where('id', candidateId).update(candidateUpdates);
              }

              // Update the application's programme and department codes
              const applicationUpdates: any = {};
              if (updateData.programChoice1) {
                applicationUpdates.programme_code = updateData.programChoice1;
              }
              if (updateData.programChoice2) {
                applicationUpdates.department_code = updateData.programChoice2;
              }

              if (Object.keys(applicationUpdates).length > 0) {
                await db('applications')
                  .where('candidate_id', candidateId)
                  .update(applicationUpdates);
              }

              logger.info('Application updated successfully', {
                module: 'candidates',
                operation: 'updateApplication',
                metadata: { candidateId, updates: updateData },
              });

              // Return the updated application
              return this.getApplication(candidateId);
            } catch (error) {
              logger.error('Failed to update application', {
                module: 'candidates',
                operation: 'updateApplication',
                metadata: { candidateId, updates: updateData },
                error: error instanceof Error ? error.message : String(error),
              });
              throw new Error('Failed to update application');
            }
          },
          { metadata: { candidateId, updates: updateData } }
        );
      },
      { metadata: { candidateId } }
    );
  }

  // Registration form methods
  async getRegistrationFormData(candidateId: string): Promise<any> {
    try {
      this.logger.log(
        `[CandidateService] Getting registration form data for candidate: ${candidateId}`
      );

      // Get all candidate data for form
      const candidate = await db('candidates').where('id', candidateId).first();
      const nextOfKin = await db('next_of_kin').where('candidate_id', candidateId).first();
      const sponsor = await db('sponsors').where('candidate_id', candidateId).first();
      const education = await db('education_records').where('candidate_id', candidateId);
      const application = await db('applications').where('candidate_id', candidateId).first();

      return {
        candidate,
        nextOfKin,
        sponsor,
        education,
        application,
      };
    } catch (error) {
      this.logger.error('[CandidateService] Error getting registration form data:', error);
      throw new Error('Failed to get registration form data');
    }
  }

  // Admission and matriculation methods
  async getAdmissionStatus(candidateId: string): Promise<any> {
    try {
      this.logger.log(`[CandidateService] Getting admission status for candidate: ${candidateId}`);

      const admission = await db('admissions')
        .where('candidate_id', candidateId)
        .orderBy('created_at', 'desc')
        .first();

      if (!admission) {
        return {
          status: 'not_applied',
          message: 'No admission application found',
        };
      }

      return {
        status: admission.decision,
        decisionDate: admission.decision_date,
        remarks: admission.remarks,
        applicationId: admission.id,
      };
    } catch (error) {
      this.logger.error('[CandidateService] Error getting admission status:', error);
      throw new Error('Failed to get admission status');
    }
  }

  async generateAdmissionLetterPDF(candidateId: string): Promise<Buffer> {
    try {
      this.logger.log(
        `[CandidateService] Generating admission letter for candidate: ${candidateId}`
      );

      // Get candidate and admission data
      const [candidate, admission] = await Promise.all([
        db('candidates').where('id', candidateId).first(),
        db('admissions').where('candidate_id', candidateId).orderBy('created_at', 'desc').first(),
      ]);

      if (!candidate) {
        throw new Error('Candidate not found for admission letter generation');
      }

      if (!admission) {
        throw new Error('No admission record found for this candidate');
      }

      // Generate PDF using the PDF service
      const pdfBuffer = await this.pdfService.generateAdmissionLetterPDF(
        `${candidate.firstname} ${candidate.surname}`,
        candidate.jamb_reg_no,
        admission
      );

      this.logger.log(
        `[CandidateService] Admission letter generated successfully for candidate: ${candidateId}`
      );
      return pdfBuffer;
    } catch (error) {
      this.logger.error('[CandidateService] Error generating admission letter:', error);
      throw new Error('Failed to generate admission letter. Please try again later.');
    }
  }

  async getMatricNumber(candidateId: string): Promise<any> {
    try {
      this.logger.log(`[CandidateService] Getting matric number for candidate: ${candidateId}`);

      const student = await db('candidates')
        .join('students', 'candidates.id', '=', 'students.candidate_id')
        .where('candidates.id', candidateId)
        .select(
          'students.matric_no',
          'students.dept_code',
          'students.session',
          'students.created_at'
        )
        .first();

      if (!student) {
        return null;
      }

      return {
        matricNo: student.matric_no,
        departmentCode: student.dept_code,
        session: student.session,
        matriculatedAt: student.created_at,
      };
    } catch (error) {
      this.logger.error('[CandidateService] Error getting matric number:', error);
      throw new Error('Failed to get matric number');
    }
  }

  async getMigrationStatus(candidateId: string): Promise<any> {
    try {
      this.logger.log(`[CandidateService] Getting migration status for candidate: ${candidateId}`);

      const migration = await db('migrations')
        .join('students', 'migrations.student_id', '=', 'students.id')
        .join('candidates', 'students.candidate_id', '=', 'candidates.id')
        .where('candidates.id', candidateId)
        .select('migrations.*')
        .first();

      if (!migration) {
        return {
          status: 'not_migrated',
          message: 'No migration record found',
        };
      }

      return {
        status: migration.status,
        attempts: migration.attempts,
        lastError: migration.last_error,
        pushedAt: migration.pushed_at,
        createdAt: migration.created_at,
      };
    } catch (error) {
      this.logger.error('[CandidateService] Error getting migration status:', error);
      throw new Error('Failed to get migration status');
    }
  }

  async getCandidateStatus(candidateId: string): Promise<any> {
    try {
      this.logger.log(`[CandidateService] Getting status for candidate: ${candidateId}`);

      // Get comprehensive status information using new simplified schema
      const [candidate, application, payments] = await Promise.all([
        db('candidates').where('id', candidateId).first(),
        db('applications').where('candidate_id', candidateId).first(),
        db('payments').where('candidate_id', candidateId).orderBy('created_at', 'desc'),
      ]);

      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Calculate overall status based on new schema
      let overallStatus = 'not_started';

      if (candidate.registration_completed) {
        overallStatus = 'registration_complete';
      } else if (candidate.sponsor_completed) {
        overallStatus = 'sponsor_complete';
      } else if (candidate.next_of_kin_completed) {
        overallStatus = 'next_of_kin_complete';
      } else if (candidate.education_completed) {
        overallStatus = 'education_complete';
      } else if (candidate.biodata_completed) {
        overallStatus = 'biodata_complete';
      }

      return {
        overallStatus,
        profile: candidate.registration_completed ? 'complete' : 'incomplete',
        application: application ? 'submitted' : 'not_submitted',
        admission: candidate.admission_status || 'not_applied',
        payments: payments.length > 0 ? 'has_payments' : 'no_payments',
        biodata: candidate.biodata_completed ? 'complete' : 'incomplete',
        education: candidate.education_completed ? 'complete' : 'incomplete',
        nextOfKin: candidate.next_of_kin_completed ? 'complete' : 'incomplete',
        sponsor: candidate.sponsor_completed ? 'complete' : 'incomplete',
        lastUpdated: candidate.updated_at,
      };
    } catch (error) {
      this.logger.error('[CandidateService] Error getting candidate status:', error);
      throw new Error('Failed to get candidate status');
    }
  }

  /**
   * Finalize registration and send completion email
   */
  async finalizeRegistration(candidateId: string): Promise<{
    success: boolean;
    message: string;
    applicationId?: string;
  }> {
    return await withDatabaseLogging('finalizeRegistration', 'candidates', async () => {
      try {
        // Check if all required information is complete
        const candidate = await db('candidates').where('id', candidateId).first();

        if (
          !candidate?.biodata_completed ||
          !candidate?.education_completed ||
          !candidate?.next_of_kin_completed ||
          !candidate?.sponsor_completed
        ) {
          return {
            success: false,
            message: 'All profile sections must be completed before finalizing registration',
          };
        }

        // Create application
        const [applicationId] = await db('applications')
          .insert({
            candidate_id: candidateId,
            status: 'pending',
            created_at: new Date(),
            updated_at: new Date(),
          })
          .returning('id');

        // Mark registration as complete
        await db('candidates').where('id', candidateId).update({
          registration_completed: true,
          updated_at: new Date(),
        });

        // Send completion email
        if (candidate && candidate.email) {
          await this.emailService.sendRegistrationCompletion(
            candidate.email,
            candidate.firstname || candidate.surname || 'Candidate',
            candidate.jamb_reg_no
          );
        }

        logger.info('Registration finalized successfully', {
          module: 'candidate',
          operation: 'finalizeRegistration',
          metadata: { candidateId, applicationId },
        });

        return {
          success: true,
          message: 'Registration completed successfully. Check your email for confirmation.',
          applicationId,
        };
      } catch (error) {
        logger.error('Failed to finalize registration', {
          module: 'candidate',
          operation: 'finalizeRegistration',
          metadata: { candidateId },
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });
  }

  /**
   * Get available payment purposes for candidate's session and level
   */
  async getAvailablePaymentPurposes(candidateId: string): Promise<{
    success: boolean;
    data: PaymentPurpose[];
    message: string;
  }> {
    return await withDatabaseLogging(
      'getAvailablePaymentPurposes',
      'payment_purposes',
      async () => {
        try {
          // Get candidate's application to determine session and level
          const application = await db('applications').where('candidate_id', candidateId).first();

          if (!application) {
            return {
              success: false,
              data: [],
              message: 'No application found. Please submit your application first.',
            };
          }

          // Get candidate's information to determine mode_of_entry
          const candidate = await db('candidates').where('id', candidateId).first();
          if (!candidate) {
            return {
              success: false,
              data: [],
              message: 'Candidate not found.',
            };
          }

          // Get Candidate's department to determine faculty
          const department = await db('departments').where('id', candidate.departmentId).first();

          // Determine level - for new candidates, default to 100 level
          const level = candidate?.level || application?.level || '100';
          const session = application.session;

          // Fetch available payment purposes for this session, level and faculty
          const paymentPurposes = await db('payment_purposes')
            .where('session', session)
            .andWhere('level', level)
            .andWhere('faculty', department?.facultyId)
            .andWhere('is_active', true)
            .orderBy(['purpose', 'amount']);

          logger.info('Payment purposes retrieved successfully', {
            module: 'candidate',
            operation: 'getAvailablePaymentPurposes',
            metadata: { candidateId, session, level, count: paymentPurposes.length },
          });

          return {
            success: true,
            data: paymentPurposes.map((pp) => ({
              id: pp.id,
              name: pp.name,
              purpose: pp.purpose,
              description: pp.description,
              amount: pp.amount,
              session: pp.session,
              level: pp.level,
              faculty: pp.faculty,
              createdAt: pp.created_at,
              updatedAt: pp.updated_at,
              isActive: pp.is_active,
            })),
            message: `Found ${paymentPurposes.length} available payment purposes for ${session} session, level ${level}`,
          };
        } catch (error) {
          logger.error('Failed to get available payment purposes', {
            module: 'candidate',
            operation: 'getAvailablePaymentPurposes',
            metadata: { candidateId },
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      }
    );
  }
}
