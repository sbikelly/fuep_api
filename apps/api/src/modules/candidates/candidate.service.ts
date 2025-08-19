import { Education, NextOfKin, Profile, ProfileCompletionStatus, Sponsor } from '@fuep/types';

import { db as knex } from '../../db/knex.js';

export class CandidateService {
  private logger: Console;

  constructor(logger: Console = console) {
    this.logger = logger;
  }

  /**
   * Get candidate profile with JAMB prefill data
   */
  async getCandidateProfile(jambRegNo: string): Promise<Profile | null> {
    try {
      this.logger.log(`[CandidateService] Getting profile for JAMB: ${jambRegNo}`);

      // First check if candidate exists
      const candidate = await knex('candidates').where('jamb_reg_no', jambRegNo).first();

      if (!candidate) {
        this.logger.log(`[CandidateService] Candidate not found for JAMB: ${jambRegNo}`);
        return null;
      }

      // Get profile data
      const profile = await knex('profiles').where('candidate_id', candidate.id).first();

      // Get JAMB prelist data for prefill
      const jambData = await knex('jamb_prelist').where('jamb_reg_no', jambRegNo).first();

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

        const [insertedProfile] = await knex('profiles').insert(newProfile).returning('*');

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

      const [updatedProfile] = await knex('profiles')
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

      const nok = await knex('next_of_kin').where('candidate_id', candidateId).first();

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

      const existingNok = await knex('next_of_kin').where('candidate_id', candidateId).first();

      if (existingNok) {
        // Update existing
        const [updatedNok] = await knex('next_of_kin')
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
        const [newNok] = await knex('next_of_kin')
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

      const sponsor = await knex('sponsors').where('candidate_id', candidateId).first();

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

      const existingSponsor = await knex('sponsors').where('candidate_id', candidateId).first();

      if (existingSponsor) {
        // Update existing
        const [updatedSponsor] = await knex('sponsors')
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
        const [newSponsor] = await knex('sponsors')
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

      const records = await knex('education_records')
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

      const [newRecord] = await knex('education_records')
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

      const [updatedRecord] = await knex('education_records')
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

      const deleted = await knex('education_records').where('id', recordId).del();

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
      const [profile] = await knex('profiles').where('candidate_id', candidateId);
      const [nok] = await knex('next_of_kin').where('candidate_id', candidateId);
      const [sponsor] = await knex('sponsors').where('candidate_id', candidateId);
      const [education] = await knex('education_records').where('candidate_id', candidateId);
      const [uploads] = await knex('uploads').where('candidate_id', candidateId);

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
        knex('uploads').where('candidate_id', candidateId),
        knex('applications').where('candidate_id', candidateId).first(),
        knex('payments').where('candidate_id', candidateId).orderBy('created_at', 'desc'),
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
}
