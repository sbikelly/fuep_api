import { db } from '../../db/knex.js';

export interface AuditLogEntry {
  id: string;
  adminUserId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  // Enhanced audit fields
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'security' | 'data' | 'system' | 'user' | 'financial';
  outcome?: 'success' | 'failure' | 'partial';
  duration?: number; // milliseconds
  relatedLogs?: string[]; // IDs of related audit entries
}

export interface CreateAuditLogParams {
  adminUserId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AdminAuditService {
  async logAction(params: CreateAuditLogParams): Promise<AuditLogEntry> {
    try {
      const [auditLog] = await db('admin_audit_logs')
        .insert({
          admin_user_id: params.adminUserId,
          action: params.action,
          resource: params.resource,
          resource_id: params.resourceId,
          details: params.details ? JSON.stringify(params.details) : null,
          ip_address: params.ipAddress,
          user_agent: params.userAgent,
        })
        .returning('*');

      return {
        id: auditLog.id,
        adminUserId: auditLog.admin_user_id,
        action: auditLog.action,
        resource: auditLog.resource,
        resourceId: auditLog.resource_id,
        details: auditLog.details ? JSON.parse(auditLog.details) : undefined,
        ipAddress: auditLog.ip_address,
        userAgent: auditLog.user_agent,
        createdAt: new Date(auditLog.created_at),
      };
    } catch (error: any) {
      // Enhanced error logging with context
      const errorContext = {
        timestamp: new Date().toISOString(),
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        adminUserId: params.adminUserId,
        error: {
          message: error.message,
          stack: error.stack,
          code: error.code,
        },
        params: {
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      };
      
      console.error('Failed to log audit entry:', JSON.stringify(errorContext, null, 2));
      
      // Don't throw error to avoid breaking main operations
      // Return a mock entry for now
      return {
        id: 'audit-failed',
        adminUserId: params.adminUserId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        createdAt: new Date(),
      };
    }
  }

  // Enhanced audit logging with performance tracking
  async logActionWithPerformance(params: CreateAuditLogParams & {
    startTime: number;
    outcome?: 'success' | 'failure' | 'partial';
    severity?: 'low' | 'medium' | 'high' | 'critical';
    category?: 'security' | 'data' | 'system' | 'user' | 'financial';
  }): Promise<AuditLogEntry> {
    const duration = Date.now() - params.startTime;
    
    return this.logAction({
      ...params,
      details: {
        ...params.details,
        performance: { duration, startTime: params.startTime },
        outcome: params.outcome,
        severity: params.severity,
        category: params.category,
      },
    });
  }

  // Bulk audit logging for batch operations
  async logBulkAction(params: {
    adminUserId: string;
    action: string;
    resource: string;
    items: Array<{
      resourceId: string;
      details?: any;
      outcome: 'success' | 'failure' | 'partial';
    }>;
    ipAddress?: string;
    userAgent?: string;
    summary?: any;
  }): Promise<AuditLogEntry[]> {
    const auditLogs: AuditLogEntry[] = [];
    
    for (const item of params.items) {
      const auditLog = await this.logAction({
        adminUserId: params.adminUserId,
        action: params.action,
        resource: params.resource,
        resourceId: item.resourceId,
        details: {
          ...item.details,
          bulkOperation: true,
          summary: params.summary,
          totalItems: params.items.length,
        },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
      
      auditLogs.push(auditLog);
    }
    
    return auditLogs;
  }

  // Security-focused audit logging
  async logSecurityEvent(params: CreateAuditLogParams & {
    severity: 'low' | 'medium' | 'high' | 'critical';
    threatLevel?: 'none' | 'low' | 'medium' | 'high';
    source?: 'internal' | 'external' | 'system';
    mitigation?: string;
  }): Promise<AuditLogEntry> {
    return this.logAction({
      ...params,
      details: {
        ...params.details,
        security: {
          severity: params.severity,
          threatLevel: params.threatLevel,
          source: params.source,
          mitigation: params.mitigation,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  // Data access audit logging
  async logDataAccess(params: CreateAuditLogParams & {
    dataType: string;
    accessLevel: 'read' | 'write' | 'delete';
    sensitiveData: boolean;
    justification?: string;
  }): Promise<AuditLogEntry> {
    return this.logAction({
      ...params,
      details: {
        ...params.details,
        dataAccess: {
          dataType: params.dataType,
          accessLevel: params.accessLevel,
          sensitiveData: params.sensitiveData,
          justification: params.justification,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  async getAuditLogs(filters?: {
    adminUserId?: string;
    action?: string;
    resource?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    category?: 'security' | 'data' | 'system' | 'user' | 'financial';
    outcome?: 'success' | 'failure' | 'partial';
  }): Promise<{ logs: AuditLogEntry[]; total: number }> {
    try {
      let query = db('admin_audit_logs').select('*').orderBy('created_at', 'desc');

      // Apply filters
      if (filters?.adminUserId) {
        query = query.where({ admin_user_id: filters.adminUserId });
      }

      if (filters?.action) {
        query = query.where({ action: filters.action });
      }

      if (filters?.resource) {
        query = query.where({ resource: filters.resource });
      }

      if (filters?.resourceId) {
        query = query.where({ resource_id: filters.resourceId });
      }

      if (filters?.startDate) {
        query = query.where('created_at', '>=', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.where('created_at', '<=', filters.endDate);
      }

      // Get total count
      const countQuery = query.clone();
      const totalResult = await countQuery.count('* as total');
      const total = parseInt(totalResult[0].total as string);

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.offset(filters.offset);
      }

      const logs = await query;

      return {
        logs: logs.map((log) => ({
          id: log.id,
          adminUserId: log.admin_user_id,
          action: log.action,
          resource: log.resource,
          resourceId: log.resource_id,
          details: log.details ? JSON.parse(log.details) : undefined,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          createdAt: new Date(log.created_at),
        })),
        total,
      };
    } catch (error: any) {
      throw new Error(`Failed to get audit logs: ${error.message}`);
    }
  }

  async getAuditLogById(id: string): Promise<AuditLogEntry | null> {
    try {
      const log = await db('admin_audit_logs').where({ id }).first();

      if (!log) {
        return null;
      }

      return {
        id: log.id,
        adminUserId: log.admin_user_id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resource_id,
        details: log.details ? JSON.parse(log.details) : undefined,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        createdAt: new Date(log.created_at),
      };
    } catch (error: any) {
      throw new Error(`Failed to get audit log: ${error.message}`);
    }
  }

  async getAuditLogsByResource(resource: string, resourceId?: string): Promise<AuditLogEntry[]> {
    try {
      let query = db('admin_audit_logs').where({ resource }).orderBy('created_at', 'desc');

      if (resourceId) {
        query = query.where({ resource_id: resourceId });
      }

      const logs = await query;

      return logs.map((log) => ({
        id: log.id,
        adminUserId: log.admin_user_id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resource_id,
        details: log.details ? JSON.parse(log.details) : undefined,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        createdAt: new Date(log.created_at),
      }));
    } catch (error: any) {
      throw new Error(`Failed to get audit logs by resource: ${error.message}`);
    }
  }

  async getAuditLogsByAdminUser(adminUserId: string, limit?: number): Promise<AuditLogEntry[]> {
    try {
      let query = db('admin_audit_logs')
        .where({ admin_user_id: adminUserId })
        .orderBy('created_at', 'desc');

      if (limit) {
        query = query.limit(limit);
      }

      const logs = await query;

      return logs.map((log) => ({
        id: log.id,
        adminUserId: log.admin_user_id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resource_id,
        details: log.details ? JSON.parse(log.details) : undefined,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        createdAt: new Date(log.created_at),
      }));
    } catch (error: any) {
      throw new Error(`Failed to get audit logs by admin user: ${error.message}`);
    }
  }

  async getAuditSummary(filters?: {
    startDate?: Date;
    endDate?: Date;
    adminUserId?: string;
  }): Promise<{
    totalActions: number;
    actionsByType: { [action: string]: number };
    actionsByResource: { [resource: string]: number };
    actionsByAdmin: { [adminUserId: string]: number };
    recentActivity: AuditLogEntry[];
  }> {
    try {
      let baseQuery = db('admin_audit_logs');

      // Apply date filters
      if (filters?.startDate) {
        baseQuery = baseQuery.where('created_at', '>=', filters.startDate);
      }

      if (filters?.endDate) {
        baseQuery = baseQuery.where('created_at', '<=', filters.endDate);
      }

      if (filters?.adminUserId) {
        baseQuery = baseQuery.where({ admin_user_id: filters.adminUserId });
      }

      // Get total actions
      const totalResult = await baseQuery.clone().count('* as total');
      const totalActions = parseInt(totalResult[0].total as string);

      // Get actions by type
      const actionsByTypeResult = await baseQuery
        .clone()
        .select('action')
        .count('* as count')
        .groupBy('action');

      const actionsByType: { [action: string]: number } = {};
      actionsByTypeResult.forEach((row) => {
        actionsByType[row.action] = parseInt(row.count as string);
      });

      // Get actions by resource
      const actionsByResourceResult = await baseQuery
        .clone()
        .select('resource')
        .count('* as count')
        .groupBy('resource');

      const actionsByResource: { [resource: string]: number } = {};
      actionsByResourceResult.forEach((row) => {
        actionsByResource[row.resource] = parseInt(row.count as string);
      });

      // Get actions by admin user
      const actionsByAdminResult = await baseQuery
        .clone()
        .select('admin_user_id')
        .count('* as count')
        .groupBy('admin_user_id');

      const actionsByAdmin: { [adminUserId: string]: number } = {};
      actionsByAdminResult.forEach((row) => {
        actionsByAdmin[row.admin_user_id] = parseInt(row.count as string);
      });

      // Get recent activity
      const recentActivity = await baseQuery.clone().orderBy('created_at', 'desc').limit(10);

      return {
        totalActions,
        actionsByType,
        actionsByResource,
        actionsByAdmin,
        recentActivity: recentActivity.map((log) => ({
          id: log.id,
          adminUserId: log.admin_user_id,
          action: log.action,
          resource: log.resource,
          resourceId: log.resource_id,
          details: log.details ? JSON.parse(log.details) : undefined,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          createdAt: new Date(log.created_at),
        })),
      };
    } catch (error: any) {
      throw new Error(`Failed to get audit summary: ${error.message}`);
    }
  }

  async exportAuditLogs(filters?: {
    adminUserId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLogEntry[]> {
    try {
      let query = db('admin_audit_logs').select('*').orderBy('created_at', 'desc');

      // Apply filters
      if (filters?.adminUserId) {
        query = query.where({ admin_user_id: filters.adminUserId });
      }

      if (filters?.action) {
        query = query.where({ action: filters.action });
      }

      if (filters?.resource) {
        query = query.where({ resource: filters.resource });
      }

      if (filters?.startDate) {
        query = query.where('created_at', '>=', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.where('created_at', '<=', filters.endDate);
      }

      const logs = await query;

      return logs.map((log) => ({
        id: log.id,
        adminUserId: log.admin_user_id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resource_id,
        details: log.details ? JSON.parse(log.details) : undefined,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        createdAt: new Date(log.created_at),
      }));
    } catch (error: any) {
      throw new Error(`Failed to export audit logs: ${error.message}`);
    }
  }

  async cleanupOldAuditLogs(olderThanDays: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const deletedCount = await db('admin_audit_logs').where('created_at', '<', cutoffDate).del();

      return deletedCount;
    } catch (error: any) {
      throw new Error(`Failed to cleanup old audit logs: ${error.message}`);
    }
  }

  // Enhanced audit analytics methods
  async getAuditAnalytics(timeRange: '7d' | '30d' | '90d' | '1y' = '30d') {
    try {
      const startDate = this.getStartDateFromTimeRange(timeRange);
      
      const [
        totalActions,
        actionsByType,
        actionsByUser,
        securityEvents,
        dataAccessEvents,
        severityDistribution,
        categoryDistribution,
        outcomeDistribution,
        performanceMetrics,
      ] = await Promise.all([
        db('admin_audit_logs')
          .where('created_at', '>=', startDate)
          .count('* as count')
          .first(),
        db('admin_audit_logs')
          .where('created_at', '>=', startDate)
          .select('action')
          .count('* as count')
          .groupBy('action'),
        db('admin_audit_logs')
          .where('created_at', '>=', startDate)
          .select('admin_user_id')
          .count('* as count')
          .groupBy('admin_user_id'),
        db('admin_audit_logs')
          .where('created_at', '>=', startDate)
          .whereRaw("details::text LIKE '%security%'")
          .count('* as count')
          .first(),
        db('admin_audit_logs')
          .where('created_at', '>=', startDate)
          .whereRaw("details::text LIKE '%dataAccess%'")
          .count('* as count')
          .first(),
        db('admin_audit_logs')
          .where('created_at', '>=', startDate)
          .whereRaw("details::text LIKE '%\"severity\":%'")
          .select(db.raw("JSON_EXTRACT_PATH_TEXT(details, 'severity') as severity"))
          .count('* as count')
          .groupBy('severity'),
        db('admin_audit_logs')
          .where('created_at', '>=', startDate)
          .whereRaw("details::text LIKE '%\"category\":%'")
          .select(db.raw("JSON_EXTRACT_PATH_TEXT(details, 'category') as category"))
          .count('* as count')
          .groupBy('category'),
        db('admin_audit_logs')
          .where('created_at', '>=', startDate)
          .whereRaw("details::text LIKE '%\"outcome\":%'")
          .select(db.raw("JSON_EXTRACT_PATH_TEXT(details, 'outcome') as outcome"))
          .count('* as count')
          .groupBy('outcome'),
        db('admin_audit_logs')
          .where('created_at', '>=', startDate)
          .whereRaw("details::text LIKE '%\"performance\"%'")
          .select(db.raw("AVG(CAST(JSON_EXTRACT_PATH_TEXT(details, 'performance', 'duration') as INTEGER)) as avgDuration"))
          .first(),
      ]);

      return {
        totalActions: totalActions ? parseInt(totalActions.count as string) : 0,
        actionsByType: actionsByType.reduce((acc: { [key: string]: number }, row) => {
          acc[row.action as string] = parseInt(row.count as string);
          return acc;
        }, {}),
        actionsByUser: actionsByUser.reduce((acc: { [key: string]: number }, row) => {
          acc[row.admin_user_id as string] = parseInt(row.count as string);
          return acc;
        }, {}),
        securityEvents: securityEvents ? parseInt(securityEvents.count as string) : 0,
        dataAccessEvents: dataAccessEvents ? parseInt(dataAccessEvents.count as string) : 0,
        severityDistribution: severityDistribution.reduce((acc: { [key: string]: number }, row) => {
          acc[row.severity as string] = parseInt(row.count as string);
          return acc;
        }, {}),
        categoryDistribution: categoryDistribution.reduce((acc: { [key: string]: number }, row) => {
          acc[row.category as string] = parseInt(row.count as string);
          return acc;
        }, {}),
        outcomeDistribution: outcomeDistribution.reduce((acc: { [key: string]: number }, row) => {
          acc[row.outcome as string] = parseInt(row.count as string);
          return acc;
        }, {}),
        performanceMetrics: {
          averageDuration: performanceMetrics?.avgDuration ? parseFloat(performanceMetrics.avgDuration as string) : 0,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get audit analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Get security risk assessment
  async getSecurityRiskAssessment(): Promise<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    threats: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      mitigation: string;
    }>;
    recommendations: string[];
  }> {
    try {
      const recentSecurityEvents = await db('admin_audit_logs')
        .where('created_at', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
        .whereRaw("details::text LIKE '%security%'")
        .orderBy('created_at', 'desc')
        .limit(50);

      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      const threats: Array<{
        type: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
        mitigation: string;
      }> = [];

      // Analyze security events
      for (const event of recentSecurityEvents) {
        const details = event.details ? JSON.parse(event.details) : {};
        if (details.security?.severity === 'critical') {
          riskLevel = 'critical';
        } else if (details.security?.severity === 'high' && riskLevel !== 'critical') {
          riskLevel = 'high';
        } else if (details.security?.severity === 'medium' && riskLevel !== 'critical' && riskLevel !== 'high') {
          riskLevel = 'medium';
        }

        if (details.security) {
          threats.push({
            type: event.action,
            severity: details.security.severity || 'low',
            description: `Security event: ${event.action} on ${event.resource}`,
            mitigation: details.security.mitigation || 'Review and investigate',
          });
        }
      }

      const recommendations = [
        'Implement additional monitoring for high-risk actions',
        'Review access controls for sensitive resources',
        'Enhance authentication mechanisms',
        'Regular security training for admin users',
      ];

      return { riskLevel, threats, recommendations };
    } catch (error) {
      throw new Error(
        `Failed to get security risk assessment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Private Helper Methods
  private getStartDateFromTimeRange(timeRange: '7d' | '30d' | '90d' | '1y'): Date {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
