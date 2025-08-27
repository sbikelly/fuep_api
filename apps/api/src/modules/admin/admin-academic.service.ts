import {
  CreateDepartmentRequest,
  CreateFacultyRequest,
  CreateProgramDepartmentRequest,
  CreateProgramRequest,
  Department,
  DepartmentQuery,
  Faculty,
  FacultyQuery,
  Program,
  ProgramDepartment,
  ProgramQuery,
  UpdateDepartmentRequest,
  UpdateFacultyRequest,
  UpdateProgramRequest,
} from '@fuep/types';

import { db } from '../../db/knex.js';
import { logger } from '../../middleware/logging.js';

export class AdminAcademicService {
  private logger: Console;

  constructor(logger: Console = console) {
    this.logger = logger;
  }

  // ==================== FACULTY MANAGEMENT ====================

  /**
   * Create a new faculty
   */
  async createFaculty(data: CreateFacultyRequest): Promise<Faculty> {
    try {
      this.logger.log('[AdminAcademicService] Creating faculty:', data);

      // Check if faculty code already exists
      const existingFaculty = await db('faculties')
        .where({ code: data.code })
        .first();

      if (existingFaculty) {
        throw new Error(`Faculty with code '${data.code}' already exists`);
      }

      const [facultyId] = await db('faculties').insert({
        name: data.name,
        code: data.code,
        description: data.description,
        is_active: data.isActive ?? true,
        created_at: new Date(),
        updated_at: new Date(),
      }).returning('id');

      const faculty = await db('faculties')
        .where({ id: facultyId.id || facultyId })
        .first();

      if (!faculty) {
        throw new Error('Failed to create faculty');
      }

      this.logger.log('[AdminAcademicService] Faculty created successfully:', faculty.id);

      return {
        id: faculty.id,
        name: faculty.name,
        code: faculty.code,
        description: faculty.description,
        isActive: faculty.is_active,
        createdAt: faculty.created_at,
        updatedAt: faculty.updated_at,
      };
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error creating faculty:', error);
      throw error;
    }
  }

  /**
   * Get all faculties with pagination and filtering
   */
  async getFaculties(query: FacultyQuery): Promise<{
    data: Faculty[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      this.logger.log('[AdminAcademicService] Getting faculties with query:', query);

      let queryBuilder = db('faculties').select('*');

      // Apply search filter
      if (query.search) {
        queryBuilder = queryBuilder.where(function() {
          this.whereILike('name', `%${query.search}%`)
            .orWhereILike('code', `%${query.search}%`)
            .orWhereILike('description', `%${query.search}%`);
        });
      }

      // Apply active filter
      if (query.isActive !== undefined) {
        queryBuilder = queryBuilder.where({ is_active: query.isActive });
      }

      // Get total count
      const totalResult = await db('faculties').count('* as count').first();
      const total = parseInt(totalResult?.count as string || '0');

      // Apply pagination
      const offset = (query.page - 1) * query.limit;
      const faculties = await queryBuilder
        .orderBy('name', 'asc')
        .limit(query.limit)
        .offset(offset);

      const result = faculties.map(faculty => ({
        id: faculty.id,
        name: faculty.name,
        code: faculty.code,
        description: faculty.description,
        isActive: faculty.is_active,
        createdAt: faculty.created_at,
        updatedAt: faculty.updated_at,
      }));

      return {
        data: result,
        total,
        page: query.page,
        limit: query.limit,
      };
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error getting faculties:', error);
      throw error;
    }
  }

  /**
   * Get faculty by ID
   */
  async getFacultyById(id: string): Promise<Faculty | null> {
    try {
      this.logger.log('[AdminAcademicService] Getting faculty by ID:', id);

      const faculty = await db('faculties')
        .where({ id })
        .first();

      if (!faculty) {
        return null;
      }

      return {
        id: faculty.id,
        name: faculty.name,
        code: faculty.code,
        description: faculty.description,
        isActive: faculty.is_active,
        createdAt: faculty.created_at,
        updatedAt: faculty.updated_at,
      };
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error getting faculty by ID:', error);
      throw error;
    }
  }

