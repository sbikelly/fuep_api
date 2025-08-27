import {
  CreateDepartmentRequestSchema,
  CreateFacultyRequestSchema,
  CreateProgramDepartmentRequestSchema,
  CreateProgramRequestSchema,
  DepartmentQuerySchema,
  FacultyQuerySchema,
  ProgramQuerySchema,
  UpdateDepartmentRequestSchema,
  UpdateFacultyRequestSchema,
  UpdateProgramRequestSchema,
} from '@fuep/types';
import { Request, Response } from 'express';

import { logger } from '../../middleware/logging.js';
import { AdminAcademicService } from './admin-academic.service.js';

export class AdminAcademicController {
  private academicService: AdminAcademicService;
  private logger: Console;

  constructor(academicService: AdminAcademicService, logger: Console = console) {
    this.academicService = academicService;
    this.logger = logger;
  }

  // ==================== FACULTY ENDPOINTS ====================

  /**
   * GET /api/admin/faculties - Get all faculties
   */
  async getFaculties(req: Request, res: Response): Promise<void> {
    try {
      this.logger.log('[AdminAcademicController] Getting faculties');

      // Parse and validate query parameters
      const queryResult = FacultyQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: queryResult.error.errors,
          timestamp: new Date(),
        });
        return;
      }

      const query = queryResult.data;
      const result = await this.academicService.getFaculties(query);

      res.json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[AdminAcademicController] Error getting faculties:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get faculties',
        timestamp: new Date(),
      });
    }
  }

  /**
   * GET /api/admin/faculties/:id - Get faculty by ID
   */
  async getFacultyById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      this.logger.log('[AdminAcademicController] Getting faculty by ID:', id);

      const faculty = await this.academicService.getFacultyById(id);

      if (!faculty) {
        res.status(404).json({
          success: false,
          error: 'Faculty not found',
          timestamp: new Date(),
        });
        return;
      }

      res.json({
        success: true,
        data: faculty,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[AdminAcademicController] Error getting faculty by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get faculty',
        timestamp: new Date(),
      });
    }
  }

  /**
   * POST /api/admin/faculties - Create new faculty
   */
  async createFaculty(req: Request, res: Response): Promise<void> {
    try {
      this.logger.log('[AdminAcademicController] Creating faculty');

      // Validate request body
      const validationResult = CreateFacultyRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors,
          timestamp: new Date(),
        });
        return;
      }

      const facultyData = validationResult.data;
      const faculty = await this.academicService.createFaculty(facultyData);

      res.status(201).json({
        success: true,
        data: faculty,
        message: 'Faculty created successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      this.logger.error('[AdminAcademicController] Error creating faculty:', error);
      
      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create faculty',
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * PUT /api/admin/faculties/:id - Update faculty
   */
  async updateFaculty(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      this.logger.log('[AdminAcademicController] Updating faculty:', id);

      // Validate request body
      const validationResult = UpdateFacultyRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors,
          timestamp: new Date(),
        });
        return;
      }

      const facultyData = validationResult.data;
      const faculty = await this.academicService.updateFaculty(id, facultyData);

      res.json({
        success: true,
        data: faculty,
        message: 'Faculty updated successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      this.logger.error('[AdminAcademicController] Error updating faculty:', error);
      
      if (error.message === 'Faculty not found') {
        res.status(404).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update faculty',
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * DELETE /api/admin/faculties/:id - Delete faculty
   */
  async deleteFaculty(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      this.logger.log('[AdminAcademicController] Deleting faculty:', id);

      const deleted = await this.academicService.deleteFaculty(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Faculty not found',
          timestamp: new Date(),
        });
        return;
      }

      res.json({
        success: true,
        message: 'Faculty deleted successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      this.logger.error('[AdminAcademicController] Error deleting faculty:', error);
      
      if (error.message === 'Faculty not found') {
        res.status(404).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else if (error.message.includes('Cannot delete faculty')) {
        res.status(400).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to delete faculty',
          timestamp: new Date(),
        });
      }
    }
  }

  // ==================== DEPARTMENT ENDPOINTS ====================

  /**
   * GET /api/admin/departments - Get all departments
   */
  async getDepartments(req: Request, res: Response): Promise<void> {
    try {
      this.logger.log('[AdminAcademicController] Getting departments');

      // Parse and validate query parameters
      const queryResult = DepartmentQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: queryResult.error.errors,
          timestamp: new Date(),
        });
        return;
      }

      const query = queryResult.data;
      const result = await this.academicService.getDepartments(query);

      res.json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[AdminAcademicController] Error getting departments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get departments',
        timestamp: new Date(),
      });
    }
  }

  /**
   * GET /api/admin/departments/:id - Get department by ID
   */
  async getDepartmentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      this.logger.log('[AdminAcademicController] Getting department by ID:', id);

      const department = await this.academicService.getDepartmentById(id);

      if (!department) {
        res.status(404).json({
          success: false,
          error: 'Department not found',
          timestamp: new Date(),
        });
        return;
      }

      res.json({
        success: true,
        data: department,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[AdminAcademicController] Error getting department by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get department',
        timestamp: new Date(),
      });
    }
  }

  /**
   * POST /api/admin/departments - Create new department
   */
  async createDepartment(req: Request, res: Response): Promise<void> {
    try {
      this.logger.log('[AdminAcademicController] Creating department');

      // Validate request body
      const validationResult = CreateDepartmentRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors,
          timestamp: new Date(),
        });
        return;
      }

      const departmentData = validationResult.data;
      const department = await this.academicService.createDepartment(departmentData);

      res.status(201).json({
        success: true,
        data: department,
        message: 'Department created successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      this.logger.error('[AdminAcademicController] Error creating department:', error);
      
      if (error.message.includes('Faculty not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create department',
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * PUT /api/admin/departments/:id - Update department
   */
  async updateDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      this.logger.log('[AdminAcademicController] Updating department:', id);

      // Validate request body
      const validationResult = UpdateDepartmentRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors,
          timestamp: new Date(),
        });
        return;
      }

      const departmentData = validationResult.data;
      const department = await this.academicService.updateDepartment(id, departmentData);

      res.json({
        success: true,
        data: department,
        message: 'Department updated successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      this.logger.error('[AdminAcademicController] Error updating department:', error);
      
      if (error.message === 'Department not found') {
        res.status(404).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else if (error.message.includes('Faculty not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update department',
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * DELETE /api/admin/departments/:id - Delete department
   */
  async deleteDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      this.logger.log('[AdminAcademicController] Deleting department:', id);

      const deleted = await this.academicService.deleteDepartment(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Department not found',
          timestamp: new Date(),
        });
        return;
      }

      res.json({
        success: true,
        message: 'Department deleted successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      this.logger.error('[AdminAcademicController] Error deleting department:', error);
      
      if (error.message === 'Department not found') {
        res.status(404).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else if (error.message.includes('Cannot delete department')) {
        res.status(400).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to delete department',
          timestamp: new Date(),
        });
      }
    }
  }

  // ==================== PROGRAM ENDPOINTS ====================

  /**
   * GET /api/admin/programs - Get all programs
   */
  async getPrograms(req: Request, res: Response): Promise<void> {
    try {
      this.logger.log('[AdminAcademicController] Getting programs');

      // Parse and validate query parameters
      const queryResult = ProgramQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: queryResult.error.errors,
          timestamp: new Date(),
        });
        return;
      }

      const query = queryResult.data;
      const result = await this.academicService.getPrograms(query);

      res.json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[AdminAcademicController] Error getting programs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get programs',
        timestamp: new Date(),
      });
    }
  }

  /**
   * GET /api/admin/programs/:id - Get program by ID
   */
  async getProgramById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      this.logger.log('[AdminAcademicController] Getting program by ID:', id);

      const program = await this.academicService.getProgramById(id);

      if (!program) {
        res.status(404).json({
          success: false,
          error: 'Program not found',
          timestamp: new Date(),
        });
        return;
      }

      res.json({
        success: true,
        data: program,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[AdminAcademicController] Error getting program by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get program',
        timestamp: new Date(),
      });
    }
  }

  /**
   * POST /api/admin/programs - Create new program
   */
  async createProgram(req: Request, res: Response): Promise<void> {
    try {
      this.logger.log('[AdminAcademicController] Creating program');

      // Validate request body
      const validationResult = CreateProgramRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors,
          timestamp: new Date(),
        });
        return;
      }

      const programData = validationResult.data;
      const program = await this.academicService.createProgram(programData);

      res.status(201).json({
        success: true,
        data: program,
        message: 'Program created successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      this.logger.error('[AdminAcademicController] Error creating program:', error);
      
      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create program',
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * PUT /api/admin/programs/:id - Update program
   */
  async updateProgram(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      this.logger.log('[AdminAcademicController] Updating program:', id);

      // Validate request body
      const validationResult = UpdateProgramRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors,
          timestamp: new Date(),
        });
        return;
      }

      const programData = validationResult.data;
      const program = await this.academicService.updateProgram(id, programData);

      res.json({
        success: true,
        data: program,
        message: 'Program updated successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      this.logger.error('[AdminAcademicController] Error updating program:', error);
      
      if (error.message === 'Program not found') {
        res.status(404).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update program',
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * DELETE /api/admin/programs/:id - Delete program
   */
  async deleteProgram(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      this.logger.log('[AdminAcademicController] Deleting program:', id);

      const deleted = await this.academicService.deleteProgram(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Program not found',
          timestamp: new Date(),
        });
        return;
      }

      res.json({
        success: true,
        message: 'Program deleted successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      this.logger.error('[AdminAcademicController] Error deleting program:', error);
      
      if (error.message === 'Program not found') {
        res.status(404).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else if (error.message.includes('Cannot delete program')) {
        res.status(400).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to delete program',
          timestamp: new Date(),
        });
      }
    }
  }

  // ==================== PROGRAM-DEPARTMENT RELATIONSHIP ENDPOINTS ====================

  /**
   * POST /api/admin/program-departments - Link program to department
   */
  async linkProgramToDepartment(req: Request, res: Response): Promise<void> {
    try {
      this.logger.log('[AdminAcademicController] Linking program to department');

      // Validate request body
      const validationResult = CreateProgramDepartmentRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors,
          timestamp: new Date(),
        });
        return;
      }

      const linkData = validationResult.data;
      const link = await this.academicService.linkProgramToDepartment(linkData);

      res.status(201).json({
        success: true,
        data: link,
        message: 'Program linked to department successfully',
        timestamp: new Date(),
      });
    } catch (error: any) {
      this.logger.error('[AdminAcademicController] Error linking program to department:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else if (error.message.includes('already linked')) {
        res.status(409).json({
          success: false,
          error: error.message,
          timestamp: new Date(),
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to link program to department',
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * GET /api/admin/departments/:id/programs - Get programs by department
   */
  async getProgramsByDepartment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      this.logger.log('[AdminAcademicController] Getting programs for department:', id);

      const programs = await this.academicService.getProgramsByDepartment(id);

      res.json({
        success: true,
        data: programs,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[AdminAcademicController] Error getting programs by department:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get programs by department',
        timestamp: new Date(),
      });
    }
  }

  /**
   * GET /api/admin/programs/:id/departments - Get departments by program
   */
  async getDepartmentsByProgram(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      this.logger.log('[AdminAcademicController] Getting departments for program:', id);

      const departments = await this.academicService.getDepartmentsByProgram(id);

      res.json({
        success: true,
        data: departments,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('[AdminAcademicController] Error getting departments by program:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get departments by program',
        timestamp: new Date(),
      });
    }
  }
}
