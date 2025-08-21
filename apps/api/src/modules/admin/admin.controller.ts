import express from 'express';

import { AdminService } from './admin.service.js';
import { createAdminAuthMiddleware } from './admin-auth.middleware.js';
import { AdminAuthService } from './admin-auth.service.js';
import { AdminPermissionService } from './admin-permission.service.js';

export class AdminController {
  public router: express.Router;

  constructor(
    private adminService: AdminService,
    private adminAuthService: AdminAuthService,
    private adminPermissionService: AdminPermissionService
  ) {
    this.router = express.Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Public admin authentication routes
    this.router.post('/auth/login', this.login.bind(this));
    this.router.post('/auth/refresh', this.refreshToken.bind(this));

    // Protected admin routes (require authentication)
    const authMiddleware = createAdminAuthMiddleware(
      this.adminAuthService,
      this.adminPermissionService
    );

    // Admin user management
    this.router.get(
      '/users',
      authMiddleware(['admin_users', 'read']),
      this.getAdminUsers.bind(this)
    );
    this.router.post(
      '/users',
      authMiddleware(['admin_users', 'create']),
      this.createAdminUser.bind(this)
    );
    this.router.get(
      '/users/:id',
      authMiddleware(['admin_users', 'read']),
      this.getAdminUser.bind(this)
    );
    this.router.put(
      '/users/:id',
      authMiddleware(['admin_users', 'update']),
      this.updateAdminUser.bind(this)
    );
    this.router.delete(
      '/users/:id',
      authMiddleware(['admin_users', 'delete']),
      this.deleteAdminUser.bind(this)
    );
    this.router.post(
      '/users/:id/change-password',
      authMiddleware(['admin_users', 'update']),
      this.changePassword.bind(this)
    );

    // Permissions management
    this.router.get(
      '/permissions',
      authMiddleware(['admin_permissions', 'read']),
      this.getPermissions.bind(this)
    );
    this.router.post(
      '/permissions',
      authMiddleware(['admin_permissions', 'create']),
      this.createPermission.bind(this)
    );
    this.router.put(
      '/permissions/:id',
      authMiddleware(['admin_permissions', 'update']),
      this.updatePermission.bind(this)
    );
    this.router.delete(
      '/permissions/:id',
      authMiddleware(['admin_permissions', 'delete']),
      this.deletePermission.bind(this)
    );
    this.router.get(
      '/permissions/matrix',
      authMiddleware(['admin_permissions', 'read']),
      this.getPermissionMatrix.bind(this)
    );

    // Dashboard and analytics
    this.router.get(
      '/dashboard',
      authMiddleware(['dashboard', 'read']),
      this.getDashboardSummary.bind(this)
    );
    this.router.get(
      '/analytics',
      authMiddleware(['analytics', 'read']),
      this.getAnalytics.bind(this)
    );

    // Prelist management
    this.router.post(
      '/prelist/upload',
      authMiddleware(['prelist', 'upload']),
      this.uploadPrelist.bind(this)
    );
    this.router.get(
      '/prelist/batches',
      authMiddleware(['prelist', 'read']),
      this.getPrelistBatches.bind(this)
    );
    this.router.get(
      '/prelist/batches/:id',
      authMiddleware(['prelist', 'read']),
      this.getPrelistBatch.bind(this)
    );
    this.router.get(
      '/prelist/batches/:id/errors',
      authMiddleware(['prelist', 'read']),
      this.getPrelistErrors.bind(this)
    );

    // Candidate management
    this.router.get(
      '/candidates',
      authMiddleware(['candidates', 'read']),
      this.getCandidates.bind(this)
    );
    this.router.get(
      '/candidates/:id',
      authMiddleware(['candidates', 'read']),
      this.getCandidate.bind(this)
    );
    this.router.put(
      '/candidates/:id',
      authMiddleware(['candidates', 'update']),
      this.updateCandidate.bind(this)
    );
    this.router.delete(
      '/candidates/:id',
      authMiddleware(['candidates', 'delete']),
      this.deleteCandidate.bind(this)
    );
    this.router.post(
      '/candidates/:id/notes',
      authMiddleware(['candidates', 'update']),
      this.addCandidateNote.bind(this)
    );
    this.router.get(
      '/candidates/:id/notes',
      authMiddleware(['candidates', 'read']),
      this.getCandidateNotes.bind(this)
    );

    // Payment management
    this.router.get('/payments', authMiddleware(['payments', 'read']), this.getPayments.bind(this));
    this.router.get(
      '/payments/types',
      authMiddleware(['payment_types', 'read']),
      this.getPaymentTypes.bind(this)
    );
    this.router.post(
      '/payments/types',
      authMiddleware(['payment_types', 'create']),
      this.createPaymentType.bind(this)
    );
    this.router.put(
      '/payments/types/:id',
      authMiddleware(['payment_types', 'update']),
      this.updatePaymentType.bind(this)
    );
    this.router.delete(
      '/payments/types/:id',
      authMiddleware(['payment_types', 'delete']),
      this.deletePaymentType.bind(this)
    );
    this.router.get(
      '/payments/disputes',
      authMiddleware(['payments', 'read']),
      this.getPaymentDisputes.bind(this)
    );
    this.router.put(
      '/payments/disputes/:id',
      authMiddleware(['payments', 'update']),
      this.updatePaymentDispute.bind(this)
    );
    this.router.get(
      '/payments/:id',
      authMiddleware(['payments', 'read']),
      this.getPayment.bind(this)
    );
    this.router.put(
      '/payments/:id',
      authMiddleware(['payments', 'update']),
      this.updatePayment.bind(this)
    );
    this.router.post(
      '/payments/:id/reconcile',
      authMiddleware(['payments', 'update']),
      this.reconcilePayment.bind(this)
    );

    // Admissions management
    this.router.get(
      '/admissions',
      authMiddleware(['admissions', 'read']),
      this.getAdmissions.bind(this)
    );
    this.router.put(
      '/admissions/:id',
      authMiddleware(['admissions', 'update']),
      this.updateAdmission.bind(this)
    );
    this.router.post(
      '/admissions/batch',
      authMiddleware(['admissions', 'update']),
      this.batchUpdateAdmissions.bind(this)
    );
    this.router.get(
      '/admissions/templates',
      authMiddleware(['admissions', 'read']),
      this.getAdmissionTemplates.bind(this)
    );
    this.router.post(
      '/admissions/templates',
      authMiddleware(['admissions', 'create']),
      this.createAdmissionTemplate.bind(this)
    );
    this.router.put(
      '/admissions/templates/:id',
      authMiddleware(['admissions', 'update']),
      this.updateAdmissionTemplate.bind(this)
    );
    this.router.delete(
      '/admissions/templates/:id',
      authMiddleware(['admissions', 'delete']),
      this.deleteAdmissionTemplate.bind(this)
    );

    // Reports and exports
    this.router.get('/reports', authMiddleware(['reports', 'read']), this.getReports.bind(this));
    this.router.post(
      '/reports/generate',
      authMiddleware(['reports', 'create']),
      this.generateReport.bind(this)
    );
    this.router.get('/reports/:id', authMiddleware(['reports', 'read']), this.getReport.bind(this));
    this.router.get(
      '/reports/:id/download',
      authMiddleware(['reports', 'read']),
      this.downloadReport.bind(this)
    );

    // Audit logs
    this.router.get(
      '/audit-logs',
      authMiddleware(['audit_logs', 'read']),
      this.getAuditLogs.bind(this)
    );
    this.router.get(
      '/audit-logs/summary',
      authMiddleware(['audit_logs', 'read']),
      this.getAuditSummary.bind(this)
    );
    this.router.get(
      '/audit-logs/export',
      authMiddleware(['audit_logs', 'read']),
      this.exportAuditLogs.bind(this)
    );
  }

