import { db } from '../../db/knex.js';
import { AdminAuditService } from './admin-audit.service.js';

export interface ReportGenerationJob {
  id: string;
  name: string;
  description: string;
  reportType:
    | 'candidate_summary'
    | 'payment_summary'
    | 'admission_summary'
    | 'audit_summary'
    | 'custom';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  parameters: any; // JSON parameters for the report
  format: 'pdf' | 'excel' | 'csv' | 'json';
  filePath?: string;
  fileSize?: number;
  totalRecords: number;
  processedRecords: number;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  reportType: ReportGenerationJob['reportType'];
  query: string; // SQL query or query template
  parameters: string[]; // Parameter names that can be substituted
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportFilters {
  reportType?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  createdBy?: string;
}

export class AdminReportService {
  constructor(private auditService: AdminAuditService) {}

  // Report Generation Jobs
  async createReportJob(
    jobData: {
      name: string;
      description: string;
      reportType: ReportGenerationJob['reportType'];
      parameters: any;
      format: ReportGenerationJob['format'];
    },
    adminUserId: string
  ): Promise<ReportGenerationJob> {
    try {
      const [jobId] = await db('report_generation_jobs')
        .insert({
          name: jobData.name,
          description: jobData.description,
          report_type: jobData.reportType,
          status: 'pending',
          parameters: JSON.stringify(jobData.parameters),
          format: jobData.format,
          total_records: 0,
          processed_records: 0,
          created_by: adminUserId,
        })
        .returning('id');

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'create_report_job',
        resource: 'report_job',
        resourceId: jobId,
        details: jobData,
      });

