import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AdminAcademicService } from './admin-academic.service.js';
import { AdminAdmissionService } from './admin-admission.service.js';
import { AdminAuditService } from './admin-audit.service.js';
import { AdminAuthService } from './admin-auth.service.js';
import { AdminCandidateService } from './admin-candidate.service.js';
import { AdminPaymentService } from './admin-payment.service.js';
import { AdminPermissionService } from './admin-permission.service.js';
import { AdminPrelistService } from './admin-prelist.service.js';
import { AdminReportService } from './admin-report.service.js';

export interface AdminModule {
  router: any;
  controller: AdminController;
  service: AdminService;
}

export function createAdminModule(): AdminModule {
  // Create service instances
  const adminAuditService = new AdminAuditService();
  const adminPermissionService = new AdminPermissionService();
  const adminAuthService = new AdminAuthService(adminAuditService);
  const adminAcademicService = new AdminAcademicService();
  const adminPrelistService = new AdminPrelistService(adminAuditService);
  const adminCandidateService = new AdminCandidateService(adminAuditService);
  const adminPaymentService = new AdminPaymentService(adminAuditService);
  const adminAdmissionService = new AdminAdmissionService(adminAuditService);
  const adminReportService = new AdminReportService(adminAuditService);

  const adminService = new AdminService(
    adminAcademicService,
    adminPrelistService,
    adminCandidateService,
    adminPaymentService,
    adminAdmissionService,
    adminReportService
  );

  const adminController = new AdminController(
    adminService,
    adminAuthService,
    adminPermissionService,
    adminAcademicService
  );

  return {
    router: adminController.router,
    controller: adminController,
    service: adminService,
  };
}
