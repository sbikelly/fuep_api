import { Education, NextOfKin, Profile, ProfileCompletionStatus, Sponsor } from '@fuep/types';

import { db } from '../../db/knex.js';
import { logger, withDatabaseLogging, withPerformanceLogging } from '../../middleware/logging.js';

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

  constructor(logger: Console = console) {
    this.logger = logger;
  }

  /**
   * Get candidate by JAMB registration number
   */
  async getCandidateByJambRegNo(jambRegNo: string): Promise<Candidate | null> {
    try {
      this.logger.log(`[CandidateService] Getting candidate by JAMB: ${jambRegNo}`);

      // Get candidate from database
      const candidate = await db('candidates').where('jamb_reg_no', jambRegNo).first();

      if (!candidate) {
        this.logger.log(`[CandidateService] Candidate not found for JAMB: ${jambRegNo}`);
        return null;
      }

      // Get additional data from related tables
      const profile = await db('profiles').where('candidate_id', candidate.id).first();

      const application = await db('applications').where('candidate_id', candidate.id).first();

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

      this.logger.log(`[CandidateService] Found candidate: ${candidate.id} for JAMB: ${jambRegNo}`);
      return candidateData;
    } catch (error) {
      this.logger.error('[CandidateService] Error getting candidate by JAMB:', error);
      throw new Error('Failed to get candidate by JAMB');
    }
  }

  /**
   * Get candidate profile with JAMB prefill data
   */
  async getCandidateProfile(jambRegNo: string): Promise<Profile | null> {
    try {
      this.logger.log(`[CandidateService] Getting profile for JAMB: ${jambRegNo}`);

      // First check if candidate exists
      const candidate = await db('candidates').where('jamb_reg_no', jambRegNo).first();

      if (!candidate) {
        this.logger.log(`[CandidateService] Candidate not found for JAMB: ${jambRegNo}`);
        return null;
      }

      // Get profile data
      const profile = await db('profiles').where('candidate_id', candidate.id).first();

      // Get JAMB prelist data for prefill
      const jambData = await db('jamb_prelist').where('jamb_reg_no', jambRegNo).first();

      if (profile) {
        // Merge with JAMB data for prefill
        return {
          ...profile,
          candidateId: candidate.id,
          surname: profile.surname || jambData?.surname,
          firstname: profile.firstname || jambData?.firstname,
          othernames: profile.othernames || jambData?.othernames,
          gender: profile.gender || jambData?.gender,
          state: profile.state || jambData?.state_of_origin,
          lga: profile.lga || jambData?.lga_of_origin,
        };
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

        this.logger.log(`[CandidateService] Created new profile for candidate: ${candidate.id}`);
        return insertedProfile as Profile;
      }
    } catch (error) {
      this.logger.error('[CandidateService] Error getting candidate profile:', error);
      throw new Error('Failed to get candidate profile');
    }
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
    try {
      this.logger.log(`[CandidateService] Creating application for candidate: ${candidateId}`);

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

      this.logger.log(`[CandidateService] Application created successfully: ${application.id}`);
      return application;
    } catch (error) {
      this.logger.error('[CandidateService] Error creating application:', error);
      throw new Error('Failed to create application');
    }
  }

  async getApplication(candidateId: string): Promise<any> {
    try {
      this.logger.log(`[CandidateService] Getting application for candidate: ${candidateId}`);

      const application = await db('applications')
        .where('candidate_id', candidateId)
        .orderBy('created_at', 'desc')
        .first();

      return application;
    } catch (error) {
      this.logger.error('[CandidateService] Error getting application:', error);
      throw new Error('Failed to get application');
    }
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
    try {
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
        await db('applications').where('candidate_id', candidateId).update(applicationUpdates);
      }

      // Return the updated application
      return this.getApplication(candidateId);
    } catch (error) {
      throw new Error(
        `Failed to update application: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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
}
