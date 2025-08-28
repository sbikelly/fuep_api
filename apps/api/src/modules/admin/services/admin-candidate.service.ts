import { Candidate } from '@fuep/types';
import { Knex } from 'knex';

import { db } from '../../../db/knex.js';
import { AdminAuditService } from './admin-audit.service.js';
import { AdminValidationService } from './admin-validation.service.js';

export interface CandidateNote {
  id: string;
  candidateId: string;
  adminUserId: string;
  note: string;
  noteType: 'general' | 'warning' | 'important' | 'internal';
  isInternal: boolean;
  createdAt: Date;
}

export interface CandidateStatusChange {
  id: string;
  candidateId: string;
  adminUserId: string;
  previousStatus: string;
  newStatus: string;
  reason: string;
  details?: any;
  createdAt: Date;
}

export interface CandidateFilters {
  search?: string;
  status?: string;
  paymentStatus?: string;
  admissionStatus?: string;
  state?: string;
  department?: string;
  modeOfEntry?: 'UTME' | 'DE';
  registrationCompleted?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export class AdminCandidateService {
  constructor(private auditService: AdminAuditService) {}

  // Basic CRUD Operations
  async getCandidateById(id: string): Promise<Candidate | null> {
    try {
      const candidate = await db('candidates').where('id', id).first();

      if (!candidate) return null;

      return this.mapDbRecordToCandidate(candidate);
    } catch (error) {
      throw new Error(
        `Failed to get candidate: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getCandidateByJambRegNo(jambRegNo: string): Promise<Candidate | null> {
    try {
      const candidate = await db('candidates').where('jamb_reg_no', jambRegNo).first();

      if (!candidate) return null;

      return this.mapDbRecordToCandidate(candidate);
    } catch (error) {
      throw new Error(
        `Failed to get candidate by JAMB reg number: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAllCandidates(
    filters?: CandidateFilters,
    pagination?: { page: number; limit: number }
  ): Promise<{ candidates: Candidate[]; total: number }> {
    try {
      let query = db('candidates');

      // Apply filters
      if (filters?.search) {
        query = query.where(function () {
          this.where('jamb_reg_no', 'ilike', `%${filters.search}%`)
            .orWhere('firstname', 'ilike', `%${filters.search}%`)
            .orWhere('surname', 'ilike', `%${filters.search}%`)
            .orWhere('email', 'ilike', `%${filters.search}%`);
        });
      }

      if (filters?.status) {
        // Map status to appropriate field based on context
        if (
          filters.status === 'admitted' ||
          filters.status === 'rejected' ||
          filters.status === 'pending'
        ) {
          // This would need to be joined with applications table for admission status
          // For now, we'll use a placeholder approach
        }
      }

      if (filters?.paymentStatus) {
        // This would need to be joined with applications table for payment status
        // For now, we'll use a placeholder approach
      }

      if (filters?.admissionStatus) {
        // This would need to be joined with applications table for admission status
        // For now, we'll use a placeholder approach
      }

      if (filters?.state) {
        query = query.where('state', filters.state);
      }

      if (filters?.department) {
        query = query.where('department', 'ilike', `%${filters.department}%`);
      }

      if (filters?.modeOfEntry) {
        query = query.where('mode_of_entry', filters.modeOfEntry);
      }

      if (filters?.registrationCompleted !== undefined) {
        query = query.where('registration_completed', filters.registrationCompleted);
      }

      if (filters?.startDate) {
        query = query.where('created_at', '>=', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.where('created_at', '<=', filters.endDate);
      }

      // Get total count
      const totalResult = await query.clone().count('* as count').first();
      const total = totalResult ? parseInt(totalResult.count as string) : 0;

      // Apply pagination
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        query = query.offset(offset).limit(pagination.limit);
      }

      // Execute query
      const candidates = await query.orderBy('created_at', 'desc');

      return {
        candidates: candidates.map((candidate) => this.mapDbRecordToCandidate(candidate)),
        total,
      };
    } catch (error) {
      throw new Error(
        `Failed to get candidates: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async updateCandidateStatus(
    candidateId: string,
    status: string,
    reason: string,
    adminUserId: string
  ): Promise<Candidate> {
    try {
      // Get current candidate
      const currentCandidate = await this.getCandidateById(candidateId);
      if (!currentCandidate) {
        throw new Error('Candidate not found');
      }

      // Determine which status to update based on the status type
      let updateData: any = {};

      if (status === 'admitted' || status === 'rejected' || status === 'pending') {
        // This would update the applications table admission status
        // For now, we'll log the status change
        await this.logStatusChange(candidateId, adminUserId, 'unknown', status, reason);
      } else if (status === 'registration_completed') {
        updateData.registration_completed = true;
      }

      // Update candidate if there are direct updates
      if (Object.keys(updateData).length > 0) {
        await db('candidates').where('id', candidateId).update(updateData);
      }

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'update_candidate_status',
        resource: 'candidate',
        resourceId: candidateId,
        details: { status, reason, previousStatus: 'unknown' },
      });

      // Return updated candidate
      const updatedCandidate = await this.getCandidateById(candidateId);
      if (!updatedCandidate) {
        throw new Error('Failed to retrieve updated candidate');
      }

      return updatedCandidate;
    } catch (error) {
      throw new Error(
        `Failed to update candidate status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async addCandidateNote(
    candidateId: string,
    note: string,
    noteType: 'general' | 'warning' | 'important' | 'internal' = 'general',
    isInternal: boolean = false,
    adminUserId: string
  ): Promise<CandidateNote> {
    try {
      // Verify candidate exists
      const candidate = await this.getCandidateById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Create note
      const [noteId] = await db('candidate_notes')
        .insert({
          candidate_id: candidateId,
          admin_user_id: adminUserId,
          note,
          note_type: noteType,
          is_internal: isInternal,
          created_at: new Date(),
        })
        .returning('id');

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'add_candidate_note',
        resource: 'candidate_note',
        resourceId: noteId,
        details: { candidateId, noteType, isInternal },
      });

      // Return created note
      const createdNote = await this.getCandidateNotes(candidateId);
      return (
        createdNote.find((n) => n.id === noteId) || {
          id: noteId,
          candidateId,
          adminUserId,
          note,
          noteType,
          isInternal,
          createdAt: new Date(),
        }
      );
    } catch (error) {
      throw new Error(
        `Failed to add candidate note: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getCandidateNotes(candidateId: string): Promise<CandidateNote[]> {
    try {
      const notes = await db('candidate_notes')
        .where('candidate_id', candidateId)
        .orderBy('created_at', 'desc');

      return notes.map((note) => ({
        id: note.id,
        candidateId: note.candidate_id,
        adminUserId: note.admin_user_id,
        note: note.note,
        noteType: note.note_type,
        isInternal: note.is_internal,
        createdAt: note.created_at,
      }));
    } catch (error) {
      throw new Error(
        `Failed to get candidate notes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async deleteCandidateNote(noteId: string, adminUserId: string): Promise<void> {
    try {
      const note = await db('candidate_notes').where('id', noteId).first();
      if (!note) {
        throw new Error('Note not found');
      }

      await db('candidate_notes').where('id', noteId).delete();

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'delete_candidate_note',
        resource: 'candidate_note',
        resourceId: noteId,
        details: { candidateId: note.candidate_id },
      });
    } catch (error) {
      throw new Error(
        `Failed to delete candidate note: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Statistics and Analytics
  async getTotalCandidates(): Promise<number> {
    try {
      const result = await db('candidates').count('* as count').first();
      return result ? parseInt(result.count as string) : 0;
    } catch (error) {
      throw new Error(
        `Failed to get total candidates: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getCandidatesByStatus(): Promise<{ [status: string]: number }> {
    try {
      // This would need to be updated to work with the new schema
      // For now, return basic counts
      const total = await this.getTotalCandidates();
      const completed = await db('candidates')
        .where('registration_completed', true)
        .count('* as count')
        .first();
      const pending = await db('candidates')
        .where('registration_completed', false)
        .count('* as count')
        .first();

      return {
        total: total,
        completed: completed ? parseInt(completed.count as string) : 0,
        pending: pending ? parseInt(pending.count as string) : 0,
      };
    } catch (error) {
      throw new Error(
        `Failed to get candidates by status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getCandidatesByProgram(): Promise<{ [program: string]: number }> {
    try {
      const result = await db('candidates')
        .select('department')
        .count('* as count')
        .groupBy('department');

      const distribution: { [program: string]: number } = {};
      result.forEach((row) => {
        if (row.department) {
          distribution[row.department] = parseInt(row.count as string);
        }
      });

      return distribution;
    } catch (error) {
      throw new Error(
        `Failed to get candidates by program: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getCandidatesByState(): Promise<{ [state: string]: number }> {
    try {
      const result = await db('candidates').select('state').count('* as count').groupBy('state');

      const distribution: { [state: string]: number } = {};
      result.forEach((row) => {
        if (row.state) {
          distribution[row.state] = parseInt(row.count as string);
        }
      });

      return distribution;
    } catch (error) {
      throw new Error(
        `Failed to get state distribution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Export and Reporting
  async exportCandidates(
    filters?: CandidateFilters,
    format: 'csv' | 'json' = 'csv'
  ): Promise<{ data: any; filename: string; mimeType: string }> {
    try {
      const { candidates } = await this.getAllCandidates(filters);

      const exportData = candidates.map((candidate) => ({
        jambRegNo: candidate.jambRegNo,
        firstname: candidate.firstname,
        surname: candidate.surname,
        othernames: candidate.othernames,
        dob: candidate.dob,
        gender: candidate.gender,
        phone: candidate.phone,
        email: candidate.email,
        state: candidate.state,
        lga: candidate.lga,
        department: candidate.department,
        modeOfEntry: candidate.modeOfEntry,
        registrationCompleted: candidate.registrationCompleted,
        biodataCompleted: candidate.biodataCompleted,
        educationCompleted: candidate.educationCompleted,
        nextOfKinCompleted: candidate.nextOfKinCompleted,
        sponsorCompleted: candidate.sponsorCompleted,
        createdAt: candidate.createdAt.toISOString(),
      }));

      const filename = `candidates_export_${new Date().toISOString().split('T')[0]}.${format}`;
      const mimeType = format === 'csv' ? 'text/csv' : 'application/json';

      return {
        data: exportData,
        filename,
        mimeType,
      };
    } catch (error) {
      throw new Error(
        `Failed to export candidates: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Additional methods required by admin service
  async getPendingApplicationsCount(): Promise<number> {
    try {
      // This would need to be updated to work with the new applications table
      // For now, return a placeholder count
      return 0;
    } catch (error) {
      throw new Error(
        `Failed to get pending applications count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getCompletedProfilesCount(): Promise<number> {
    try {
      const result = await db('candidates')
        .where('registration_completed', true)
        .count('* as count')
        .first();
      return result ? parseInt(result.count as string) : 0;
    } catch (error) {
      throw new Error(
        `Failed to get completed profiles count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getSubmittedApplicationsCount(): Promise<number> {
    try {
      // This would need to be updated to work with the new applications table
      // For now, return a placeholder count
      return 0;
    } catch (error) {
      throw new Error(
        `Failed to get submitted applications count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getJambScores(): Promise<number[]> {
    try {
      // This would need to be updated to work with the new education_records table
      // For now, return empty array
      return [];
    } catch (error) {
      throw new Error(
        `Failed to get JAMB scores: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getGenderDistribution(): Promise<{ [gender: string]: number }> {
    try {
      const result = await db('candidates').select('gender').count('* as count').groupBy('gender');

      const distribution: { [gender: string]: number } = {};
      result.forEach((row) => {
        if (row.gender) {
          distribution[row.gender] = parseInt(row.count as string);
        }
      });

      return distribution;
    } catch (error) {
      throw new Error(
        `Failed to get gender distribution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getStateDistribution(): Promise<{ [state: string]: number }> {
    try {
      const result = await db('candidates').select('state').count('* as count').groupBy('state');

      const distribution: { [state: string]: number } = {};
      result.forEach((row) => {
        if (row.state) {
          distribution[row.state] = parseInt(row.count as string);
        }
      });

      return distribution;
    } catch (error) {
      throw new Error(
        `Failed to get state distribution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Private Helper Methods
  private mapDbRecordToCandidate(record: any): Candidate {
    return {
      id: record.id,
      jambRegNo: record.jamb_reg_no,
      firstname: record.firstname,
      surname: record.surname,
      othernames: record.othernames,
      gender: record.gender || 'other',
      dob: record.dob,
      nationality: record.nationality,
      state: record.state,
      lga: record.lga,
      address: record.address,
      email: record.email,
      phone: record.phone,
      department: record.department,
      modeOfEntry: record.mode_of_entry || 'UTME',
      maritalStatus: record.marital_status || 'single',
      passportPhotoUrl: record.passport_photo_url,
      signatureUrl: record.signature_url,
      registrationCompleted: record.registration_completed || false,
      biodataCompleted: record.biodata_completed || false,
      educationCompleted: record.education_completed || false,
      nextOfKinCompleted: record.next_of_kin_completed || false,
      sponsorCompleted: record.sponsor_completed || false,
      admissionStatus: undefined, // Would come from applications table
      paymentStatus: undefined, // Would come from applications table
      rrr: undefined, // Would come from applications table
      passwordHash: record.password_hash,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  private async logStatusChange(
    candidateId: string,
    adminUserId: string,
    previousStatus: string,
    newStatus: string,
    reason: string
  ): Promise<void> {
    try {
      await db('candidate_status_changes').insert({
        candidate_id: candidateId,
        admin_user_id: adminUserId,
        previous_status: previousStatus,
        new_status: newStatus,
        reason,
      });
    } catch (error) {
      // Log error but don't fail the main operation
      console.error('Failed to log status change:', error);
    }
  }
}
