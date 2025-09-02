import { AdminPaymentController } from './controllers/admin-payment.controller.js';
import { PaymentPurposeController } from './controllers/payment-purpose.controller.js';
import { createAdminRoutes } from './routes/index.js';
import { AdminService } from './services/admin.service.js';
import { AdminAcademicService } from './services/admin-academic.service.js';
import { AdminAdmissionService } from './services/admin-admission.service.js';
import { AdminAuditService } from './services/admin-audit.service.js';
import { AdminAuthService } from './services/admin-auth.service.js';
import { AdminCandidateService } from './services/admin-candidate.service.js';
import { AdminPaymentService } from './services/admin-payment.service.js';
import { AdminPermissionService } from './services/admin-permission.service.js';
import { AdminReportService } from './services/admin-report.service.js';
import { PaymentPurposeService } from './services/payment-purpose.service.js';

export interface AdminModule {
  router: any;
  adminService: AdminService;
  adminAuthService: AdminAuthService;
  adminPermissionService: AdminPermissionService;
  adminAcademicService: AdminAcademicService;
  paymentPurposeService: PaymentPurposeService;
  paymentPurposeController: PaymentPurposeController;
  adminPaymentController: AdminPaymentController;
}

export function createAdminModule(): AdminModule {
  try {
    console.log('[AdminModule] Starting admin module creation...');

    // Create service instances
    console.log('[AdminModule] Creating AdminAuditService...');
    const adminAuditService = new AdminAuditService();
    console.log('[AdminModule] AdminAuditService created successfully');

    console.log('[AdminModule] Creating AdminAuthService...');
    const adminAuthService = new AdminAuthService(adminAuditService);
    console.log('[AdminModule] AdminAuthService created successfully');

    console.log('[AdminModule] Creating AdminPermissionService...');
    const adminPermissionService = new AdminPermissionService();
    console.log('[AdminModule] AdminPermissionService created successfully');

    console.log('[AdminModule] Creating AdminAcademicService...');
    const adminAcademicService = new AdminAcademicService(console);
    console.log('[AdminModule] AdminAcademicService created successfully');

    console.log('[AdminModule] Creating AdminCandidateService...');
    const adminCandidateService = new AdminCandidateService(adminAuditService);
    console.log('[AdminModule] AdminCandidateService created successfully');

    console.log('[AdminModule] Creating AdminPaymentService...');
    const adminPaymentService = new AdminPaymentService(adminAuditService);
    console.log('[AdminModule] AdminPaymentService created successfully');

    console.log('[AdminModule] Creating AdminAdmissionService...');
    const adminAdmissionService = new AdminAdmissionService(adminAuditService);
    console.log('[AdminModule] AdminAdmissionService created successfully');

    console.log('[AdminModule] Creating AdminReportService...');
    const adminReportService = new AdminReportService(adminAuditService);
    console.log('[AdminModule] AdminReportService created successfully');

    console.log('[AdminModule] Creating PaymentPurposeService...');
    const paymentPurposeService = new PaymentPurposeService();
    console.log('[AdminModule] PaymentPurposeService created successfully');

    console.log('[AdminModule] Creating PaymentPurposeController...');
    const paymentPurposeController = new PaymentPurposeController(paymentPurposeService);
    console.log('[AdminModule] PaymentPurposeController created successfully');

    console.log('[AdminModule] Creating AdminPaymentController...');
    const adminPaymentController = new AdminPaymentController();
    console.log('[AdminModule] AdminPaymentController created successfully');

    console.log('[AdminModule] Creating AdminService...');
    const adminService = new AdminService(
      adminAcademicService,

      adminCandidateService,
      adminPaymentService,
      adminAdmissionService,
      adminReportService
    );
    console.log('[AdminModule] AdminService created successfully');

    // Create router using the new routes structure
    console.log('[AdminModule] Creating admin routes...');
    const router = createAdminRoutes({
      adminService,
      adminAuthService,
      adminPermissionService,
      adminAcademicService,
      paymentPurposeService,
      paymentPurposeController,
      adminPaymentController,
    });
    console.log('[AdminModule] Admin routes created successfully');

    console.log('[AdminModule] Admin module creation completed successfully');

    return {
      router,
      adminService,
      adminAuthService,
      adminPermissionService,
      adminAcademicService,
      paymentPurposeService,
      paymentPurposeController,
      adminPaymentController,
    };
  } catch (error) {
    console.error('[AdminModule] Error creating admin module:', error);
    throw error;
  }
}
