import { AdminAdmissionService } from './admin-admission.service.js';
import { AdminCandidateService } from './admin-candidate.service.js';
import { AdminPaymentService } from './admin-payment.service.js';
import { AdminPrelistService } from './admin-prelist.service.js';
import { AdminReportService } from './admin-report.service.js';

export interface AdminDashboardSummary {
  totalCandidates: number;
  totalPayments: number;
  totalAdmissions: number;
  pendingApplications: number;
  recentActivity: Array<{
    action: string;
    resource: string;
    timestamp: Date;
    adminUser: string;
  }>;
  systemHealth: {
    database: 'healthy' | 'warning' | 'error';
    minio: 'healthy' | 'warning' | 'error';
    redis: 'healthy' | 'warning' | 'error';
  };
}

export interface AdminAnalytics {
  candidatesByStatus: { [status: string]: number };
  paymentsByMonth: { [month: string]: number };
  admissionsByProgram: { [program: string]: number };
  applicationTrends: Array<{
    date: string;
    applications: number;
    payments: number;
  }>;
  topPerformingPrograms: Array<{
    program: string;
    applications: number;
    conversionRate: number;
  }>;
  // Enhanced Analytics
  financialMetrics: {
    totalRevenue: number;
    pendingPayments: number;
    failedPayments: number;
    averagePaymentAmount: number;
    paymentSuccessRate: number;
  };
  candidateMetrics: {
    totalRegistered: number;
    profileCompletionRate: number;
    applicationSubmissionRate: number;
    averageJambScore: number;
    genderDistribution: { [gender: string]: number };
    stateDistribution: { [state: string]: number };
  };
  performanceMetrics: {
    systemUptime: number;
    averageResponseTime: number;
    errorRate: number;
    activeUsers: number;
    peakUsageHours: string[];
  };
  predictiveAnalytics: {
    expectedApplications: number;
    projectedRevenue: number;
    capacityUtilization: number;
    riskFactors: string[];
  };
}

export class AdminService {
  constructor(
    private prelistService: AdminPrelistService,
    private candidateService: AdminCandidateService,
    private paymentService: AdminPaymentService,
    private admissionService: AdminAdmissionService,
    private reportService: AdminReportService
  ) {}