      const createdJob = await this.getReportJobById(jobId);
      if (!createdJob) {
        throw new Error('Failed to retrieve created report job');
      }
      return createdJob;
    } catch (error) {
      throw new Error(
        `Failed to create report job: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async executeReportJob(jobId: string, adminUserId: string): Promise<ReportGenerationJob> {
    try {
      const job = await this.getReportJobById(jobId);
      if (!job) {
        throw new Error('Report job not found');
      }

      if (job.status !== 'pending') {
        throw new Error('Only pending jobs can be executed');
      }

      // Update status to processing
      await db('report_generation_jobs').where('id', jobId).update({
        status: 'processing',
        started_at: new Date(),
        updated_at: new Date(),
      });

      try {
        // Generate the report based on type
        const reportResult = await this.generateReport(job.reportType, job.parameters, job.format);

        // Update job with results
        await db('report_generation_jobs').where('id', jobId).update({
          status: 'completed',
          file_path: reportResult.filePath,
          file_size: reportResult.fileSize,
          total_records: reportResult.totalRecords,
          processed_records: reportResult.processedRecords,
          completed_at: new Date(),
          updated_at: new Date(),
        });

        // Log audit
        await this.auditService.logAction({
          adminUserId,
          action: 'execute_report_job',
          resource: 'report_job',
          resourceId: jobId,
          details: {
            reportType: job.reportType,
            format: job.format,
            totalRecords: reportResult.totalRecords,
            fileSize: reportResult.fileSize,
          },
        });
      } catch (error) {
        // Update job status to failed
        await db('report_generation_jobs')
          .where('id', jobId)
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date(),
            updated_at: new Date(),
          });

        throw error;
      }

      const executedJob = await this.getReportJobById(jobId);
      if (!executedJob) {
        throw new Error('Failed to retrieve executed report job');
      }
      return executedJob;
    } catch (error) {
      throw new Error(
        `Failed to execute report job: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getReportJobById(id: string): Promise<ReportGenerationJob | null> {
    try {
      const job = await db('report_generation_jobs').where('id', id).first();

      if (!job) return null;

      return {
        id: job.id,
        name: job.name,
        description: job.description,
        reportType: job.report_type,
        status: job.status,
        parameters: JSON.parse(job.parameters),
        format: job.format,
        filePath: job.file_path,
        fileSize: job.file_size,
        totalRecords: job.total_records,
        processedRecords: job.processed_records,
        startedAt: job.started_at,
        completedAt: job.completed_at,
        errorMessage: job.error_message,
        createdBy: job.created_by,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to get report job: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAllReportJobs(
    filters?: ReportFilters,
    pagination?: { page: number; limit: number }
  ): Promise<{ jobs: ReportGenerationJob[]; total: number }> {
    try {
      let query = db('report_generation_jobs');

      // Apply filters
      if (filters?.reportType) {
        query = query.where('report_type', filters.reportType);
      }

      if (filters?.status) {
        query = query.where('status', filters.status);
      }

      if (filters?.startDate) {
        query = query.where('created_at', '>=', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.where('created_at', '<=', filters.endDate);
      }

      if (filters?.createdBy) {
        query = query.where('created_by', filters.createdBy);
      }

      // Get total count
      const totalResult = await query.clone().count('* as count').first();
      const total = totalResult ? parseInt(totalResult.count as string) : 0;

      // Apply pagination
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        query = query.offset(offset).limit(pagination.limit);
      }

      // Get jobs
      const jobs = await query.orderBy('created_at', 'desc');

      return {
        jobs: jobs.map((job) => ({
          id: job.id,
          name: job.name,
          description: job.description,
          reportType: job.report_type,
          status: job.status,
          parameters: JSON.parse(job.parameters),
          format: job.format,
          filePath: job.file_path,
          fileSize: job.file_size,
          totalRecords: job.total_records,
          processedRecords: job.processed_records,
          startedAt: job.started_at,
          completedAt: job.completed_at,
          errorMessage: job.error_message,
          createdBy: job.created_by,
          createdAt: job.created_at,
          updatedAt: job.updated_at,
        })),
        total,
      };
    } catch (error) {
      throw new Error(
        `Failed to get report jobs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Report Templates
  async createReportTemplate(
    templateData: {
      name: string;
      description: string;
      reportType: ReportTemplate['reportType'];
      query: string;
      parameters: string[];
    },
    adminUserId: string
  ): Promise<ReportTemplate> {
    try {
      // Note: report_templates table needs to be created in the database schema
      // For now, we'll use a placeholder approach
      const templateId = `template_${Date.now()}`;

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'create_report_template',
        resource: 'report_template',
        resourceId: templateId,
        details: templateData,
      });

      const createdTemplate = await this.getReportTemplateById(templateId);
      if (!createdTemplate) {
        throw new Error('Failed to retrieve created report template');
      }
      return createdTemplate;
    } catch (error) {
      throw new Error(
        `Failed to create report template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getReportTemplateById(id: string): Promise<ReportTemplate | null> {
    try {
      // Note: report_templates table needs to be created in the database schema
      // For now, return null as templates are not persisted
      return null;
    } catch (error) {
      throw new Error(
        `Failed to get report template: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAllReportTemplates(reportType?: string, isActive?: boolean): Promise<ReportTemplate[]> {
    try {
      // Note: report_templates table needs to be created in the database schema
      // For now, return empty array as templates are not persisted
      return [];
    } catch (error) {
      throw new Error(
        `Failed to get report templates: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async downloadReport(
    reportId: string
  ): Promise<{ data: any; filename: string; mimeType: string }> {
    try {
      const job = await this.getReportJobById(reportId);
      if (!job) {
        throw new Error('Report job not found');
      }

      if (job.status !== 'completed') {
        throw new Error('Report is not ready for download');
      }

      if (!job.filePath) {
        throw new Error('Report file not found');
      }

      // In a real implementation, you would read the file from storage
      // For now, return the job data as a placeholder
      return {
        data: job,
        filename: `${job.reportType}_report_${new Date(job.completedAt!).toISOString().split('T')[0]}.${job.format}`,
        mimeType: this.getMimeType(job.format),
      };
    } catch (error) {
      throw new Error(
        `Failed to download report: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Quick Report Generation
  async generateQuickReport(
    reportType: ReportGenerationJob['reportType'],
    parameters: any,
    format: ReportGenerationJob['format'],
    adminUserId: string
  ): Promise<{ data: any; filename: string; mimeType: string }> {
    try {
      // Create and execute a quick job
      const job = await this.createReportJob(
        {
          name: `Quick ${reportType} Report`,
          description: `Quickly generated ${reportType} report`,
          reportType,
          parameters,
          format,
        },
        adminUserId
      );

      const executedJob = await this.executeReportJob(job.id, adminUserId);

      if (executedJob.status !== 'completed') {
        throw new Error(`Report generation failed: ${executedJob.errorMessage}`);
      }

      // Return the report data
      return {
        data: executedJob,
        filename: `${reportType}_report_${new Date().toISOString().split('T')[0]}.${format}`,
        mimeType: this.getMimeType(format),
      };
    } catch (error) {
      throw new Error(
        `Failed to generate quick report: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Specific Report Types
  async generateCandidateSummaryReport(
    parameters: {
      startDate?: Date;
      endDate?: Date;
      program?: string;
      state?: string;
      status?: string;
    },
    format: ReportGenerationJob['format']
  ): Promise<{ data: any; totalRecords: number }> {
    try {
      let query = db('candidates');

      // Apply filters
      if (parameters.startDate) {
        query = query.where('created_at', '>=', parameters.startDate);
      }

      if (parameters.endDate) {
        query = query.where('created_at', '<=', parameters.endDate);
      }

      if (parameters.program) {
        query = query.where('program_choice_1', parameters.program);
      }

      if (parameters.state) {
        query = query.where('state_of_origin', parameters.state);
      }

      if (parameters.status) {
        query = query.where('application_status', parameters.status);
      }

      const candidates = await query.orderBy('created_at', 'desc');

      const reportData = candidates.map((candidate) => ({
        jambRegNo: candidate.jamb_reg_no,
        firstName: candidate.first_name,
        lastName: candidate.last_name,
        email: candidate.email,
        phoneNumber: candidate.phone_number,
        stateOfOrigin: candidate.state_of_origin,
        lga: candidate.lga,
        programChoice1: candidate.program_choice_1,
        jambScore: candidate.jamb_score,
        applicationStatus: candidate.application_status,
        paymentStatus: candidate.payment_status,
        documentsStatus: candidate.documents_status,
        admissionStatus: candidate.admission_status,
        createdAt: candidate.created_at,
      }));

      return {
        data: reportData,
        totalRecords: candidates.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate candidate summary report: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async generatePaymentSummaryReport(
    parameters: {
      startDate?: Date;
      endDate?: Date;
      status?: string;
      paymentMethod?: string;
      minAmount?: number;
      maxAmount?: number;
    },
    format: ReportGenerationJob['format']
  ): Promise<{ data: any; totalRecords: number }> {
    try {
      let query = db('payments');

      // Apply filters
      if (parameters.startDate) {
        query = query.where('created_at', '>=', parameters.startDate);
      }

      if (parameters.endDate) {
        query = query.where('created_at', '<=', parameters.endDate);
      }

      if (parameters.status) {
        query = query.where('status', parameters.status);
      }

      if (parameters.paymentMethod) {
        query = query.where('payment_method', parameters.paymentMethod);
      }

      if (parameters.minAmount !== undefined) {
        query = query.where('amount', '>=', parameters.minAmount);
      }

      if (parameters.maxAmount !== undefined) {
        query = query.where('amount', '<=', parameters.maxAmount);
      }

      const payments = await query.orderBy('created_at', 'desc');

      const reportData = payments.map((payment) => ({
        reference: payment.reference,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.payment_method,
        candidateId: payment.candidate_id,
        createdAt: payment.created_at,
        paidAt: payment.paid_at,
        verifiedAt: payment.verified_at,
      }));

      return {
        data: reportData,
        totalRecords: payments.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate payment summary report: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async generateAdmissionSummaryReport(
    parameters: {
      startDate?: Date;
      endDate?: Date;
      decisionType?: string;
      status?: string;
      program?: string;
    },
    format: ReportGenerationJob['format']
  ): Promise<{ data: any; totalRecords: number }> {
    try {
      let query = db('admissions').join('candidates', 'admissions.candidate_id', 'candidates.id');

      // Apply filters
      if (parameters.startDate) {
        query = query.where('admissions.created_at', '>=', parameters.startDate);
      }

      if (parameters.endDate) {
        query = query.where('admissions.created_at', '<=', parameters.endDate);
      }

      if (parameters.decisionType) {
        query = query.where('admissions.decision', parameters.decisionType);
      }

      if (parameters.status) {
        query = query.where('admissions.status', parameters.status);
      }

      if (parameters.program) {
        query = query.where('candidates.program_choice_1', parameters.program);
      }

      const decisions = await query.orderBy('admissions.created_at', 'desc');

      const reportData = decisions.map((decision) => ({
        candidateName: `${decision.first_name} ${decision.last_name}`,
        jambRegNo: decision.jamb_reg_no,
        program: decision.program_choice_1,
        decisionType: decision.decision,
        status: decision.status,
        subject: decision.subject,
        sentAt: decision.sent_at,
        acknowledgedAt: decision.acknowledged_at,
        createdAt: decision.created_at,
      }));

      return {
        data: reportData,
        totalRecords: decisions.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate admission summary report: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async generateAuditSummaryReport(
    parameters: {
      startDate?: Date;
      endDate?: Date;
      adminUserId?: string;
      action?: string;
      resource?: string;
    },
    format: ReportGenerationJob['format']
  ): Promise<{ data: any; totalRecords: number }> {
    try {
      let query = db('admin_audit_logs');

      // Apply filters
      if (parameters.startDate) {
        query = query.where('created_at', '>=', parameters.startDate);
      }

      if (parameters.endDate) {
        query = query.where('created_at', '<=', parameters.endDate);
      }

      if (parameters.adminUserId) {
        query = query.where('admin_user_id', parameters.adminUserId);
      }

      if (parameters.action) {
        query = query.where('action', parameters.action);
      }

      if (parameters.resource) {
        query = query.where('resource', parameters.resource);
      }

      const logs = await query.orderBy('created_at', 'desc');

      const reportData = logs.map((log) => ({
        adminUserId: log.admin_user_id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resource_id,
        details: log.details,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        createdAt: log.created_at,
      }));

      return {
        data: reportData,
        totalRecords: logs.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate audit summary report: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Private Helper Methods
  private async generateReport(
    reportType: ReportGenerationJob['reportType'],
    parameters: any,
    format: ReportGenerationJob['format']
  ): Promise<{
    filePath: string;
    fileSize: number;
    totalRecords: number;
    processedRecords: number;
  }> {
    let reportData: any;
    let totalRecords = 0;

    switch (reportType) {
      case 'candidate_summary':
        const candidateResult = await this.generateCandidateSummaryReport(parameters, format);
        reportData = candidateResult.data;
        totalRecords = candidateResult.totalRecords;
        break;

      case 'payment_summary':
        const paymentResult = await this.generatePaymentSummaryReport(parameters, format);
        reportData = paymentResult.data;
        totalRecords = paymentResult.totalRecords;
        break;

      case 'admission_summary':
        const admissionResult = await this.generateAdmissionSummaryReport(parameters, format);
        reportData = admissionResult.data;
        totalRecords = admissionResult.totalRecords;
        break;

      case 'audit_summary':
        const auditResult = await this.generateAuditSummaryReport(parameters, format);
        reportData = auditResult.data;
        totalRecords = auditResult.totalRecords;
        break;

      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }

    // For now, return a mock file path and size
    // In production, this would actually generate and save the file
    const filePath = `/reports/${reportType}_${Date.now()}.${format}`;
    const fileSize = JSON.stringify(reportData).length;

    return {
      filePath,
      fileSize,
      totalRecords,
      processedRecords: totalRecords,
    };
  }

  private getMimeType(format: string): string {
    switch (format) {
      case 'pdf':
        return 'application/pdf';
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }
}