  /**
   * Update faculty
   */
  async updateFaculty(id: string, data: UpdateFacultyRequest): Promise<Faculty> {
    try {
      this.logger.log('[AdminAcademicService] Updating faculty:', id, data);

      // Check if faculty exists
      const existingFaculty = await db('faculties')
        .where({ id })
        .first();

      if (!existingFaculty) {
        throw new Error('Faculty not found');
      }

      // Check if new code conflicts with existing faculty
      if (data.code && data.code !== existingFaculty.code) {
        const codeConflict = await db('faculties')
          .where({ code: data.code })
          .whereNot({ id })
          .first();

        if (codeConflict) {
          throw new Error(`Faculty with code '${data.code}' already exists`);
        }
      }

      const updateData: any = {
        updated_at: new Date(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.code !== undefined) updateData.code = data.code;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      await db('faculties')
        .where({ id })
        .update(updateData);

      const updatedFaculty = await db('faculties')
        .where({ id })
        .first();

      if (!updatedFaculty) {
        throw new Error('Failed to update faculty');
      }

      this.logger.log('[AdminAcademicService] Faculty updated successfully:', id);

      return {
        id: updatedFaculty.id,
        name: updatedFaculty.name,
        code: updatedFaculty.code,
        description: updatedFaculty.description,
        isActive: updatedFaculty.is_active,
        createdAt: updatedFaculty.created_at,
        updatedAt: updatedFaculty.updated_at,
      };
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error updating faculty:', error);
      throw error;
    }
  }

  /**
   * Delete faculty (soft delete by setting is_active to false)
   */
  async deleteFaculty(id: string): Promise<boolean> {
    try {
      this.logger.log('[AdminAcademicService] Deleting faculty:', id);

      // Check if faculty exists
      const existingFaculty = await db('faculties')
        .where({ id })
        .first();

      if (!existingFaculty) {
        throw new Error('Faculty not found');
      }

      // Check if faculty has departments
      const departmentCount = await db('departments')
        .where({ faculty_id: id, is_active: true })
        .count('* as count')
        .first();

      if (parseInt(departmentCount?.count as string || '0') > 0) {
        throw new Error('Cannot delete faculty with active departments');
      }

      // Soft delete
      await db('faculties')
        .where({ id })
        .update({ 
          is_active: false,
          updated_at: new Date()
        });

      this.logger.log('[AdminAcademicService] Faculty deleted successfully:', id);
      return true;
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error deleting faculty:', error);
      throw error;
    }
  }

  // ==================== DEPARTMENT MANAGEMENT ====================

  /**
   * Create a new department
   */
  async createDepartment(data: CreateDepartmentRequest): Promise<Department> {
    try {
      this.logger.log('[AdminAcademicService] Creating department:', data);

      // Check if faculty exists
      const faculty = await db('faculties')
        .where({ id: data.facultyId, is_active: true })
        .first();

      if (!faculty) {
        throw new Error('Faculty not found or inactive');
      }

      // Check if department code already exists
      const existingDepartment = await db('departments')
        .where({ code: data.code })
        .first();

      if (existingDepartment) {
        throw new Error(`Department with code '${data.code}' already exists`);
      }

      const [departmentId] = await db('departments').insert({
        faculty_id: data.facultyId,
        name: data.name,
        code: data.code,
        description: data.description,
        is_active: data.isActive ?? true,
        created_at: new Date(),
        updated_at: new Date(),
      }).returning('id');

      const department = await db('departments')
        .where({ id: departmentId.id || departmentId })
        .first();

      if (!department) {
        throw new Error('Failed to create department');
      }

      this.logger.log('[AdminAcademicService] Department created successfully:', department.id);

      return {
        id: department.id,
        facultyId: department.faculty_id,
        name: department.name,
        code: department.code,
        description: department.description,
        isActive: department.is_active,
        faculty: {
          id: faculty.id,
          name: faculty.name,
          code: faculty.code,
          description: faculty.description,
          isActive: faculty.is_active,
          createdAt: faculty.created_at,
          updatedAt: faculty.updated_at,
        },
        createdAt: department.created_at,
        updatedAt: department.updated_at,
      };
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error creating department:', error);
      throw error;
    }
  }

  /**
   * Get all departments with pagination and filtering
   */
  async getDepartments(query: DepartmentQuery): Promise<{
    data: Department[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      this.logger.log('[AdminAcademicService] Getting departments with query:', query);

      let queryBuilder = db('departments as d')
        .select(
          'd.*',
          'f.id as faculty_id',
          'f.name as faculty_name',
          'f.code as faculty_code',
          'f.description as faculty_description',
          'f.is_active as faculty_is_active',
          'f.created_at as faculty_created_at',
          'f.updated_at as faculty_updated_at'
        )
        .leftJoin('faculties as f', 'd.faculty_id', 'f.id');

      // Apply search filter
      if (query.search) {
        queryBuilder = queryBuilder.where(function() {
          this.whereILike('d.name', `%${query.search}%`)
            .orWhereILike('d.code', `%${query.search}%`)
            .orWhereILike('d.description', `%${query.search}%`)
            .orWhereILike('f.name', `%${query.search}%`);
        });
      }

      // Apply faculty filter
      if (query.facultyId) {
        queryBuilder = queryBuilder.where({ 'd.faculty_id': query.facultyId });
      }

      // Apply active filter
      if (query.isActive !== undefined) {
        queryBuilder = queryBuilder.where({ 'd.is_active': query.isActive });
      }

      // Get total count
      const totalResult = await db('departments').count('* as count').first();
      const total = parseInt(totalResult?.count as string || '0');

      // Apply pagination
      const offset = (query.page - 1) * query.limit;
      const departments = await queryBuilder
        .orderBy('d.name', 'asc')
        .limit(query.limit)
        .offset(offset);

      const result = departments.map(dept => ({
        id: dept.id,
        facultyId: dept.faculty_id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
        isActive: dept.is_active,
        faculty: dept.faculty_id ? {
          id: dept.faculty_id,
          name: dept.faculty_name,
          code: dept.faculty_code,
          description: dept.faculty_description,
          isActive: dept.faculty_is_active,
          createdAt: dept.faculty_created_at,
          updatedAt: dept.faculty_updated_at,
        } : undefined,
        createdAt: dept.created_at,
        updatedAt: dept.updated_at,
      }));

      return {
        data: result,
        total,
        page: query.page,
        limit: query.limit,
      };
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error getting departments:', error);
      throw error;
    }
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(id: string): Promise<Department | null> {
    try {
      this.logger.log('[AdminAcademicService] Getting department by ID:', id);

      const department = await db('departments as d')
        .select(
          'd.*',
          'f.id as faculty_id',
          'f.name as faculty_name',
          'f.code as faculty_code',
          'f.description as faculty_description',
          'f.is_active as faculty_is_active',
          'f.created_at as faculty_created_at',
          'f.updated_at as faculty_updated_at'
        )
        .leftJoin('faculties as f', 'd.faculty_id', 'f.id')
        .where({ 'd.id': id })
        .first();

      if (!department) {
        return null;
      }

      return {
        id: department.id,
        facultyId: department.faculty_id,
        name: department.name,
        code: department.code,
        description: department.description,
        isActive: department.is_active,
        faculty: department.faculty_id ? {
          id: department.faculty_id,
          name: department.faculty_name,
          code: department.faculty_code,
          description: department.faculty_description,
          isActive: department.faculty_is_active,
          createdAt: department.faculty_created_at,
          updatedAt: department.faculty_updated_at,
        } : undefined,
        createdAt: department.created_at,
        updatedAt: department.updated_at,
      };
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error getting department by ID:', error);
      throw error;
    }
  }

  /**
   * Update department
   */
  async updateDepartment(id: string, data: UpdateDepartmentRequest): Promise<Department> {
    try {
      this.logger.log('[AdminAcademicService] Updating department:', id, data);

      // Check if department exists
      const existingDepartment = await db('departments')
        .where({ id })
        .first();

      if (!existingDepartment) {
        throw new Error('Department not found');
      }

      // Check if faculty exists (if updating faculty)
      if (data.facultyId && data.facultyId !== existingDepartment.faculty_id) {
        const faculty = await db('faculties')
          .where({ id: data.facultyId, is_active: true })
          .first();

        if (!faculty) {
          throw new Error('Faculty not found or inactive');
        }
      }

      // Check if new code conflicts with existing department
      if (data.code && data.code !== existingDepartment.code) {
        const codeConflict = await db('departments')
          .where({ code: data.code })
          .whereNot({ id })
          .first();

        if (codeConflict) {
          throw new Error(`Department with code '${data.code}' already exists`);
        }
      }

      const updateData: any = {
        updated_at: new Date(),
      };

      if (data.facultyId !== undefined) updateData.faculty_id = data.facultyId;
      if (data.name !== undefined) updateData.name = data.name;
      if (data.code !== undefined) updateData.code = data.code;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      await db('departments')
        .where({ id })
        .update(updateData);

      const updatedDepartment = await this.getDepartmentById(id);

      if (!updatedDepartment) {
        throw new Error('Failed to update department');
      }

      this.logger.log('[AdminAcademicService] Department updated successfully:', id);

      return updatedDepartment;
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error updating department:', error);
      throw error;
    }
  }

  /**
   * Delete department (soft delete by setting is_active to false)
   */
  async deleteDepartment(id: string): Promise<boolean> {
    try {
      this.logger.log('[AdminAcademicService] Deleting department:', id);

      // Check if department exists
      const existingDepartment = await db('departments')
        .where({ id })
        .first();

      if (!existingDepartment) {
        throw new Error('Department not found');
      }

      // Check if department has active applications
      const applicationCount = await db('applications')
        .where({ department_id: id })
        .count('* as count')
        .first();

      if (parseInt(applicationCount?.count as string || '0') > 0) {
        throw new Error('Cannot delete department with active applications');
      }

      // Soft delete
      await db('departments')
        .where({ id })
        .update({ 
          is_active: false,
          updated_at: new Date()
        });

      this.logger.log('[AdminAcademicService] Department deleted successfully:', id);
      return true;
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error deleting department:', error);
      throw error;
    }
  }

  // ==================== PROGRAM MANAGEMENT ====================

  /**
   * Create a new program
   */
  async createProgram(data: CreateProgramRequest): Promise<Program> {
    try {
      this.logger.log('[AdminAcademicService] Creating program:', data);

      // Check if program code already exists
      const existingProgram = await db('programs')
        .where({ code: data.code })
        .first();

      if (existingProgram) {
        throw new Error(`Program with code '${data.code}' already exists`);
      }

      const [programId] = await db('programs').insert({
        name: data.name,
        code: data.code,
        description: data.description,
        is_active: data.isActive ?? true,
        created_at: new Date(),
        updated_at: new Date(),
      }).returning('id');

      const program = await db('programs')
        .where({ id: programId.id || programId })
        .first();

      if (!program) {
        throw new Error('Failed to create program');
      }

      this.logger.log('[AdminAcademicService] Program created successfully:', program.id);

      return {
        id: program.id,
        name: program.name,
        code: program.code,
        description: program.description,
        isActive: program.is_active,
        createdAt: program.created_at,
        updatedAt: program.updated_at,
      };
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error creating program:', error);
      throw error;
    }
  }

  /**
   * Get all programs with pagination and filtering
   */
  async getPrograms(query: ProgramQuery): Promise<{
    data: Program[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      this.logger.log('[AdminAcademicService] Getting programs with query:', query);

      let queryBuilder = db('programs').select('*');

      // Apply search filter
      if (query.search) {
        queryBuilder = queryBuilder.where(function() {
          this.whereILike('name', `%${query.search}%`)
            .orWhereILike('code', `%${query.search}%`)
            .orWhereILike('description', `%${query.search}%`);
        });
      }

      // Apply active filter
      if (query.isActive !== undefined) {
        queryBuilder = queryBuilder.where({ is_active: query.isActive });
      }

      // Get total count
      const totalResult = await db('programs').count('* as count').first();
      const total = parseInt(totalResult?.count as string || '0');

      // Apply pagination
      const offset = (query.page - 1) * query.limit;
      const programs = await queryBuilder
        .orderBy('name', 'asc')
        .limit(query.limit)
        .offset(offset);

      const result = programs.map(program => ({
        id: program.id,
        name: program.name,
        code: program.code,
        description: program.description,
        isActive: program.is_active,
        createdAt: program.created_at,
        updatedAt: program.updated_at,
      }));

      return {
        data: result,
        total,
        page: query.page,
        limit: query.limit,
      };
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error getting programs:', error);
      throw error;
    }
  }

  /**
   * Get program by ID
   */
  async getProgramById(id: string): Promise<Program | null> {
    try {
      this.logger.log('[AdminAcademicService] Getting program by ID:', id);

      const program = await db('programs')
        .where({ id })
        .first();

      if (!program) {
        return null;
      }

      return {
        id: program.id,
        name: program.name,
        code: program.code,
        description: program.description,
        isActive: program.is_active,
        createdAt: program.created_at,
        updatedAt: program.updated_at,
      };
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error getting program by ID:', error);
      throw error;
    }
  }

  /**
   * Update program
   */
  async updateProgram(id: string, data: UpdateProgramRequest): Promise<Program> {
    try {
      this.logger.log('[AdminAcademicService] Updating program:', id, data);

      // Check if program exists
      const existingProgram = await db('programs')
        .where({ id })
        .first();

      if (!existingProgram) {
        throw new Error('Program not found');
      }

      // Check if new code conflicts with existing program
      if (data.code && data.code !== existingProgram.code) {
        const codeConflict = await db('programs')
          .where({ code: data.code })
          .whereNot({ id })
          .first();

        if (codeConflict) {
          throw new Error(`Program with code '${data.code}' already exists`);
        }
      }

      const updateData: any = {
        updated_at: new Date(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.code !== undefined) updateData.code = data.code;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      await db('programs')
        .where({ id })
        .update(updateData);

      const updatedProgram = await db('programs')
        .where({ id })
        .first();

      if (!updatedProgram) {
        throw new Error('Failed to update program');
      }

      this.logger.log('[AdminAcademicService] Program updated successfully:', id);

      return {
        id: updatedProgram.id,
        name: updatedProgram.name,
        code: updatedProgram.code,
        description: updatedProgram.description,
        isActive: updatedProgram.is_active,
        createdAt: updatedProgram.created_at,
        updatedAt: updatedProgram.updated_at,
      };
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error updating program:', error);
      throw error;
    }
  }

  /**
   * Delete program (soft delete by setting is_active to false)
   */
  async deleteProgram(id: string): Promise<boolean> {
    try {
      this.logger.log('[AdminAcademicService] Deleting program:', id);

      // Check if program exists
      const existingProgram = await db('programs')
        .where({ id })
        .first();

      if (!existingProgram) {
        throw new Error('Program not found');
      }

      // Check if program has active applications
      const applicationCount = await db('applications')
        .where({ program_id: id })
        .count('* as count')
        .first();

      if (parseInt(applicationCount?.count as string || '0') > 0) {
        throw new Error('Cannot delete program with active applications');
      }

      // Soft delete
      await db('programs')
        .where({ id })
        .update({ 
          is_active: false,
          updated_at: new Date()
        });

      this.logger.log('[AdminAcademicService] Program deleted successfully:', id);
      return true;
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error deleting program:', error);
      throw error;
    }
  }

  // ==================== PROGRAM-DEPARTMENT RELATIONSHIPS ====================

  /**
   * Link program to department
   */
  async linkProgramToDepartment(data: CreateProgramDepartmentRequest): Promise<ProgramDepartment> {
    try {
      this.logger.log('[AdminAcademicService] Linking program to department:', data);

      // Check if program exists
      const program = await db('programs')
        .where({ id: data.programId, is_active: true })
        .first();

      if (!program) {
        throw new Error('Program not found or inactive');
      }

      // Check if department exists
      const department = await db('departments')
        .where({ id: data.departmentId, is_active: true })
        .first();

      if (!department) {
        throw new Error('Department not found or inactive');
      }

      // Check if relationship already exists
      const existingLink = await db('program_departments')
        .where({ 
          program_id: data.programId, 
          department_id: data.departmentId 
        })
        .first();

      if (existingLink) {
        throw new Error('Program is already linked to this department');
      }

      const [linkId] = await db('program_departments').insert({
        program_id: data.programId,
        department_id: data.departmentId,
        is_active: data.isActive ?? true,
        created_at: new Date(),
        updated_at: new Date(),
      }).returning('id');

      const link = await db('program_departments')
        .where({ id: linkId.id || linkId })
        .first();

      if (!link) {
        throw new Error('Failed to create program-department link');
      }

      this.logger.log('[AdminAcademicService] Program linked to department successfully:', link.id);

      return {
        id: link.id,
        programId: link.program_id,
        departmentId: link.department_id,
        isActive: link.is_active,
        program: {
          id: program.id,
          name: program.name,
          code: program.code,
          description: program.description,
          isActive: program.is_active,
          createdAt: program.created_at,
          updatedAt: program.updated_at,
        },
        department: {
          id: department.id,
          facultyId: department.faculty_id,
          name: department.name,
          code: department.code,
          description: department.description,
          isActive: department.is_active,
          createdAt: department.created_at,
          updatedAt: department.updated_at,
        },
        createdAt: link.created_at,
        updatedAt: link.updated_at,
      };
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error linking program to department:', error);
      throw error;
    }
  }

  /**
   * Get available programs for a department
   */
  async getProgramsByDepartment(departmentId: string): Promise<Program[]> {
    try {
      this.logger.log('[AdminAcademicService] Getting programs for department:', departmentId);

      const programs = await db('programs as p')
        .select('p.*')
        .join('program_departments as pd', 'p.id', 'pd.program_id')
        .where({ 
          'pd.department_id': departmentId,
          'pd.is_active': true,
          'p.is_active': true
        })
        .orderBy('p.name', 'asc');

      return programs.map(program => ({
        id: program.id,
        name: program.name,
        code: program.code,
        description: program.description,
        isActive: program.is_active,
        createdAt: program.created_at,
        updatedAt: program.updated_at,
      }));
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error getting programs by department:', error);
      throw error;
    }
  }

  /**
   * Get available departments for a program
   */
  async getDepartmentsByProgram(programId: string): Promise<Department[]> {
    try {
      this.logger.log('[AdminAcademicService] Getting departments for program:', programId);

      const departments = await db('departments as d')
        .select(
          'd.*',
          'f.id as faculty_id',
          'f.name as faculty_name',
          'f.code as faculty_code',
          'f.description as faculty_description',
          'f.is_active as faculty_is_active',
          'f.created_at as faculty_created_at',
          'f.updated_at as faculty_updated_at'
        )
        .join('program_departments as pd', 'd.id', 'pd.department_id')
        .leftJoin('faculties as f', 'd.faculty_id', 'f.id')
        .where({ 
          'pd.program_id': programId,
          'pd.is_active': true,
          'd.is_active': true
        })
        .orderBy('d.name', 'asc');

      return departments.map(dept => ({
        id: dept.id,
        facultyId: dept.faculty_id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
        isActive: dept.is_active,
        faculty: dept.faculty_id ? {
          id: dept.faculty_id,
          name: dept.faculty_name,
          code: dept.faculty_code,
          description: dept.faculty_description,
          isActive: dept.faculty_is_active,
          createdAt: dept.faculty_created_at,
          updatedAt: dept.faculty_updated_at,
        } : undefined,
        createdAt: dept.created_at,
        updatedAt: dept.updated_at,
      }));
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error getting departments by program:', error);
      throw error;
    }
  }

  // ==================== ACADEMIC STRUCTURE ====================

  /**
   * Get the complete academic structure
   */
  async getAcademicStructure(): Promise<{
    faculties: Faculty[];
    departments: Department[];
    programs: Program[];
    programDepartments: ProgramDepartment[];
  }> {
    try {
      this.logger.log('[AdminAcademicService] Getting academic structure');

      const [faculties, departments, programs, programDepartments] = await Promise.all([
        db('faculties').where({ is_active: true }).orderBy('name'),
        db('departments').where({ is_active: true }).orderBy('name'),
        db('programs').where({ is_active: true }).orderBy('name'),
        db('program_departments').select('*'),
      ]);

      return {
        faculties: faculties.map(this.mapFacultyFromDb),
        departments: departments.map(this.mapDepartmentFromDb),
        programs: programs.map(this.mapProgramFromDb),
        programDepartments: programDepartments.map(this.mapProgramDepartmentFromDb),
      };
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error getting academic structure:', error);
      throw error;
    }
  }

  // ==================== MAPPING METHODS ====================

  private mapFacultyFromDb(faculty: any): Faculty {
    return {
      id: faculty.id,
      name: faculty.name,
      code: faculty.code,
      description: faculty.description,
      isActive: faculty.is_active,
      createdAt: new Date(faculty.created_at),
      updatedAt: new Date(faculty.updated_at),
    };
  }

  private mapDepartmentFromDb(department: any): Department {
    return {
      id: department.id,
      facultyId: department.faculty_id,
      name: department.name,
      code: department.code,
      description: department.description,
      isActive: department.is_active,
      createdAt: new Date(department.created_at),
      updatedAt: new Date(department.updated_at),
    };
  }

  private mapProgramFromDb(program: any): Program {
    return {
      id: program.id,
      name: program.name,
      code: program.code,
      description: program.description,
      isActive: program.is_active,
      createdAt: new Date(program.created_at),
      updatedAt: new Date(program.updated_at),
    };
  }

  private mapProgramDepartmentFromDb(link: any): ProgramDepartment {
    return {
      id: link.id,
      programId: link.program_id,
      departmentId: link.department_id,
      isActive: link.is_active,
      createdAt: new Date(link.created_at),
      updatedAt: new Date(link.updated_at),
    };
  }
}
