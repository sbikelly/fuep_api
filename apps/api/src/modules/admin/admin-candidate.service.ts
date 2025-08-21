import { db } from '../../db/knex.js';
import { AdminAuditService } from './admin-audit.service.js';

export interface Candidate {
  id: string;
  jambRegNo: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  phoneNumber: string;
  email?: string;
  stateOfOrigin: string;
  lga: string;
  programChoice1: string;
  programChoice2?: string;
  programChoice3?: string;
  jambScore: number;
  applicationStatus:
    | 'pending'
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'admitted';
  paymentStatus: 'pending' | 'paid' | 'verified' | 'refunded';
  documentsStatus: 'pending' | 'submitted' | 'verified' | 'rejected';
  admissionStatus:
    | 'not_applied'
    | 'applied'
    | 'under_review'
    | 'provisionally_admitted'
    | 'fully_admitted'
    | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

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
  documentsStatus?: string;
  admissionStatus?: string;
  state?: string;
  program?: string;
  minScore?: number;
  maxScore?: number;
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
            .orWhere('first_name', 'ilike', `%${filters.search}%`)
            .orWhere('last_name', 'ilike', `%${filters.search}%`)
            .orWhere('email', 'ilike', `%${filters.search}%`);
        });
      }

      if (filters?.status) {
        query = query.where('application_status', filters.status);
      }

      if (filters?.paymentStatus) {
        query = query.where('payment_status', filters.paymentStatus);
      }

      if (filters?.documentsStatus) {
        query = query.where('documents_status', filters.documentsStatus);
      }

      if (filters?.admissionStatus) {
        query = query.where('admission_status', filters.admissionStatus);
      }

      if (filters?.state) {
        query = query.where('state_of_origin', filters.state);
      }

      if (filters?.program) {
        query = query.where(function () {
          this.where('program_choice_1', 'ilike', `%${filters.program}%`)
            .orWhere('program_choice_2', 'ilike', `%${filters.program}%`)
            .orWhere('program_choice_3', 'ilike', `%${filters.program}%`);
        });
      }

      if (filters?.minScore !== undefined) {
        query = query.where('jamb_score', '>=', filters.minScore);
      }

      if (filters?.maxScore !== undefined) {
        query = query.where('jamb_score', '<=', filters.maxScore);
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

      // Get candidates
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

  // Status Management
  async updateCandidateStatus(
    candidateId: string,
    newStatus: string,
    reason: string,
    adminUserId: string
  ): Promise<Candidate> {
    try {
      const candidate = await this.getCandidateById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      const previousStatus = candidate.applicationStatus;

      // Update candidate status
      await db('candidates').where('id', candidateId).update({
        application_status: newStatus,
        updated_at: new Date(),
      });

      // Log status change
      await this.logStatusChange(candidateId, adminUserId, previousStatus, newStatus, reason);

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'update_candidate_status',
        resource: 'candidate',
        resourceId: candidateId,
        details: {
          previousStatus,
          newStatus,
          reason,
        },
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

  async updatePaymentStatus(
    candidateId: string,
    newStatus: string,
    reason: string,
    adminUserId: string
  ): Promise<Candidate> {
    try {
      const candidate = await this.getCandidateById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      const previousStatus = candidate.paymentStatus;

      // Update payment status
      await db('candidates').where('id', candidateId).update({
        payment_status: newStatus,
        updated_at: new Date(),
      });

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'update_payment_status',
        resource: 'candidate',
        resourceId: candidateId,
        details: {
          previousStatus,
          newStatus,
          reason,
        },
      });

      // Return updated candidate
      const updatedCandidate = await this.getCandidateById(candidateId);
      if (!updatedCandidate) {
        throw new Error('Failed to retrieve updated candidate');
      }

      return updatedCandidate;
    } catch (error) {
      throw new Error(
        `Failed to update payment status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async updateDocumentsStatus(
    candidateId: string,
    newStatus: string,
    reason: string,
    adminUserId: string
  ): Promise<Candidate> {
    try {
      const candidate = await this.getCandidateById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      const previousStatus = candidate.documentsStatus;

      // Update documents status
      await db('candidates').where('id', candidateId).update({
        documents_status: newStatus,
        updated_at: new Date(),
      });

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'update_documents_status',
        resource: 'candidate',
        resourceId: candidateId,
        details: {
          previousStatus,
          newStatus,
          reason,
        },
      });

      // Return updated candidate
      const updatedCandidate = await this.getCandidateById(candidateId);
      if (!updatedCandidate) {
        throw new Error('Failed to retrieve updated candidate');
      }

      return updatedCandidate;
    } catch (error) {
      throw new Error(
        `Failed to update documents status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async updateAdmissionStatus(
    candidateId: string,
    newStatus: string,
    reason: string,
    adminUserId: string
  ): Promise<Candidate> {
    try {
      const candidate = await this.getCandidateById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      const previousStatus = candidate.admissionStatus;

      // Update admission status
      await db('candidates').where('id', candidateId).update({
        admission_status: newStatus,
        updated_at: new Date(),
      });

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'update_admission_status',
        resource: 'candidate',
        resourceId: candidateId,
        details: {
          previousStatus,
          newStatus,
          reason,
        },
      });

      // Return updated candidate
      const updatedCandidate = await this.getCandidateById(candidateId);
      if (!updatedCandidate) {
        throw new Error('Failed to retrieve updated candidate');
      }

      return updatedCandidate;
    } catch (error) {
      throw new Error(
        `Failed to update admission status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Notes Management
  async addCandidateNote(
    candidateId: string,
    note: string,
    noteType: CandidateNote['noteType'],
    isInternal: boolean,
    adminUserId: string
  ): Promise<CandidateNote> {
    try {
      const [noteId] = await db('candidate_notes')
        .insert({
          candidate_id: candidateId,
          admin_user_id: adminUserId,
          note,
          note_type: noteType,
          is_internal: isInternal,
        })
        .returning('id');

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'add_candidate_note',
        resource: 'candidate',
        resourceId: candidateId,
        details: {
          noteType,
          isInternal,
          noteLength: note.length,
        },
      });

      return {
        id: noteId,
        candidateId,
        adminUserId,
        note,
        noteType,
        isInternal,
        createdAt: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Failed to add candidate note: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getCandidateNotes(
    candidateId: string,
    includeInternal: boolean = false
  ): Promise<CandidateNote[]> {
    try {
      let query = db('candidate_notes').where('candidate_id', candidateId);

      if (!includeInternal) {
        query = query.where('is_internal', false);
      }

      const notes = await query.orderBy('created_at', 'desc');

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

      await db('candidate_notes').where('id', noteId).del();

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'delete_candidate_note',
        resource: 'candidate_note',
        resourceId: noteId,
        details: {
          candidateId: note.candidate_id,
          noteType: note.note_type,
        },
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

  async getPendingApplicationsCount(): Promise<number> {
    try {
      const result = await db('candidates')
        .where('application_status', 'pending')
        .count('* as count')
        .first();
      return result ? parseInt(result.count as string) : 0;
    } catch (error) {
      throw new Error(
        `Failed to get pending applications count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getCandidatesByStatus(): Promise<{ [status: string]: number }> {
    try {
      const results = await db('candidates')
        .select('application_status')
        .count('* as count')
        .groupBy('application_status');

      return results.reduce(
        (acc: { [status: string]: number }, row) => {
          acc[row.application_status as string] = parseInt(row.count as string);
          return acc;
        },
        {} as { [status: string]: number }
      );
    } catch (error) {
      throw new Error(
        `Failed to get candidates by status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getCandidatesByProgram(): Promise<{ [program: string]: number }> {
    try {
      const results = await db('candidates')
        .select('program_choice_1')
        .count('* as count')
        .groupBy('program_choice_1');

      return results.reduce(
        (acc: { [program: string]: number }, row) => {
          acc[row.program_choice_1 as string] = parseInt(row.count as string);
          return acc;
        },
        {} as { [program: string]: number }
      );
    } catch (error) {
      throw new Error(
        `Failed to get candidates by program: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getCandidatesByState(): Promise<{ [state: string]: number }> {
    try {
      const results = await db('candidates')
        .select('state_of_origin')
        .count('* as count')
        .groupBy('state_of_origin');

      return results.reduce(
        (acc: { [state: string]: number }, row) => {
          acc[row.state_of_origin as string] = parseInt(row.count as string);
          return acc;
        },
        {} as { [state: string]: number }
      );
    } catch (error) {
      throw new Error(
        `Failed to get candidates by state: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Bulk Operations
  async bulkUpdateStatus(
    candidateIds: string[],
    newStatus: string,
    reason: string,
    adminUserId: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const results = await Promise.allSettled(
        candidateIds.map((id) => this.updateCandidateStatus(id, newStatus, reason, adminUserId))
      );

      const success = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      const errors = results
        .filter((r) => r.status === 'rejected')
        .map((r) => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

      return { success, failed, errors };
    } catch (error) {
      throw new Error(
        `Failed to bulk update status: ${error instanceof Error ? error.message : 'Unknown error'}`
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
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        middleName: candidate.middleName,
        dateOfBirth: candidate.dateOfBirth.toISOString().split('T')[0],
        gender: candidate.gender,
        phoneNumber: candidate.phoneNumber,
        email: candidate.email,
        stateOfOrigin: candidate.stateOfOrigin,
        lga: candidate.lga,
        programChoice1: candidate.programChoice1,
        programChoice2: candidate.programChoice2,
        programChoice3: candidate.programChoice3,
        jambScore: candidate.jambScore,
        applicationStatus: candidate.applicationStatus,
        paymentStatus: candidate.paymentStatus,
        documentsStatus: candidate.documentsStatus,
        admissionStatus: candidate.admissionStatus,
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

  // Private Helper Methods
  private mapDbRecordToCandidate(record: any): Candidate {
    return {
      id: record.id,
      jambRegNo: record.jamb_reg_no,
      firstName: record.first_name,
      lastName: record.last_name,
      middleName: record.middle_name,
      dateOfBirth: record.date_of_birth,
      gender: record.gender,
      phoneNumber: record.phone_number,
      email: record.email,
      stateOfOrigin: record.state_of_origin,
      lga: record.lga,
      programChoice1: record.program_choice_1,
      programChoice2: record.program_choice_2,
      programChoice3: record.program_choice_3,
      jambScore: record.jamb_score,
      applicationStatus: record.application_status,
      paymentStatus: record.payment_status,
      documentsStatus: record.documents_status,
      admissionStatus: record.admission_status,
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
