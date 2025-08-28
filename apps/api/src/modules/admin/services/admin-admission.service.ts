import { Knex } from 'knex';

import { db } from '../../../db/knex.js';
import { AdminAuditService } from './admin-audit.service.js';

export interface AdmissionDecisionTemplate {
  id: string;
  name: string;
  description: string;
  templateType: 'provisional' | 'full' | 'rejection' | 'waitlist';
  subject: string;
  body: string;
  variables: string[]; // e.g., ['candidate_name', 'program', 'admission_date']
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdmissionDecision {
  id: string;
  candidateId: string;
  decision: 'pending' | 'admitted' | 'rejected';
  decidedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BatchAdmissionOperation {
  id: string;
  name: string;
  description: string;
  operationType: 'bulk_admission' | 'bulk_rejection' | 'bulk_waitlist';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalCandidates: number;
  processedCandidates: number;
  successfulCandidates: number;
  failedCandidates: number;
  templateId: string;
  criteria: any; // JSON criteria for selection
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdmissionFilters {
  decisionType?: string;
  status?: string;
  program?: string;
  startDate?: Date;
  endDate?: Date;
  candidateId?: string;
}

export class AdminAdmissionService {
  constructor(private auditService: AdminAuditService) {}

  // Admission Decision Templates
  async createAdmissionTemplate(
    templateData: {
      name: string;
      description: string;
      templateType: AdmissionDecisionTemplate['templateType'];
      subject: string;
      body: string;
      variables: string[];
    },
    adminUserId: string
  ): Promise<AdmissionDecisionTemplate> {
    try {
      const [templateId] = await db('admission_decision_templates')
        .insert({
          name: templateData.name,
          description: templateData.description,
          template_type: templateData.templateType,
          subject: templateData.subject,
          body: templateData.body,
          variables: JSON.stringify(templateData.variables),
          is_active: true,
          created_by: adminUserId,
        })
        .returning('id');

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'create_admission_template',
        resource: 'admission_template',
        resourceId: templateId,
        details: templateData,
      });

      const createdTemplate = await this.getAdmissionTemplateById(templateId);
      if (!createdTemplate) {
        throw new Error('Failed to retrieve created admission template');
      }
      return createdTemplate;
    } catch (error) {
      throw new Error(
        `Failed to create admission template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async updateAdmissionTemplate(
    id: string,
    updateData: Partial<
      Pick<
        AdmissionDecisionTemplate,
        'name' | 'description' | 'subject' | 'body' | 'variables' | 'isActive'
      >
    >,
    adminUserId: string
  ): Promise<AdmissionDecisionTemplate> {
    try {
      const currentTemplate = await this.getAdmissionTemplateById(id);
      if (!currentTemplate) {
        throw new Error('Admission template not found');
      }

      const updateFields: any = { ...updateData };
      if (updateData.variables) {
        updateFields.variables = JSON.stringify(updateData.variables);
      }
      updateFields.updated_at = new Date();

      await db('admission_decision_templates').where('id', id).update(updateFields);

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'update_admission_template',
        resource: 'admission_template',
        resourceId: id,
        details: {
          previous: currentTemplate,
          updates: updateData,
        },
      });

      const updatedTemplate = await this.getAdmissionTemplateById(id);
      if (!updatedTemplate) {
        throw new Error('Failed to retrieve updated admission template');
      }
      return updatedTemplate;
    } catch (error) {
      throw new Error(
        `Failed to update admission template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAdmissionTemplateById(id: string): Promise<AdmissionDecisionTemplate | null> {
    try {
      const template = await db('admission_decision_templates').where('id', id).first();

      if (!template) return null;

      return {
        id: template.id,
        name: template.name,
        description: template.description,
        templateType: template.template_type,
        subject: template.subject,
        body: template.body,
        variables: JSON.parse(template.variables),
        isActive: template.is_active,
        createdBy: template.created_by,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to get admission template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAllAdmissionTemplates(
    templateType?: AdmissionDecisionTemplate['templateType'],
    isActive?: boolean
  ): Promise<AdmissionDecisionTemplate[]> {
    try {
      let query = db('admission_decision_templates');

      if (templateType) {
        query = query.where('template_type', templateType);
      }

      if (isActive !== undefined) {
        query = query.where('is_active', isActive);
      }

      const templates = await query.orderBy('name', 'asc');

      return templates.map((template) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        templateType: template.template_type,
        subject: template.subject,
        body: template.body,
        variables: JSON.parse(template.variables),
        isActive: template.is_active,
        createdBy: template.created_by,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
      }));
    } catch (error) {
      throw new Error(
        `Failed to get admission templates: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async deleteAdmissionTemplate(
    id: string,
    adminUserId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const currentTemplate = await this.getAdmissionTemplateById(id);
      if (!currentTemplate) {
        throw new Error('Admission template not found');
      }

      // Soft delete by setting is_active to false
      await db('admission_decision_templates').where('id', id).update({
        is_active: false,
        updated_at: new Date(),
      });

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'delete_admission_template',
        resource: 'admission_template',
        resourceId: id,
        details: {
          previous: currentTemplate,
        },
      });

      return {
        success: true,
        message: 'Admission template deleted successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to delete admission template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Individual Admission Decisions
  async generateAdmissionLetter(
    candidateId: string,
    templateId: string,
    adminUserId: string
  ): Promise<AdmissionDecision> {
    try {
      const template = await this.getAdmissionTemplateById(templateId);
      if (!template) {
        throw new Error('Admission template not found');
      }

      if (!template.isActive) {
        throw new Error('Template is not active');
      }

      // Get candidate information
      const candidate = await db('candidates').where('id', candidateId).first();

      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Process template variables
      const _processedSubject = this.processTemplate(template.subject, candidate);
      const _processedBody = this.processTemplate(template.body, candidate);

      // Create admission decision
      const [decisionId] = await db('admissions')
        .insert({
          candidate_id: candidateId,
          decision: 'pending',
          decided_by: adminUserId,
          notes: `Generated from template: ${template.name}`,
        })
        .returning('id');

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'generate_admission_letter',
        resource: 'admission_decision',
        resourceId: decisionId,
        details: {
          candidateId,
          templateId,
          decisionType: template.templateType,
        },
      });

      const createdDecision = await this.getAdmissionDecisionById(decisionId);
      if (!createdDecision) {
        throw new Error('Failed to retrieve created admission decision');
      }
      return createdDecision;
    } catch (error) {
      throw new Error(
        `Failed to generate admission letter: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async sendAdmissionDecision(
    decisionId: string,
    adminUserId: string,
    sendOptions?: {
      expiresInDays?: number;
      notes?: string;
    }
  ): Promise<AdmissionDecision> {
    try {
      const decision = await this.getAdmissionDecisionById(decisionId);
      if (!decision) {
        throw new Error('Admission decision not found');
      }

      if (decision.decision !== 'pending') {
        throw new Error('Only pending decisions can be updated');
      }

      const updateData: any = {
        decision: 'admitted',
        decided_at: new Date(),
        updated_at: new Date(),
      };

      if (sendOptions?.expiresInDays) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + sendOptions.expiresInDays);
        updateData.expires_at = expiresAt;
      }

      if (sendOptions?.notes) {
        updateData.notes = sendOptions.notes;
      }

      await db('admissions').where('id', decisionId).update(updateData);

      // Update candidate admission status
      await this.updateCandidateAdmissionStatus(
        decision.candidateId,
        decision.decision,
        adminUserId
      );

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'send_admission_decision',
        resource: 'admission_decision',
        resourceId: decisionId,
        details: sendOptions,
      });

      const updatedDecision = await this.getAdmissionDecisionById(decisionId);
      if (!updatedDecision) {
        throw new Error('Failed to retrieve updated admission decision');
      }
      return updatedDecision;
    } catch (error) {
      throw new Error(
        `Failed to send admission decision: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async acknowledgeAdmissionDecision(
    decisionId: string,
    candidateId: string
  ): Promise<AdmissionDecision> {
    try {
      const decision = await this.getAdmissionDecisionById(decisionId);
      if (!decision) {
        throw new Error('Admission decision not found');
      }

      if (decision.decision !== 'admitted') {
        throw new Error('Only admitted decisions can be processed');
      }

      if (decision.candidateId !== candidateId) {
        throw new Error('Candidate ID mismatch');
      }

      await db('admissions').where('id', decisionId).update({
        decision: 'admitted',
        decided_at: new Date(),
        updated_at: new Date(),
      });

      const acknowledgedDecision = await this.getAdmissionDecisionById(decisionId);
      if (!acknowledgedDecision) {
        throw new Error('Failed to retrieve acknowledged admission decision');
      }
      return acknowledgedDecision;
    } catch (error) {
      throw new Error(
        `Failed to acknowledge admission decision: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAdmissionDecisionById(id: string): Promise<AdmissionDecision | null> {
    try {
      const decision = await db('admissions').where('id', id).first();

      if (!decision) return null;

      return {
        id: decision.id,
        candidateId: decision.candidate_id,
        decision: decision.decision,
        decidedAt: decision.decided_at,
        notes: decision.notes,
        createdAt: decision.created_at,
        updatedAt: decision.updated_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to get admission decision: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAllAdmissionDecisions(
    filters?: AdmissionFilters,
    pagination?: { page: number; limit: number }
  ): Promise<{ decisions: AdmissionDecision[]; total: number }> {
    try {
      let query = db('admissions');

      // Apply filters
      if (filters?.decisionType) {
        query = query.where('decision', filters.decisionType);
      }

      if (filters?.status) {
        query = query.where('decision', filters.status);
      }

      if (filters?.startDate) {
        query = query.where('created_at', '>=', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.where('created_at', '<=', filters.endDate);
      }

      if (filters?.candidateId) {
        query = query.where('candidate_id', filters.candidateId);
      }

      // Get total count
      const totalResult = await query.clone().count('* as count').first();
      const total = totalResult ? parseInt(totalResult.count as string) : 0;

      // Apply pagination
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        query = query.offset(offset).limit(pagination.limit);
      }

      // Get decisions
      const decisions = await query.orderBy('created_at', 'desc');

      return {
        decisions: decisions.map((decision) => ({
          id: decision.id,
          candidateId: decision.candidate_id,
          decision: decision.decision,
          decidedAt: decision.decided_at,
          notes: decision.notes,
          createdAt: decision.created_at,
          updatedAt: decision.updated_at,
        })),
        total,
      };
    } catch (error) {
      throw new Error(
        `Failed to get admission decisions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Batch Admission Operations
  async createBatchAdmissionOperation(
    operationData: {
      name: string;
      description: string;
      operationType: BatchAdmissionOperation['operationType'];
      templateId: string;
      criteria: any;
    },
    adminUserId: string
  ): Promise<BatchAdmissionOperation> {
    try {
      const [operationId] = await db('batch_admission_operations')
        .insert({
          name: operationData.name,
          description: operationData.description,
          operation_type: operationData.operationType,
          status: 'pending',
          total_candidates: 0,
          processed_candidates: 0,
          successful_candidates: 0,
          failed_candidates: 0,
          template_id: operationData.templateId,
          criteria: JSON.stringify(operationData.criteria),
          created_by: adminUserId,
        })
        .returning('id');

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'create_batch_admission_operation',
        resource: 'batch_admission_operation',
        resourceId: operationId,
        details: operationData,
      });

      const createdOperation = await this.getBatchAdmissionOperationById(operationId);
      if (!createdOperation) {
        throw new Error('Failed to retrieve created batch admission operation');
      }
      return createdOperation;
    } catch (error) {
      throw new Error(
        `Failed to create batch admission operation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async executeBatchAdmissionOperation(
    operationId: string,
    adminUserId: string
  ): Promise<BatchAdmissionOperation> {
    try {
      const operation = await this.getBatchAdmissionOperationById(operationId);
      if (!operation) {
        throw new Error('Batch admission operation not found');
      }

      if (operation.status !== 'pending') {
        throw new Error('Only pending operations can be executed');
      }

      // Update status to processing
      await db('batch_admission_operations').where('id', operationId).update({
        status: 'processing',
        started_at: new Date(),
        updated_at: new Date(),
      });

      try {
        // Get candidates based on criteria
        const candidates = await this.getCandidatesByCriteria(operation.criteria);

        // Update total candidates count
        await db('batch_admission_operations')
          .where('id', operationId)
          .update({ total_candidates: candidates.length });

        let processed = 0;
        let successful = 0;
        let failed = 0;

        // Process each candidate
        for (const candidate of candidates) {
          try {
            await this.generateAdmissionLetter(candidate.id, operation.templateId, adminUserId);
            successful++;
          } catch (error) {
            failed++;
            console.error(`Failed to process candidate ${candidate.id}:`, error);
          }
          processed++;
        }

        // Update operation status
        await db('batch_admission_operations').where('id', operationId).update({
          status: 'completed',
          processed_candidates: processed,
          successful_candidates: successful,
          failed_candidates: failed,
          completed_at: new Date(),
          updated_at: new Date(),
        });

        // Log audit
        await this.auditService.logAction({
          adminUserId,
          action: 'execute_batch_admission_operation',
          resource: 'batch_admission_operation',
          resourceId: operationId,
          details: {
            totalCandidates: candidates.length,
            processed,
            successful,
            failed,
          },
        });
      } catch (error) {
        // Update operation status to failed
        await db('batch_admission_operations')
          .where('id', operationId)
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date(),
            updated_at: new Date(),
          });

        throw error;
      }

      const executedOperation = await this.getBatchAdmissionOperationById(operationId);
      if (!executedOperation) {
        throw new Error('Failed to retrieve executed batch admission operation');
      }
      return executedOperation;
    } catch (error) {
      throw new Error(
        `Failed to execute batch admission operation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getBatchAdmissionOperationById(id: string): Promise<BatchAdmissionOperation | null> {
    try {
      const operation = await db('batch_admission_operations').where('id', id).first();

      if (!operation) return null;

      return {
        id: operation.id,
        name: operation.name,
        description: operation.description,
        operationType: operation.operation_type,
        status: operation.status,
        totalCandidates: operation.total_candidates,
        processedCandidates: operation.processed_candidates,
        successfulCandidates: operation.successful_candidates,
        failedCandidates: operation.failed_candidates,
        templateId: operation.template_id,
        criteria: JSON.parse(operation.criteria),
        startedAt: operation.started_at,
        completedAt: operation.completed_at,
        errorMessage: operation.error_message,
        createdBy: operation.created_by,
        createdAt: operation.created_at,
        updatedAt: operation.updated_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to get batch admission operation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAllBatchAdmissionOperations(
    status?: string,
    pagination?: { page: number; limit: number }
  ): Promise<{ operations: BatchAdmissionOperation[]; total: number }> {
    try {
      let query = db('batch_admission_operations');

      if (status) {
        query = query.where('status', status);
      }

      // Get total count
      const totalResult = await query.clone().count('* as count').first();
      const total = totalResult ? parseInt(totalResult.count as string) : 0;

      // Apply pagination
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        query = query.offset(offset).limit(pagination.limit);
      }

      // Get operations
      const operations = await query.orderBy('created_at', 'desc');

      return {
        operations: operations.map((operation) => ({
          id: operation.id,
          name: operation.name,
          description: operation.description,
          operationType: operation.operation_type,
          status: operation.status,
          totalCandidates: operation.total_candidates,
          processedCandidates: operation.processed_candidates,
          successfulCandidates: operation.successful_candidates,
          failedCandidates: operation.failed_candidates,
          templateId: operation.template_id,
          criteria: JSON.parse(operation.criteria),
          startedAt: operation.started_at,
          completedAt: operation.completed_at,
          errorMessage: operation.error_message,
          createdBy: operation.created_by,
          createdAt: operation.created_at,
          updatedAt: operation.updated_at,
        })),
        total,
      };
    } catch (error) {
      throw new Error(
        `Failed to get batch admission operations: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Statistics and Analytics
  async getTotalAdmissions(): Promise<number> {
    try {
      const result = await db('admissions')
        .where('decision', 'admitted')
        .count('* as count')
        .first();
      return result ? parseInt(result.count as string) : 0;
    } catch (error) {
      throw new Error(
        `Failed to get total admissions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAdmissionsByProgram(): Promise<{ [program: string]: number }> {
    try {
      const results = await db('admissions')
        .join('candidates', 'admissions.candidate_id', 'candidates.id')
        .select('candidates.program_choice_1')
        .where('admissions.decision', 'admitted')
        .count('* as count')
        .groupBy('candidates.program_choice_1');

      return results.reduce(
        (acc: { [program: string]: number }, row) => {
          acc[row.program_choice_1 as string] = parseInt(row.count as string);
          return acc;
        },
        {} as { [program: string]: number }
      );
    } catch (error) {
      throw new Error(
        `Failed to get admissions by program: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAdmissionStatistics(): Promise<{
    totalDecisions: number;
    totalPending: number;
    totalAdmitted: number;
    totalRejected: number;
    decisionsByType: { [type: string]: number };
    decisionsByStatus: { [status: string]: number };
    averageResponseTime: number; // in days
  }> {
    try {
      const [
        totalDecisions,
        totalPending,
        totalAdmitted,
        totalRejected,
        decisionsByType,
        decisionsByStatus,
        averageResponseTime,
      ] = await Promise.all([
        db('admissions').count('* as count').first(),
        db('admissions').where('decision', 'pending').count('* as count').first(),
        db('admissions').where('decision', 'admitted').count('* as count').first(),
        db('admissions').where('decision', 'rejected').count('* as count').first(),
        db('admissions').select('decision').count('* as count').groupBy('decision'),
        db('admissions').select('decision').count('* as count').groupBy('decision'),
        this.calculateAverageResponseTime(),
      ]);

      return {
        totalDecisions: totalDecisions ? parseInt(totalDecisions.count as string) : 0,
        totalPending: totalPending ? parseInt(totalPending.count as string) : 0,
        totalAdmitted: totalAdmitted ? parseInt(totalAdmitted.count as string) : 0,
        totalRejected: totalRejected ? parseInt(totalRejected.count as string) : 0,
        decisionsByType: decisionsByType.reduce(
          (acc: { [type: string]: number }, row) => {
            acc[row.decision as string] = parseInt(row.count as string);
            return acc;
          },
          {} as { [type: string]: number }
        ),
        decisionsByStatus: decisionsByStatus.reduce(
          (acc: { [status: string]: number }, row) => {
            acc[row.decision as string] = parseInt(row.count as string);
            return acc;
          },
          {} as { [status: string]: number }
        ),
        averageResponseTime,
      };
    } catch (error) {
      throw new Error(
        `Failed to get admission statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Private Helper Methods
  private processTemplate(template: string, candidate: any): string {
    let processed = template;

    // Replace common variables
    const variables: { [key: string]: string } = {
      '{{candidate_name}}': `${candidate.first_name} ${candidate.last_name}`,
      '{{first_name}}': candidate.first_name,
      '{{last_name}}': candidate.last_name,
      '{{jamb_reg_no}}': candidate.jamb_reg_no,
      '{{program}}': candidate.program_choice_1,
      '{{jamb_score}}': candidate.jamb_score.toString(),
      '{{state}}': candidate.state_of_origin,
      '{{current_date}}': new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };

    for (const [variable, value] of Object.entries(variables)) {
      processed = processed.replace(new RegExp(variable, 'g'), value);
    }

    return processed;
  }

  private async updateCandidateAdmissionStatus(
    candidateId: string,
    decisionType: string,
    _adminUserId: string
  ): Promise<void> {
    try {
      let newStatus: string;

      switch (decisionType) {
        case 'provisional':
          newStatus = 'provisionally_admitted';
          break;
        case 'full':
          newStatus = 'fully_admitted';
          break;
        case 'rejection':
          newStatus = 'rejected';
          break;
        case 'waitlist':
          newStatus = 'waitlisted';
          break;
        default:
          newStatus = 'under_review';
      }

      await db('candidates').where('id', candidateId).update({
        admission_status: newStatus,
        updated_at: new Date(),
      });
    } catch (_error) {
      console.error('Failed to update candidate admission status:', _error);
    }
  }

  private async getCandidatesByCriteria(criteria: any): Promise<any[]> {
    try {
      let query = db('candidates');

      // Apply criteria filters
      if (criteria.program) {
        query = query.where('program_choice_1', criteria.program);
      }

      if (criteria.minScore !== undefined) {
        query = query.where('jamb_score', '>=', criteria.minScore);
      }

      if (criteria.maxScore !== undefined) {
        query = query.where('jamb_score', '<=', criteria.maxScore);
      }

      if (criteria.state) {
        query = query.where('state_of_origin', criteria.state);
      }

      if (criteria.status) {
        query = query.where('application_status', criteria.status);
      }

      if (criteria.paymentStatus) {
        query = query.where('payment_status', criteria.paymentStatus);
      }

      return await query;
    } catch (error) {
      throw new Error(
        `Failed to get candidates by criteria: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async calculateAverageResponseTime(): Promise<number> {
    try {
      const results = await db('admissions')
        .select('decided_at')
        .whereNotNull('decided_at')
        .where('decision', 'admitted');

      if (results.length === 0) return 0;

      // For now, return 0 since we don't have sent_at timestamp
      // This can be enhanced later when we add more detailed tracking
      return 0;
    } catch (error) {
      return 0;
    }
  }
}
