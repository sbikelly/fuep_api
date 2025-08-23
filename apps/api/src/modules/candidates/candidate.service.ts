import { Education, NextOfKin, Profile, ProfileCompletionStatus, Sponsor } from '@fuep/types';

import { db } from '../../db/knex.js';
import { logger, withDatabaseLogging, withPerformanceLogging } from '../../middleware/logging.js';
import { EmailService } from '../../services/email.service.js';
import { PasswordUtils } from '../../utils/password.utils.js';

// Additional interfaces for candidate module
export interface Candidate {
  id: string;
  jambRegNo: string;
  username: string;
  email: string;
  phone: string;
  programChoice1?: string;
  programChoice2?: string;
  programChoice3?: string;
  jambScore?: number;
  stateOfOrigin?: string;
  applicationStatus?: string;
  paymentStatus?: string;
  admissionStatus?: string;
  profile?: {
    surname?: string;
    firstname?: string;
    othernames?: string;
    gender?: string;
    dateOfBirth?: Date;
    address?: string;
    state?: string;
    lga?: string;
    city?: string;
    nationality?: string;
    maritalStatus?: string;
  } | null;
  application?: {
    id: string;
    session: string;
    programmeCode?: string;
    departmentCode?: string;
    status: string;
  } | null;
  admission?: {
    id: string;
    decision: string;
    decidedAt?: Date;
    notes?: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  id: string;
  candidate_id: string;
  session: string;
  programme_code?: string;
  department_code?: string;
  status: string;
  submitted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CandidateStatus {
  candidateId: string;
  jambRegNo: string;
  username: string;
  email: string;
  programChoice1?: string;
  programChoice2?: string;
  programChoice3?: string;
  jambScore?: number;
  stateOfOrigin?: string;
  applicationStatus?: string;
  paymentStatus?: string;
  admissionStatus?: string;
  payments: Array<{
    purpose: string;
    amount: number;
    status: string;
    date: Date;
  }>;
  documents: Array<{
    type: string;
    status: string;
    uploadedAt: Date;
  }>;
  education: Array<{
    level: string;
    examType?: string;
    year?: string;
    school?: string;
  }>;
  createdAt: Date;
}

export class CandidateService {
  private logger: Console;
  private emailService: EmailService;

  constructor(logger: Console = console) {
    this.logger = logger;
    this.emailService = new EmailService();
  }

  /**
   * Get candidate by JAMB registration number
   */
  async getCandidateByJambRegNo(jambRegNo: string): Promise<Candidate | null> {
    return withPerformanceLogging(
      'getCandidateByJambRegNo',
      async () => {
        return withDatabaseLogging(
          'SELECT',
          'candidates',
          async () => {
            // Get candidate from database
            const candidate = await db('candidates').where('jamb_reg_no', jambRegNo).first();

            if (!candidate) {
              logger.info('Candidate not found by JAMB reg no', {
                module: 'candidates',
                operation: 'getCandidateByJambRegNo',
                metadata: { jambRegNo, found: false },
              });
              return null;
            }

            // Get additional data from related tables
            const profile = await db('profiles').where('candidate_id', candidate.id).first();
            const application = await db('applications')
              .where('candidate_id', candidate.id)
              .first();
            const admission = await db('admissions').where('candidate_id', candidate.id).first();

            const candidateData: Candidate = {
              id: candidate.id,
              jambRegNo: candidate.jamb_reg_no,
              username: candidate.username,
              email: candidate.email,
              phone: candidate.phone,
              programChoice1: candidate.program_choice_1,
              programChoice2: candidate.program_choice_2,
              programChoice3: candidate.program_choice_3,
              jambScore: candidate.jamb_score,
              stateOfOrigin: candidate.state_of_origin,
              applicationStatus: candidate.application_status,
              paymentStatus: candidate.payment_status,
              admissionStatus: candidate.admission_status,
              profile: profile
                ? {
                    surname: profile.surname,
                    firstname: profile.firstname,
                    othernames: profile.othernames,
                    gender: profile.gender,
                    dateOfBirth: profile.dob,
                    address: profile.address,
                    state: profile.state,
                    lga: profile.lga,
                    city: profile.city,
                    nationality: profile.nationality,
                    maritalStatus: profile.marital_status,
                  }
                : null,
              application: application
                ? {
                    id: application.id,
                    session: application.session,
                    programmeCode: application.programme_code,
                    departmentCode: application.department_code,
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

            logger.info('Candidate found by JAMB reg no', {
              module: 'candidates',
              operation: 'getCandidateByJambRegNo',
              metadata: { jambRegNo, candidateId: candidate.id, found: true },
            });

            return candidateData;
          },
          { metadata: { jambRegNo } }
        );
      },
      { metadata: { jambRegNo } }
    );
  }

  /**
   * Get candidate profile with JAMB prefill data
   */
  async getCandidateProfile(jambRegNo: string): Promise<Profile | null> {
    return withPerformanceLogging(
      'getCandidateProfile',
      async () => {
        return withDatabaseLogging(
          'SELECT',
          'candidates,profiles,jamb_prelist',
          async () => {
            try {
              logger.info('Getting candidate profile', {
                module: 'candidates',
                operation: 'getCandidateProfile',
                metadata: { jambRegNo },
              });

              // First check if candidate exists
              const candidate = await db('candidates').where('jamb_reg_no', jambRegNo).first();

              if (!candidate) {
                logger.info('Candidate not found for profile', {
                  module: 'candidates',
                  operation: 'getCandidateProfile',
                  metadata: { jambRegNo, found: false },
                });
                return null;
              }

              // Get profile data
              const profile = await db('profiles').where('candidate_id', candidate.id).first();

              // Get JAMB prelist data for prefill
              const jambData = await db('jamb_prelist').where('jamb_reg_no', jambRegNo).first();

              if (profile) {
                // Merge with JAMB data for prefill
                const result = {
                  ...profile,
                  candidateId: candidate.id,
                  surname: profile.surname || jambData?.surname,
                  firstname: profile.firstname || jambData?.firstname,
                  othernames: profile.othernames || jambData?.othernames,
                  gender: profile.gender || jambData?.gender,
                  state: profile.state || jambData?.state_of_origin,
                  lga: profile.lga || jambData?.lga_of_origin,
                };

                logger.info('Profile retrieved successfully', {
                  module: 'candidates',
                  operation: 'getCandidateProfile',
                  metadata: { jambRegNo, candidateId: candidate.id, found: true, hasProfile: true },
                });

                return result;
              } else {
                // Create profile from JAMB data
                const newProfile: Partial<Profile> = {
                  candidateId: candidate.id,
                  surname: jambData?.surname,
                  firstname: jambData?.firstname,
                  othernames: jambData?.othernames,
                  gender: jambData?.gender,
                  state: jambData?.state_of_origin,
                  lga: jambData?.lga_of_origin,
                };

                const [insertedProfile] = await db('profiles').insert(newProfile).returning('*');

                logger.info('New profile created from JAMB data', {
                  module: 'candidates',
                  operation: 'getCandidateProfile',
                  metadata: {
                    jambRegNo,
                    candidateId: candidate.id,
                    found: true,
                    hasProfile: false,
                    created: true,
                  },
                });

                return insertedProfile as Profile;
              }
            } catch (error) {
              logger.error('Failed to get candidate profile', {
                module: 'candidates',
                operation: 'getCandidateProfile',
                metadata: { jambRegNo },
                error: error instanceof Error ? error.message : String(error),
              });
              throw new Error('Failed to get candidate profile');
            }
          },
          { metadata: { jambRegNo } }
        );
      },
      { metadata: { jambRegNo } }
    );
  }

  /**
   * Update candidate profile
   */
  async updateCandidateProfile(
    candidateId: string,
    profileData: Partial<Profile>
  ): Promise<Profile> {
    try {
      this.logger.log(`[CandidateService] Updating profile for candidate: ${candidateId}`);

      const [updatedProfile] = await db('profiles')
        .where('candidate_id', candidateId)
        .update({
          ...profileData,
          updated_at: new Date(),
        })
        .returning('*');

      if (!updatedProfile) {
        throw new Error('Profile not found');
      }

      this.logger.log(
        `[CandidateService] Profile updated successfully for candidate: ${candidateId}`
      );
      return updatedProfile as Profile;
    } catch (error) {
      this.logger.error('[CandidateService] Error updating candidate profile:', error);
      throw new Error('Failed to update candidate profile');
    }
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
      throw new Error('Failed to get next of kin information');
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
      throw new Error('Failed to save next of kin information');
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
      throw new Error('Failed to get sponsor information');
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
      throw new Error('Failed to save sponsor information');
    }
  }

  /**
   * Get education records
   */
  async getEducationRecords(candidateId: string): Promise<Education[]> {
    try {
      this.logger.log(`[CandidateService] Getting education records for candidate: ${candidateId}`);

      const records = await db('education_records')
        .where('candidate_id', candidateId)
        .orderBy('created_at', 'desc');

      return records as Education[];
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
    educationData: Partial<Education>
  ): Promise<Education> {
    try {
      this.logger.log(`[CandidateService] Creating education record for candidate: ${candidateId}`);

      const [newRecord] = await db('education_records')
        .insert({
          ...educationData,
          candidate_id: candidateId,
        })
        .returning('*');

      this.logger.log(`[CandidateService] Education record created for candidate: ${candidateId}`);
      return newRecord as Education;
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
    educationData: Partial<Education>
  ): Promise<Education> {
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
        throw new Error('Education record not found');
      }

      this.logger.log(`[CandidateService] Education record updated: ${recordId}`);
      return updatedRecord as Education;
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
        throw new Error('Education record not found');
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
  async getProfileCompletionStatus(candidateId: string): Promise<ProfileCompletionStatus> {
    try {
      this.logger.log(
        `[CandidateService] Getting profile completion status for candidate: ${candidateId}`
      );

      // Check each section
      const [profile] = await db('profiles').where('candidate_id', candidateId);
      const [nok] = await db('next_of_kin').where('candidate_id', candidateId);
      const [sponsor] = await db('sponsors').where('candidate_id', candidateId);
      const [education] = await db('education_records').where('candidate_id', candidateId);
      const [uploads] = await db('uploads').where('candidate_id', candidateId);

      // Calculate completion percentages
      const profileComplete = !!(
        profile?.surname &&
        profile?.firstname &&
        profile?.gender &&
        profile?.dob
      );
      const nokComplete = !!(nok?.name && nok?.relation && nok?.phone);
      const sponsorComplete = !!(sponsor?.name && sponsor?.phone);
      const educationComplete = !!education;
      const documentsComplete = !!uploads;

      const overall = [
        profileComplete ? 20 : 0,
        nokComplete ? 20 : 0,
        sponsorComplete ? 20 : 0,
        educationComplete ? 20 : 0,
        documentsComplete ? 20 : 0,
      ].reduce((sum, score) => sum + score, 0);

      const status: ProfileCompletionStatus = {
        candidate: profileComplete,
        nextOfKin: nokComplete,
        sponsor: sponsorComplete,
        education: educationComplete,
        documents: documentsComplete,
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

      const [
        profile,
        nok,
        sponsor,
        educationRecords,
        uploads,
        applications,
        payments,
        completionStatus,
      ] = await Promise.all([
        this.getCandidateProfile(candidateId),
        this.getNextOfKin(candidateId),
        this.getSponsor(candidateId),
        this.getEducationRecords(candidateId),
        db('uploads').where('candidate_id', candidateId),
        db('applications').where('candidate_id', candidateId).first(),
        db('payments').where('candidate_id', candidateId).orderBy('created_at', 'desc'),
        this.getProfileCompletionStatus(candidateId),
      ]);

      return {
        profile,
        nextOfKin: nok,
        sponsor,
        educationRecords,
        uploads,
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
      const profile = await db('profiles').where('candidate_id', candidateId).first();
      const nextOfKin = await db('next_of_kin').where('candidate_id', candidateId).first();
      const sponsor = await db('sponsors').where('candidate_id', candidateId).first();
      const education = await db('education_records').where('candidate_id', candidateId);
      const application = await db('applications').where('candidate_id', candidateId).first();

      return {
        candidate,
        profile,
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

  async generateRegistrationFormPDF(candidateId: string): Promise<Buffer> {
    try {
      this.logger.log(`[CandidateService] Generating PDF for candidate: ${candidateId}`);

      // TODO: Implement actual PDF generation
      // For now, return a mock PDF buffer
      const mockPdfContent = `Registration Form for Candidate ${candidateId}`;
      return Buffer.from(mockPdfContent, 'utf-8');
    } catch (error) {
      this.logger.error('[CandidateService] Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
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

      // TODO: Implement actual PDF generation with admission letter template
      // For now, return a mock PDF buffer
      const mockPdfContent = `Admission Letter for Candidate ${candidateId}`;
      return Buffer.from(mockPdfContent, 'utf-8');
    } catch (error) {
      this.logger.error('[CandidateService] Error generating admission letter:', error);
      throw new Error('Failed to generate admission letter');
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

      // Get comprehensive status information
      const [profile, application, admission, payments, student, migration] = await Promise.all([
        db('profiles').where('candidate_id', candidateId).first(),
        db('applications').where('candidate_id', candidateId).first(),
        db('admissions').where('candidate_id', candidateId).first(),
        db('payments').where('candidate_id', candidateId).orderBy('created_at', 'desc'),
        db('students').where('candidate_id', candidateId).first(),
        db('migrations')
          .join('students', 'migrations.student_id', '=', 'students.id')
          .where('students.candidate_id', candidateId)
          .first(),
      ]);

      // Calculate overall status
      let overallStatus = 'not_started';

      if (profile) overallStatus = 'profile_complete';
      if (application) overallStatus = 'application_submitted';
      if (admission && admission.decision === 'admitted') overallStatus = 'admitted';
      if (student) overallStatus = 'matriculated';
      if (migration && migration.status === 'success') overallStatus = 'migrated';

      return {
        overallStatus,
        profile: profile ? 'complete' : 'incomplete',
        application: application ? 'submitted' : 'not_submitted',
        admission: admission ? admission.decision : 'not_applied',
        payments: payments.length > 0 ? 'has_payments' : 'no_payments',
        matriculation: student ? 'matriculated' : 'not_matriculated',
        migration: migration ? migration.status : 'not_migrated',
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error('[CandidateService] Error getting candidate status:', error);
      throw new Error('Failed to get candidate status');
    }
  }

  /**
   * Check JAMB registration number and initiate registration
   */
  async checkJambAndInitiateRegistration(
    jambRegNo: string,
    contactInfo: {
      email: string;
      phone: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    candidateId?: string;
    nextStep?: string;
    requiresContactUpdate?: boolean;
  }> {
    return await withDatabaseLogging('checkJambAndInitiateRegistration', 'candidates', async () => {
      try {
        // Check if candidate already exists
        const existingCandidate = await db('candidates').where('jamb_reg_no', jambRegNo).first();

        if (existingCandidate) {
          // Check if candidate has completed registration
          if (existingCandidate.registration_completed) {
            return {
              success: false,
              message: 'Candidate has already completed registration',
              nextStep: 'login',
            };
          }

          // Check if contact info needs update
          const profile = await db('profiles').where('candidate_id', existingCandidate.id).first();

          if (!profile?.email || !profile?.phone) {
            return {
              success: false,
              message: 'Contact information required',
              candidateId: existingCandidate.id,
              nextStep: 'complete_contact',
              requiresContactUpdate: true,
            };
          }

          return {
            success: true,
            message: 'Candidate found, proceed with registration',
            candidateId: existingCandidate.id,
            nextStep: 'payment',
          };
        }

        // Create new candidate account with temporary password
        const temporaryPassword = PasswordUtils.generateTemporaryPassword();
        const hashedPassword = await PasswordUtils.hashPassword(temporaryPassword);

        const [candidateId] = await db('candidates')
          .insert({
            jamb_reg_no: jambRegNo,
            username: jambRegNo,
            email: contactInfo.email,
            phone: contactInfo.phone,
            password_hash: hashedPassword,
            temp_password_flag: true,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .returning('id');

        // Send temporary password email
        const emailSent = await this.emailService.sendTemporaryPassword(
          contactInfo.email,
          jambRegNo,
          temporaryPassword,
          'Candidate' // Will be updated when biodata is provided
        );

        if (!emailSent) {
          logger.warn('Failed to send temporary password email', {
            module: 'candidate',
            operation: 'checkJambAndInitiateRegistration',
            metadata: { candidateId, email: contactInfo.email },
          });
        }

        logger.info('New candidate account created successfully', {
          module: 'candidate',
          operation: 'checkJambAndInitiateRegistration',
          metadata: { candidateId, jambRegNo, email: contactInfo.email },
        });

        return {
          success: true,
          message: 'Account created successfully. Check your email for login credentials.',
          candidateId,
          nextStep: 'payment',
        };
      } catch (error) {
        logger.error('Failed to check JAMB and initiate registration', {
          module: 'candidate',
          operation: 'checkJambAndInitiateRegistration',
          metadata: { jambRegNo, contactInfo },
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });
  }

  /**
   * Complete contact information for existing candidate
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
  }> {
    return await withDatabaseLogging('completeContactInfo', 'profiles', async () => {
      try {
        // Check if candidate exists
        const candidate = await db('candidates').where('id', candidateId).first();

        if (!candidate) {
          return {
            success: false,
            message: 'Candidate not found',
          };
        }

        // Update candidate contact information
        await db('candidates').where('id', candidateId).update({
          email: contactInfo.email,
          phone: contactInfo.phone,
          updated_at: new Date(),
        });

        // If candidate has temp password, send email
        if (candidate.temp_password_flag) {
          const tempPassword = PasswordUtils.generateTemporaryPassword();
          const hashedPassword = await PasswordUtils.hashPassword(tempPassword);

          // Update password
          await db('candidates').where('id', candidateId).update({
            password_hash: hashedPassword,
            updated_at: new Date(),
          });

          // Send email
          await this.emailService.sendTemporaryPassword(
            contactInfo.email,
            candidate.jamb_reg_no,
            tempPassword,
            'Candidate'
          );
        }

        logger.info('Contact information completed successfully', {
          module: 'candidate',
          operation: 'completeContactInfo',
          metadata: { candidateId, contactInfo },
        });

        return {
          success: true,
          message: 'Contact information updated successfully',
          nextStep: 'payment',
        };
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
   * Get next step in registration process
   */
  async getNextStep(candidateId: string): Promise<{
    success: boolean;
    nextStep: string;
    message: string;
    completedSteps: string[];
    remainingSteps: string[];
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

        const profile = await db('profiles').where('candidate_id', candidateId).first();

        const application = await db('applications').where('candidate_id', candidateId).first();

        const completedSteps: string[] = [];
        const remainingSteps: string[] = [];

        // Check completed steps
        if (candidate.email && candidate.phone) {
          completedSteps.push('contact_info');
        } else {
          remainingSteps.push('contact_info');
        }

        if (candidate.post_utme_paid) {
          completedSteps.push('post_utme_payment');
        } else {
          remainingSteps.push('post_utme_payment');
        }

        if (profile?.biodata_completed) {
          completedSteps.push('biodata');
        } else {
          remainingSteps.push('biodata');
        }

        if (profile?.education_completed) {
          completedSteps.push('education');
        } else {
          remainingSteps.push('education');
        }

        if (profile?.next_of_kin_completed) {
          completedSteps.push('next_of_kin');
        } else {
          remainingSteps.push('next_of_kin');
        }

        if (profile?.sponsor_completed) {
          completedSteps.push('sponsor');
        } else {
          remainingSteps.push('sponsor');
        }

        if (application?.status === 'pending') {
          completedSteps.push('application_submission');
        } else {
          remainingSteps.push('application_submission');
        }

        // Determine next step
        let nextStep = 'contact_info';
        let message = 'Please provide your contact information';

        if (completedSteps.includes('contact_info')) {
          if (!candidate.post_utme_paid) {
            nextStep = 'post_utme_payment';
            message = 'Please complete Post-UTME payment';
          } else if (!profile?.biodata_completed) {
            nextStep = 'biodata';
            message = 'Please complete your biodata information';
          } else if (!profile?.education_completed) {
            nextStep = 'education';
            message = 'Please provide your educational background';
          } else if (!profile?.next_of_kin_completed) {
            nextStep = 'next_of_kin';
            message = 'Please provide next of kin information';
          } else if (!profile?.sponsor_completed) {
            nextStep = 'sponsor';
            message = 'Please provide sponsor information';
          } else if (!application) {
            nextStep = 'application_submission';
            message = 'Please submit your application';
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
   * Complete biodata information
   */
  async completeBiodata(
    candidateId: string,
    biodata: {
      first_name: string;
      last_name: string;
      middle_name?: string;
      date_of_birth: Date;
      gender: 'male' | 'female';
      state: string;
      lga: string;
      address: string;
      nationality: string;
      religion?: string;
      marital_status: 'single' | 'married' | 'divorced' | 'widowed';
    }
  ): Promise<{
    success: boolean;
    message: string;
    nextStep?: string;
  }> {
    return await withDatabaseLogging('completeBiodata', 'profiles', async () => {
      try {
        // Update profile with biodata
        await db('profiles')
          .where('candidate_id', candidateId)
          .update({
            ...biodata,
            biodata_completed: true,
            updated_at: new Date(),
          });

        // Update candidate name
        const fullName = `${biodata.first_name} ${biodata.middle_name ? biodata.middle_name + ' ' : ''}${biodata.last_name}`;
        await db('candidates').where('id', candidateId).update({
          name: fullName,
          updated_at: new Date(),
        });

        logger.info('Biodata completed successfully', {
          module: 'candidate',
          operation: 'completeBiodata',
          metadata: { candidateId, fullName },
        });

        return {
          success: true,
          message: 'Biodata information completed successfully',
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
   * Complete education information
   */
  async completeEducation(
    candidateId: string,
    education: {
      secondary_school: string;
      secondary_school_year: number;
      secondary_school_certificate: string;
      jamb_subject_1: string;
      jamb_subject_2: string;
      jamb_subject_3: string;
      jamb_subject_4: string;
      jamb_score: number;
    }
  ): Promise<{
    success: boolean;
    message: string;
    nextStep?: string;
  }> {
    return await withDatabaseLogging('completeEducation', 'profiles', async () => {
      try {
        // Update profile with education info
        await db('profiles')
          .where('candidate_id', candidateId)
          .update({
            ...education,
            education_completed: true,
            updated_at: new Date(),
          });

        // Update candidate JAMB score
        await db('candidates').where('id', candidateId).update({
          jamb_score: education.jamb_score,
          updated_at: new Date(),
        });

        logger.info('Education information completed successfully', {
          module: 'candidate',
          operation: 'completeEducation',
          metadata: { candidateId, jambScore: education.jamb_score },
        });

        return {
          success: true,
          message: 'Education information completed successfully',
          nextStep: 'next_of_kin',
        };
      } catch (error) {
        logger.error('Failed to complete education information', {
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
   * Complete next of kin information
   */
  async completeNextOfKin(
    candidateId: string,
    nextOfKin: {
      next_of_kin_name: string;
      next_of_kin_relationship: string;
      next_of_kin_phone: string;
      next_of_kin_address: string;
      next_of_kin_occupation?: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    nextStep?: string;
  }> {
    return await withDatabaseLogging('completeNextOfKin', 'profiles', async () => {
      try {
        await db('profiles')
          .where('candidate_id', candidateId)
          .update({
            ...nextOfKin,
            next_of_kin_completed: true,
            updated_at: new Date(),
          });

        logger.info('Next of kin information completed successfully', {
          module: 'candidate',
          operation: 'completeNextOfKin',
          metadata: { candidateId, nextOfKinName: nextOfKin.next_of_kin_name },
        });

        return {
          success: true,
          message: 'Next of kin information completed successfully',
          nextStep: 'sponsor',
        };
      } catch (error) {
        logger.error('Failed to complete next of kin information', {
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
   * Complete sponsor information
   */
  async completeSponsor(
    candidateId: string,
    sponsor: {
      sponsor_name: string;
      sponsor_relationship: string;
      sponsor_phone: string;
      sponsor_address: string;
      sponsor_occupation: string;
      sponsor_income_range: string;
    }
  ): Promise<{
    success: boolean;
    message: string;
    nextStep?: string;
  }> {
    return await withDatabaseLogging('completeSponsor', 'profiles', async () => {
      try {
        await db('profiles')
          .where('candidate_id', candidateId)
          .update({
            ...sponsor,
            sponsor_completed: true,
            updated_at: new Date(),
          });

        logger.info('Sponsor information completed successfully', {
          module: 'candidate',
          operation: 'completeSponsor',
          metadata: { candidateId, sponsorName: sponsor.sponsor_name },
        });

        return {
          success: true,
          message: 'Sponsor information completed successfully',
          nextStep: 'application_submission',
        };
      } catch (error) {
        logger.error('Failed to complete sponsor information', {
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
        const profile = await db('profiles').where('candidate_id', candidateId).first();

        if (
          !profile?.biodata_completed ||
          !profile?.education_completed ||
          !profile?.next_of_kin_completed ||
          !profile?.sponsor_completed
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
        const candidate = await db('candidates').where('id', candidateId).first();

        if (candidate && profile.email) {
          await this.emailService.sendRegistrationCompletion(
            profile.email,
            candidate.name || 'Candidate',
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
}