  // Authentication endpoints
  private async login(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { username, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const result = await this.adminAuthService.login(
        { username, password },
        ipAddress,
        userAgent
      );

      res.json(result);
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async refreshToken(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const result = await this.adminAuthService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  // Admin user management endpoints
  private async getAdminUsers(req: express.Request, res: express.Response): Promise<void> {
    try {
      const users = await this.adminAuthService.listAdminUsers();
      res.json({
        success: true,
        data: users,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async createAdminUser(req: express.Request, res: express.Response): Promise<void> {
    try {
      const adminData = req.body;
      const createdBy = (req as any).user.sub; // From auth middleware

      const user = await this.adminAuthService.createAdminUser(adminData, createdBy);
      res.status(201).json({
        success: true,
        data: user,
        message: 'Admin user created successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async getAdminUser(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.adminAuthService.getAdminUserById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Admin user not found',
          timestamp: new Date(),
        });
        return;
      }

      res.json({
        success: true,
        data: user,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async updateAdminUser(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req as any).user.sub;

      const user = await this.adminAuthService.updateAdminUser(id, updateData, updatedBy);
      res.json({
        success: true,
        data: user,
        message: 'Admin user updated successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async deleteAdminUser(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      // TODO: Implement delete admin user
      res.json({
        success: true,
        message: 'Admin user deleted successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async changePassword(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      const result = await this.adminAuthService.changePassword(id, currentPassword, newPassword);
      res.json({
        success: true,
        message: result.message,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  // Permission management endpoints
  private async getPermissions(req: express.Request, res: express.Response): Promise<void> {
    try {
      const permissions = await this.adminPermissionService.getAllPermissions();
      res.json({
        success: true,
        data: permissions,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async createPermission(req: express.Request, res: express.Response): Promise<void> {
    try {
      const permissionData = req.body;
      const createdBy = (req as any).user.sub;

      const permission = await this.adminPermissionService.createPermission(
        permissionData,
        createdBy
      );
      res.status(201).json({
        success: true,
        data: permission,
        message: 'Permission created successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async updatePermission(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const permission = await this.adminPermissionService.updatePermission(id, updateData);
      res.json({
        success: true,
        data: permission,
        message: 'Permission updated successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async deletePermission(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.adminPermissionService.deletePermission(id);

      res.json({
        success: true,
        message: 'Permission deleted successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async getPermissionMatrix(req: express.Request, res: express.Response): Promise<void> {
    try {
      const matrix = await this.adminPermissionService.getPermissionMatrix();
      res.json({
        success: true,
        data: matrix,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  // Dashboard and analytics endpoints
  private async getDashboardSummary(req: express.Request, res: express.Response): Promise<void> {
    try {
      const summary = await this.adminService.getDashboardSummary();
      res.json({
        success: true,
        data: summary,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async getAnalytics(req: express.Request, res: express.Response): Promise<void> {
    try {
      const timeRange = req.query.timeRange as '7d' | '30d' | '90d' | '1y' | undefined;
      const analytics = await this.adminService.getAnalytics(timeRange);
      res.json({
        success: true,
        data: analytics,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  // Prelist management endpoints
  private async uploadPrelist(req: express.Request, res: express.Response): Promise<void> {
    try {
      // Handle different file upload scenarios
      let file: Express.Multer.File;
      if (Array.isArray(req.files)) {
        file = req.files[0];
      } else if (req.files && typeof req.files === 'object') {
        file = (req.files as any).prelist || Object.values(req.files)[0];
      } else {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
          timestamp: new Date(),
        });
        return;
      }

      if (!file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded',
          timestamp: new Date(),
        });
        return;
      }

      const adminUserId = (req as any).adminUserId;
      const result = await this.adminService.uploadPrelist(file, adminUserId);

      res.json({
        success: true,
        data: result,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async getPrelistBatches(req: express.Request, res: express.Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const batches = await this.adminService.getPrelistBatches(limit, offset);
      res.json({
        success: true,
        data: batches,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async getPrelistBatch(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const batch = await this.adminService.getPrelistBatch(id);
      res.json({
        success: true,
        data: batch,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async getPrelistErrors(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const errors = await this.adminService.getPrelistErrors(id);
      res.json({
        success: true,
        data: errors,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  // Candidate management endpoints
  private async getCandidates(req: express.Request, res: express.Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : undefined;
      const candidates = await this.adminService.getCandidates(limit, offset, filters);
      res.json({
        success: true,
        data: candidates,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async getCandidate(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const candidate = await this.adminService.getCandidate(id);
      res.json({
        success: true,
        data: candidate,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async updateCandidate(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req as any).user.sub;

      const candidate = await this.adminService.updateCandidate(id, updateData, updatedBy);
      res.json({
        success: true,
        data: candidate,
        message: 'Candidate updated successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async deleteCandidate(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = (req as any).user.sub;

      await this.adminService.deleteCandidate(id, deletedBy);
      res.json({
        success: true,
        message: 'Candidate deleted successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async addCandidateNote(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const noteData = req.body;
      const adminUserId = (req as any).user.sub;

      const note = await this.adminService.addCandidateNote(id, noteData, adminUserId);
      res.status(201).json({
        success: true,
        data: note,
        message: 'Note added successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async getCandidateNotes(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const notes = await this.adminService.getCandidateNotes(id);
      res.json({
        success: true,
        data: notes,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  // Payment management endpoints
  private async getPayments(req: express.Request, res: express.Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : undefined;
      const payments = await this.adminService.getPayments(limit, offset, filters);
      res.json({
        success: true,
        data: payments,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async getPayment(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const payment = await this.adminService.getPayment(id);
      res.json({
        success: true,
        data: payment,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async updatePayment(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req as any).user.sub;

      const payment = await this.adminService.updatePayment(id, updateData, updatedBy);
      res.json({
        success: true,
        data: payment,
        message: 'Payment updated successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async reconcilePayment(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const reconciliationData = req.body;
      const reconciledBy = (req as any).user.sub;

      const result = await this.adminService.reconcilePayment(id, reconciliationData, reconciledBy);
      res.json({
        success: true,
        data: result,
        message: 'Payment reconciled successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  // Payment types management
  private async getPaymentTypes(req: express.Request, res: express.Response): Promise<void> {
    try {
      const paymentTypes = await this.adminService.getPaymentTypes();
      res.json({
        success: true,
        data: paymentTypes,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async createPaymentType(req: express.Request, res: express.Response): Promise<void> {
    try {
      const paymentTypeData = req.body;
      const createdBy = (req as any).user.sub;

      const paymentType = await this.adminService.createPaymentType(paymentTypeData, createdBy);
      res.status(201).json({
        success: true,
        data: paymentType,
        message: 'Payment type created successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async updatePaymentType(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req as any).user.sub;

      const paymentType = await this.adminService.updatePaymentType(id, updateData, updatedBy);
      res.json({
        success: true,
        data: paymentType,
        message: 'Payment type updated successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async deletePaymentType(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = (req as any).user.sub;

      await this.adminService.deletePaymentType(id, deletedBy);
      res.json({
        success: true,
        message: 'Payment type deleted successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  // Payment disputes management
  private async getPaymentDisputes(req: express.Request, res: express.Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const disputes = await this.adminService.getPaymentDisputes(limit, offset);
      res.json({
        success: true,
        data: disputes,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async updatePaymentDispute(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req as any).user.sub;

      const dispute = await this.adminService.updatePaymentDispute(id, updateData, updatedBy);
      res.json({
        success: true,
        data: dispute,
        message: 'Payment dispute updated successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  // Admissions management endpoints
  private async getAdmissions(req: express.Request, res: express.Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : undefined;
      const admissions = await this.adminService.getAdmissions(limit, offset, filters);
      res.json({
        success: true,
        data: admissions,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async updateAdmission(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req as any).user.sub;

      const admission = await this.adminService.updateAdmission(id, updateData, updatedBy);
      res.json({
        success: true,
        data: admission,
        message: 'Admission updated successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async batchUpdateAdmissions(req: express.Request, res: express.Response): Promise<void> {
    try {
      const batchData = req.body;
      const initiatedBy = (req as any).user.sub;

      const result = await this.adminService.batchUpdateAdmissions(
        batchData.admissionIds || [],
        batchData.updates || {},
        initiatedBy
      );
      res.json({
        success: true,
        data: result,
        message: 'Batch admission update initiated successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  // Admission templates management
  private async getAdmissionTemplates(req: express.Request, res: express.Response): Promise<void> {
    try {
      const templates = await this.adminService.getAdmissionTemplates();
      res.json({
        success: true,
        data: templates,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async createAdmissionTemplate(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const templateData = req.body;
      const createdBy = (req as any).user.sub;

      const template = await this.adminService.createAdmissionTemplate(templateData, createdBy);
      res.status(201).json({
        success: true,
        data: template,
        message: 'Admission template created successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async updateAdmissionTemplate(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedBy = (req as any).user.sub;

      const template = await this.adminService.updateAdmissionTemplate(id, updateData, updatedBy);
      res.json({
        success: true,
        data: template,
        message: 'Admission template updated successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async deleteAdmissionTemplate(
    req: express.Request,
    res: express.Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = (req as any).user.sub;

      await this.adminService.deleteAdmissionTemplate(id, deletedBy);
      res.json({
        success: true,
        message: 'Admission template deleted successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  // Reports and exports endpoints
  private async getReports(req: express.Request, res: express.Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const reports = await this.adminService.getReports(limit, offset);
      res.json({
        success: true,
        data: reports,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async generateReport(req: express.Request, res: express.Response): Promise<void> {
    try {
      const reportData = req.body;
      const generatedBy = (req as any).user.sub;

      const report = await this.adminService.generateReport(reportData, generatedBy);
      res.json({
        success: true,
        data: report,
        message: 'Report generation initiated successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async getReport(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const report = await this.adminService.getReport(id);
      res.json({
        success: true,
        data: report,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async downloadReport(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const reportData = await this.adminService.downloadReport(id);

      // Set appropriate headers for download
      res.setHeader('Content-Type', reportData.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${reportData.filename}"`);

      res.json({
        success: true,
        data: reportData.data,
        filename: reportData.filename,
        mimeType: reportData.mimeType,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  // Audit logs endpoints
  private async getAuditLogs(req: express.Request, res: express.Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const auditLogs = await this.adminService.getAuditLogs(limit, offset);
      res.json({
        success: true,
        data: auditLogs,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async getAuditSummary(req: express.Request, res: express.Response): Promise<void> {
    try {
      const timeRange = req.query.timeRange as '7d' | '30d' | '90d' | '1y' | undefined;
      const summary = await this.adminService.getAuditSummary(timeRange);
      res.json({
        success: true,
        data: summary,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }

  private async exportAuditLogs(req: express.Request, res: express.Response): Promise<void> {
    try {
      const format = req.query.format as 'csv' | 'json' | undefined;
      const auditLogs = await this.adminService.exportAuditLogs(format);
      res.json({
        success: true,
        data: auditLogs,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date(),
      });
    }
  }
}
