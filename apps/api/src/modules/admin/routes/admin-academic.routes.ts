import { Router } from 'express';

import { logger } from '../../middleware/logging.js';
import { AdminAcademicController } from './admin-academic.controller.js';
import { AdminAcademicService } from './admin-academic.service.js';

const router = Router();

// Initialize services and controllers
const academicService = new AdminAcademicService(logger);
const academicController = new AdminAcademicController(academicService, logger);

// ==================== FACULTY ROUTES ====================

/**
 * @route GET /api/admin/faculties
 * @desc Get all faculties with pagination and filtering
 * @access Admin only
 */
router.get('/faculties', academicController.getFaculties.bind(academicController));

/**
 * @route GET /api/admin/faculties/:id
 * @desc Get faculty by ID
 * @access Admin only
 */
router.get('/faculties/:id', academicController.getFacultyById.bind(academicController));

/**
 * @route POST /api/admin/faculties
 * @desc Create a new faculty
 * @access Admin only
 */
router.post('/faculties', academicController.createFaculty.bind(academicController));

/**
 * @route PUT /api/admin/faculties/:id
 * @desc Update faculty
 * @access Admin only
 */
router.put('/faculties/:id', academicController.updateFaculty.bind(academicController));

/**
 * @route DELETE /api/admin/faculties/:id
 * @desc Delete faculty (soft delete)
 * @access Admin only
 */
router.delete('/faculties/:id', academicController.deleteFaculty.bind(academicController));

// ==================== DEPARTMENT ROUTES ====================

/**
 * @route GET /api/admin/departments
 * @desc Get all departments with pagination and filtering
 * @access Admin only
 */
router.get('/departments', academicController.getDepartments.bind(academicController));

/**
 * @route GET /api/admin/departments/:id
 * @desc Get department by ID
 * @access Admin only
 */
router.get('/departments/:id', academicController.getDepartmentById.bind(academicController));

/**
 * @route POST /api/admin/departments
 * @desc Create a new department
 * @access Admin only
 */
router.post('/departments', academicController.createDepartment.bind(academicController));

/**
 * @route PUT /api/admin/departments/:id
 * @desc Update department
 * @access Admin only
 */
router.put('/departments/:id', academicController.updateDepartment.bind(academicController));

/**
 * @route DELETE /api/admin/departments/:id
 * @desc Delete department (soft delete)
 * @access Admin only
 */
router.delete('/departments/:id', academicController.deleteDepartment.bind(academicController));

// ==================== SIMPLIFIED ACADEMIC STRUCTURE ROUTES ====================

/**
 * @route GET /api/admin/academic/structure
 * @desc Get simplified academic structure (faculties and departments only)
 * @access Admin only
 */
router.get('/academic/structure', academicController.getAcademicStructure.bind(academicController));

export default router;
