import { Router } from 'express';

import { adminRateLimit } from '../../../middleware/rateLimiting.js';
// Import new controllers
import { AdminAuthController } from '../controllers/admin-auth.controller.js';
import { AdminCandidateController } from '../controllers/admin-candidate.controller.js';
import { AdminDashboardController } from '../controllers/admin-dashboard.controller.js';
import { AdminPrelistController } from '../controllers/admin-prelist.controller.js';
import { AdminUserController } from '../controllers/admin-user.controller.js';
import { PaymentPurposeController } from '../controllers/payment-purpose.controller.js';
import { AdminService } from '../services/admin.service.js';
import { AdminAcademicService } from '../services/admin-academic.service.js';
import { AdminAuthService } from '../services/admin-auth.service.js';
import { AdminPermissionService } from '../services/admin-permission.service.js';
import { PaymentPurposeService } from '../services/payment-purpose.service.js';
// Import new route creators
import { createAdminAuthRoutes } from './admin-auth.routes.js';
import { createAdminCandidateRoutes } from './admin-candidate.routes.js';
import { createAdminDashboardRoutes } from './admin-dashboard.routes.js';
import { createAdminPrelistRoutes } from './admin-prelist.routes.js';
import { createAdminUserRoutes } from './admin-user.routes.js';
import { createPaymentPurposeRoutes } from './payment-purpose.routes.js';

export interface AdminRoutesDependencies {
  adminService: AdminService;
  adminAuthService: AdminAuthService;
  adminPermissionService: AdminPermissionService;
  adminAcademicService: AdminAcademicService;
  paymentPurposeService: PaymentPurposeService;
  paymentPurposeController: PaymentPurposeController;
}

export function createAdminRoutes(deps: AdminRoutesDependencies): Router {
  const router = Router();

  // Apply admin rate limiting to all routes
  router.use(adminRateLimit);

  // Create controller instances
  const authController = new AdminAuthController(
    deps.adminAuthService,
    deps.adminPermissionService
  );
  const userController = new AdminUserController(deps.adminAuthService);
  const candidateController = new AdminCandidateController(deps.adminService);
  const prelistController = new AdminPrelistController();
  const dashboardController = new AdminDashboardController(deps.adminService);

  // Mount route modules
  router.use('/auth', createAdminAuthRoutes(authController));
  router.use(
    '/users',
    createAdminUserRoutes(userController, deps.adminAuthService, deps.adminPermissionService)
  );
  router.use(
    '/candidates',
    createAdminCandidateRoutes(
      candidateController,
      deps.adminAuthService,
      deps.adminPermissionService
    )
  );
  router.use(
    '/prelist',
    createAdminPrelistRoutes(prelistController, deps.adminAuthService, deps.adminPermissionService)
  );
  router.use(
    '/',
    createAdminDashboardRoutes(
      dashboardController,
      deps.adminAuthService,
      deps.adminPermissionService
    )
  );

  // Mount academic routes
  router.use('/', createAcademicRoutes(deps.adminAcademicService));

  // Mount payment purpose routes
  router.use('/payment', createPaymentPurposeRoutes(deps.paymentPurposeController));

  return router;
}

function createAcademicRoutes(academicService: AdminAcademicService): Router {
  const router = Router();

  // Faculty routes
  router.get('/faculties', async (req, res) => {
    try {
      const query = {
        search: req.query.search as string,
        isActive: req.query.isActive === 'true',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const result = await academicService.getFaculties(query);
      res.json({
        success: true,
        data: result,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get faculties',
        timestamp: new Date(),
      });
    }
  });

  router.get('/faculties/:id', async (req, res) => {
    try {
      const faculty = await academicService.getFacultyById(req.params.id);
      if (!faculty) {
        return res.status(404).json({
          success: false,
          error: 'Faculty not found',
          timestamp: new Date(),
        });
      }

      res.json({
        success: true,
        data: faculty,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get faculty',
        timestamp: new Date(),
      });
    }
  });

  router.post('/faculties', async (req, res) => {
    try {
      const faculty = await academicService.createFaculty(req.body);
      res.status(201).json({
        success: true,
        data: faculty,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create faculty',
        timestamp: new Date(),
      });
    }
  });

  router.put('/faculties/:id', async (req, res) => {
    try {
      const faculty = await academicService.updateFaculty(req.params.id, req.body);
      res.json({
        success: true,
        data: faculty,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update faculty',
        timestamp: new Date(),
      });
    }
  });

  router.delete('/faculties/:id', async (req, res) => {
    try {
      await academicService.deleteFaculty(req.params.id);
      res.json({
        success: true,
        message: 'Faculty deleted successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete faculty',
        timestamp: new Date(),
      });
    }
  });

  // Department routes
  router.get('/departments', async (req, res) => {
    try {
      const query = {
        search: req.query.search as string,
        facultyId: req.query.facultyId as string,
        isActive: req.query.isActive === 'true',
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const result = await academicService.getDepartments(query);
      res.json({
        success: true,
        data: result,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get departments',
        timestamp: new Date(),
      });
    }
  });

  router.get('/departments/:id', async (req, res) => {
    try {
      const department = await academicService.getDepartmentById(req.params.id);
      if (!department) {
        return res.status(404).json({
          success: false,
          error: 'Department not found',
          timestamp: new Date(),
        });
      }

      res.json({
        success: true,
        data: department,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get department',
        timestamp: new Date(),
      });
    }
  });

  router.post('/departments', async (req, res) => {
    try {
      const department = await academicService.createDepartment(req.body);
      res.status(201).json({
        success: true,
        data: department,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create department',
        timestamp: new Date(),
      });
    }
  });

  router.put('/departments/:id', async (req, res) => {
    try {
      const department = await academicService.updateDepartment(req.params.id, req.body);
      res.json({
        success: true,
        data: department,
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update department',
        timestamp: new Date(),
      });
    }
  });

  router.delete('/departments/:id', async (req, res) => {
    try {
      await academicService.deleteDepartment(req.params.id);
      res.json({
        success: true,
        message: 'Department deleted successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to delete department',
        timestamp: new Date(),
      });
    }
  });

  // Simplified academic structure endpoint
  router.get('/academic/structure', async (req, res) => {
    try {
      const structure = await academicService.getAcademicStructure();
      res.json({
        success: true,
        data: structure,
        message: 'Simplified academic structure retrieved successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get academic structure',
        timestamp: new Date(),
      });
    }
  });

  return router;
}