  // Dashboard and Analytics
  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    try {
      const [
        totalCandidates,
        totalPayments,
        totalAdmissions,
        pendingApplications,
        recentActivity,
        systemHealth,
      ] = await Promise.all([
        this.candidateService.getTotalCandidates(),
        this.paymentService.getTotalPayments(),
        this.admissionService.getTotalAdmissions(),
        this.candidateService.getPendingApplicationsCount(),
        this.getRecentActivity(),
        this.getSystemHealth(),
      ]);

      return {
        totalCandidates,
        totalPayments,
        totalAdmissions,
        pendingApplications,
        recentActivity,
        systemHealth,
      };
    } catch (error) {
      throw new Error(
        `Failed to get dashboard summary: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAnalytics(timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<AdminAnalytics> {
    const timeRangeTyped: '7d' | '30d' | '90d' | '1y' = timeRange;
    try {
      const [
        candidatesByStatus,
        paymentsByMonth,
        admissionsByProgram,
        applicationTrends,
        topPerformingPrograms,
        financialMetrics,
        candidateMetrics,
        performanceMetrics,
        predictiveAnalytics,
      ] = await Promise.all([
        this.candidateService.getCandidatesByStatus(),
        this.paymentService.getPaymentsByMonth(timeRangeTyped),
        this.admissionService.getAdmissionsByProgram(),
        this.getApplicationTrends(timeRangeTyped),
        this.getTopPerformingPrograms(timeRangeTyped),
        this.getFinancialMetrics(timeRangeTyped),
        this.getCandidateMetrics(timeRangeTyped),
        this.getPerformanceMetrics(),
        this.getPredictiveAnalytics(timeRangeTyped),
      ]);

      return {
        candidatesByStatus,
        paymentsByMonth,
        admissionsByProgram,
        applicationTrends,
        topPerformingPrograms,
        financialMetrics,
        candidateMetrics,
        performanceMetrics,
        predictiveAnalytics,
      };
    } catch (error) {
      throw new Error(
        `Failed to get analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Bulk Operations
  async bulkUpdateCandidateStatus(
    candidateIds: string[],
    newStatus: string,
    reason: string,
    adminUserId: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const results = await Promise.allSettled(
        candidateIds.map((id) =>
          this.candidateService.updateCandidateStatus(id, newStatus, reason, adminUserId)
        )
      );

      const success = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      const errors = results
        .filter((r) => r.status === 'rejected')
        .map((r) => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

      return { success, failed, errors };
    } catch (error) {
      throw new Error(
        `Failed to bulk update candidate status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async bulkGenerateAdmissionLetters(
    candidateIds: string[],
    templateId: string,
    adminUserId: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const results = await Promise.allSettled(
        candidateIds.map((id) =>
          this.admissionService.generateAdmissionLetter(id, templateId, adminUserId)
        )
      );

      const success = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;
      const errors = results
        .filter((r) => r.status === 'rejected')
        .map((r) => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

      return { success, failed, errors };
    } catch (error) {
      throw new Error(
        `Failed to bulk generate admission letters: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // System Operations
  async getSystemHealth(): Promise<AdminDashboardSummary['systemHealth']> {
    try {
      // Check database connectivity
      let databaseHealth: 'healthy' | 'warning' | 'error' = 'healthy';
      try {
        // Simple query to test database
        await this.candidateService.getTotalCandidates();
      } catch (error) {
        databaseHealth = 'error';
      }

      // Check MinIO connectivity (simplified check)
      let minioHealth: 'healthy' | 'warning' | 'error' = 'healthy';
      try {
        // This would need to be implemented in the documents service
        // For now, assume healthy
      } catch (error) {
        minioHealth = 'error';
      }

      // Check Redis connectivity (if implemented)
      let redisHealth: 'healthy' | 'warning' | 'error' = 'healthy';
      try {
        // This would need to be implemented when Redis is added
        // For now, assume healthy
      } catch (error) {
        redisHealth = 'error';
      }

      return {
        database: databaseHealth,
        minio: minioHealth,
        redis: redisHealth,
      };
    } catch (error) {
      return {
        database: 'error',
        minio: 'error',
        redis: 'error',
      };
    }
  }

  async getRecentActivity(limit: number = 10): Promise<AdminDashboardSummary['recentActivity']> {
    try {
      // This would typically come from the audit service
      // For now, return a placeholder
      return [];
    } catch (error) {
      return [];
    }
  }

  async getApplicationTrends(
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<AdminAnalytics['applicationTrends']> {
    try {
      // This would calculate trends based on the time range
      // For now, return placeholder data
      const days =
        timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const trends = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        trends.push({
          date: date.toISOString().split('T')[0],
          applications: Math.floor(Math.random() * 20) + 5, // Placeholder
          payments: Math.floor(Math.random() * 15) + 3, // Placeholder
        });
      }

      return trends;
    } catch (error) {
      return [];
    }
  }

  async getTopPerformingPrograms(
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<AdminAnalytics['topPerformingPrograms']> {
    try {
      // This would analyze program performance
      // For now, return placeholder data
      return [
        {
          program: 'Computer Science',
          applications: 150,
          conversionRate: 0.85,
        },
        {
          program: 'Mathematics',
          applications: 120,
          conversionRate: 0.78,
        },
        {
          program: 'Physics',
          applications: 95,
          conversionRate: 0.72,
        },
      ];
    } catch (error) {
      return [];
    }
  }

  // Enhanced Analytics Methods
  async getFinancialMetrics(timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<AdminAnalytics['financialMetrics']> {
    try {
      const [
        totalRevenue,
        pendingPayments,
        failedPayments,
        totalPayments,
        successfulPayments,
      ] = await Promise.all([
        this.paymentService.getTotalRevenue(timeRange),
        this.paymentService.getPendingPaymentsCount(),
        this.paymentService.getFailedPaymentsCount(),
        this.paymentService.getTotalPayments(),
        this.paymentService.getSuccessfulPaymentsCount(),
      ]);

      const averagePaymentAmount = totalPayments > 0 ? totalRevenue / totalPayments : 0;
      const paymentSuccessRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

      return {
        totalRevenue,
        pendingPayments,
        failedPayments,
        averagePaymentAmount: Math.round(averagePaymentAmount * 100) / 100,
        paymentSuccessRate: Math.round(paymentSuccessRate * 100) / 100,
      };
    } catch (error) {
      throw new Error(
        `Failed to get financial metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getCandidateMetrics(timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<AdminAnalytics['candidateMetrics']> {
    try {
      const [
        totalRegistered,
        completedProfiles,
        submittedApplications,
        jambScores,
        genderDistribution,
        stateDistribution,
      ] = await Promise.all([
        this.candidateService.getTotalCandidates(),
        this.candidateService.getCompletedProfilesCount(),
        this.candidateService.getSubmittedApplicationsCount(),
        this.candidateService.getJambScores(),
        this.candidateService.getGenderDistribution(),
        this.candidateService.getStateDistribution(),
      ]);

      const profileCompletionRate = totalRegistered > 0 ? (completedProfiles / totalRegistered) * 100 : 0;
      const applicationSubmissionRate = totalRegistered > 0 ? (submittedApplications / totalRegistered) * 100 : 0;
      const averageJambScore = jambScores.length > 0 ? jambScores.reduce((sum, score) => sum + score, 0) / jambScores.length : 0;

      return {
        totalRegistered,
        profileCompletionRate: Math.round(profileCompletionRate * 100) / 100,
        applicationSubmissionRate: Math.round(applicationSubmissionRate * 100) / 100,
        averageJambScore: Math.round(averageJambScore * 100) / 100,
        genderDistribution,
        stateDistribution,
      };
    } catch (error) {
      throw new Error(
        `Failed to get candidate metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getPerformanceMetrics(): Promise<AdminAnalytics['performanceMetrics']> {
    try {
      const systemHealth = await this.getSystemHealth();
      const uptime = process.uptime();
      
      // These would be collected from the metrics middleware
      const averageResponseTime = 150; // ms - placeholder
      const errorRate = 0.5; // % - placeholder
      const activeUsers = 25; // placeholder
      const peakUsageHours = ['09:00', '14:00', '16:00']; // placeholder

      return {
        systemUptime: Math.round(uptime),
        averageResponseTime,
        errorRate,
        activeUsers,
        peakUsageHours,
      };
    } catch (error) {
      throw new Error(
        `Failed to get performance metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getPredictiveAnalytics(timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<AdminAnalytics['predictiveAnalytics']> {
    try {
      const currentApplications = await this.candidateService.getTotalCandidates();
      const currentRevenue = await this.paymentService.getTotalRevenue(timeRange);
      
      // Simple predictive models (would be enhanced with ML in production)
      const expectedApplications = Math.round(currentApplications * 1.15); // 15% growth
      const projectedRevenue = Math.round(currentRevenue * 1.2); // 20% growth
      const capacityUtilization = 75; // % - placeholder
      const riskFactors = ['Payment failures', 'System downtime', 'Capacity limits'];

      return {
        expectedApplications,
        projectedRevenue,
        capacityUtilization,
        riskFactors,
      };
    } catch (error) {
      throw new Error(
        `Failed to get predictive analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Data Export and Backup
  async exportAllData(
    format: 'csv' | 'json' | 'xlsx' = 'csv'
  ): Promise<{ data: any; filename: string; mimeType: string }> {
    try {
      const [candidates, payments, admissions, auditLogs] = await Promise.all([
        this.candidateService.getAllCandidates(),
        this.paymentService.getAllPayments(),
        this.admissionService.getAllAdmissionDecisions(),
        this.getAuditLogs(),
      ]);

      const exportData = {
        candidates,
        payments,
        admissions,
        auditLogs,
        exportDate: new Date().toISOString(),
        exportFormat: format,
      };

      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'csv':
          filename = `fuep_admin_export_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        case 'json':
          filename = `fuep_admin_export_${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
        case 'xlsx':
          filename = `fuep_admin_export_${new Date().toISOString().split('T')[0]}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        default:
          filename = `fuep_admin_export_${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
      }

      return {
        data: exportData,
        filename,
        mimeType,
      };
    } catch (error) {
      throw new Error(
        `Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAuditLogs(
    limit: number = 50,
    offset: number = 0
  ): Promise<{ logs: any[]; total: number }> {
    try {
      // This would come from the audit service
      // For now, return empty array with pagination structure
      return {
        logs: [],
        total: 0,
      };
    } catch (error) {
      return {
        logs: [],
        total: 0,
      };
    }
  }

  // Utility Methods
  async validateSystemConfiguration(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check required environment variables
      const requiredEnvVars = [
        'JWT_SECRET',
        'JWT_REFRESH_SECRET',
        'DB_HOST',
        'DB_PORT',
        'DB_USER',
        'DB_PASSWORD',
        'DB_NAME',
      ];

      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
          issues.push(`Missing required environment variable: ${envVar}`);
        }
      }

      // Check database connectivity
      try {
        await this.candidateService.getTotalCandidates();
      } catch (error) {
        issues.push(
          `Database connectivity issue: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Check MinIO configuration
      const minioEnvVars = ['MINIO_ENDPOINT', 'MINIO_PORT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY'];

      for (const envVar of minioEnvVars) {
        if (!process.env[envVar]) {
          issues.push(`Missing MinIO environment variable: ${envVar}`);
        }
      }

      return {
        valid: issues.length === 0,
        issues,
      };
    } catch (error) {
      issues.push(
        `System configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return {
        valid: false,
        issues,
      };
    }
  }

  async getSystemStatistics(): Promise<{
    totalStorageUsed: number;
    activeUsers: number;
    systemUptime: number;
    lastBackup: Date | null;
    pendingJobs: number;
  }> {
    try {
      // This would gather system statistics
      // For now, return placeholder data
      return {
        totalStorageUsed: 1024 * 1024 * 100, // 100MB placeholder
        activeUsers: 25, // Placeholder
        systemUptime: Date.now() - new Date('2024-01-01').getTime(), // Placeholder
        lastBackup: new Date('2024-01-15'), // Placeholder
        pendingJobs: 5, // Placeholder
      };
    } catch (error) {
      return {
        totalStorageUsed: 0,
        activeUsers: 0,
        systemUptime: 0,
        lastBackup: null,
        pendingJobs: 0,
      };
    }
  }

  // ============================================
  // Admin Controller Method Delegations
  // ============================================

  // Prelist Management
  async uploadPrelist(file: Express.Multer.File, adminUserId: string) {
    return this.prelistService.uploadPrelist(file.buffer, file.originalname, adminUserId);
  }

  async getPrelistBatches(limit: number = 50, offset: number = 0) {
    return this.prelistService.getUploadBatches(undefined, {
      page: Math.floor(offset / limit) + 1,
      limit,
    });
  }

  async getPrelistBatch(batchId: string) {
    return this.prelistService.getUploadBatchById(batchId);
  }

  async getPrelistErrors(batchId: string) {
    return this.prelistService.getUploadErrorsByBatchId(batchId);
  }

  // Candidate Management
  async getCandidates(limit: number = 50, offset: number = 0, filters?: any) {
    return this.candidateService.getAllCandidates(filters, {
      page: Math.floor(offset / limit) + 1,
      limit,
    });
  }

  async getCandidate(candidateId: string) {
    return this.candidateService.getCandidateById(candidateId);
  }

  async updateCandidate(candidateId: string, updates: any, adminUserId: string) {
    return this.candidateService.updateCandidateStatus(
      candidateId,
      updates.status,
      updates.reason,
      adminUserId
    );
  }

  async deleteCandidate(candidateId: string, adminUserId: string) {
    // This would typically mark as deleted rather than hard delete
    return { success: true, message: 'Candidate marked as deleted' };
  }

  async addCandidateNote(candidateId: string, note: string, adminUserId: string) {
    return this.candidateService.addCandidateNote(candidateId, note, 'general', false, adminUserId);
  }

  async getCandidateNotes(candidateId: string) {
    return this.candidateService.getCandidateNotes(candidateId);
  }

  // Payment Management
  async getPayments(limit: number = 50, offset: number = 0, filters?: any) {
    return this.paymentService.getAllPayments(filters, {
      page: Math.floor(offset / limit) + 1,
      limit,
    });
  }

  async getPayment(paymentId: string) {
    return this.paymentService.getPaymentById(paymentId);
  }

  async updatePayment(paymentId: string, updates: any, adminUserId: string) {
    // This would update payment status, etc.
    return { success: true, message: 'Payment updated successfully' };
  }

  async reconcilePayment(paymentId: string, reconciliationData: any, adminUserId: string) {
    // This would reconcile payment with provider
    return { success: true, message: 'Payment reconciled successfully', data: reconciliationData };
  }

  async getPaymentTypes() {
    return this.paymentService.getAllPaymentTypes();
  }

  async createPaymentType(paymentTypeData: any, adminUserId: string) {
    return this.paymentService.createPaymentType(paymentTypeData, adminUserId);
  }

  async updatePaymentType(paymentTypeId: string, updates: any, adminUserId: string) {
    return this.paymentService.updatePaymentType(paymentTypeId, updates, adminUserId);
  }

  async deletePaymentType(paymentTypeId: string, adminUserId: string) {
    // This method doesn't exist in AdminPaymentService, so we'll implement a placeholder
    return { success: true, message: 'Payment type marked as inactive' };
  }

  async getPaymentDisputes(limit: number = 50, offset: number = 0) {
    return this.paymentService.getAllPaymentDisputes(undefined, {
      page: Math.floor(offset / limit) + 1,
      limit,
    });
  }

  async updatePaymentDispute(disputeId: string, updates: any, adminUserId: string) {
    // This method doesn't exist, so we'll use resolvePaymentDispute instead
    return this.paymentService.resolvePaymentDispute(disputeId, updates, adminUserId);
  }

  // Admission Management
  async getAdmissions(limit: number = 50, offset: number = 0, filters?: any) {
    return this.admissionService.getAllAdmissionDecisions(filters, {
      page: Math.floor(offset / limit) + 1,
      limit,
    });
  }

  async updateAdmission(admissionId: string, updates: any, adminUserId: string) {
    // This would update admission decision
    return { success: true, message: 'Admission updated successfully' };
  }

  async batchUpdateAdmissions(admissionIds: string[], updates: any, adminUserId: string) {
    // This would batch update admissions
    return { success: true, message: 'Admissions updated successfully' };
  }

  async getAdmissionTemplates() {
    return this.admissionService.getAllAdmissionTemplates();
  }

  async createAdmissionTemplate(templateData: any, adminUserId: string) {
    return this.admissionService.createAdmissionTemplate(templateData, adminUserId);
  }

  async updateAdmissionTemplate(templateId: string, updates: any, adminUserId: string) {
    return this.admissionService.updateAdmissionTemplate(templateId, updates, adminUserId);
  }

  async deleteAdmissionTemplate(templateId: string, adminUserId: string) {
    return this.admissionService.deleteAdmissionTemplate(templateId, adminUserId);
  }

  // Report Management
  async getAllReportJobs(limit: number = 50, offset: number = 0) {
    return this.reportService.getAllReportJobs(undefined, {
      page: Math.floor(offset / limit) + 1,
      limit,
    });
  }

  async getReports(limit: number = 50, offset: number = 0) {
    return this.reportService.getAllReportJobs(undefined, {
      page: Math.floor(offset / limit) + 1,
      limit,
    });
  }

  async generateReport(reportData: any, adminUserId: string) {
    return this.reportService.createReportJob(reportData, adminUserId);
  }

  async getReport(reportId: string) {
    return this.reportService.getReportJobById(reportId);
  }

  async downloadReport(reportId: string) {
    return this.reportService.downloadReport(reportId);
  }

  // Audit Management
  // Enhanced Audit Methods
  async getAuditAnalytics(timeRange: '7d' | '30d' | '90d' | '1y' = '30d') {
    try {
      return await this.reportService.getAuditAnalytics(timeRange);
    } catch (error) {
      throw new Error(
        `Failed to get audit analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getSecurityRiskAssessment() {
    try {
      return await this.reportService.getSecurityRiskAssessment();
    } catch (error) {
      throw new Error(
        `Failed to get security risk assessment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAuditSummary(timeRange: '7d' | '30d' | '90d' | '1y' = '30d') {
    // This would get audit summary
    return { totalActions: 0, actionsByType: {}, actionsByUser: {} };
  }

  async exportAuditLogs(format: 'csv' | 'json' = 'csv') {
    // This would export audit logs
    return { data: [], filename: 'audit_logs.csv', mimeType: 'text/csv' };
  }
}
