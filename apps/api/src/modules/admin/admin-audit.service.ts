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

  async getAuditLogs(filters?: {
    adminUserId?: string;
    action?: string;
    resource?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
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
}
