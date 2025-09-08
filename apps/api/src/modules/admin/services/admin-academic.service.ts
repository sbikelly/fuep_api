import {
  CreateDepartmentRequest,
  CreateFacultyRequest,
  Department,
  DepartmentQuery,
  Faculty,
  FacultyQuery,
  PaymentPurposeCategory,
  UpdateDepartmentRequest,
  UpdateFacultyRequest,
} from '@fuep/types';
import { Knex } from 'knex';

import { db } from '../../../db/knex.js';
import { logger } from '../../../middleware/logging.js';

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
      const existingFaculty = await db('faculties').where({ code: data.code }).first();

      if (existingFaculty) {
        throw new Error(`Faculty with code '${data.code}' already exists`);
      }

      const [facultyId] = await db('faculties')
        .insert({
          name: data.name,
          code: data.code,
          description: data.description,
          is_active: data.isActive ?? true,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('id');

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
        queryBuilder = queryBuilder.where(function () {
          this.whereILike('name', `%${query.search}%`)
            .orWhereILike('code', `%${query.search}%`)
            .orWhereILike('description', `%${query.search}%`);
        });
      }

      // Apply active filter
      if (query.isActive !== undefined) {
        queryBuilder = queryBuilder.where({ is_active: query.isActive });
      }

      // Get total count with same filters
      const totalQuery = db('faculties').select('*');

      // Apply same filters for count
      if (query.search) {
        totalQuery.where(function () {
          this.whereILike('name', `%${query.search}%`)
            .orWhereILike('code', `%${query.search}%`)
            .orWhereILike('description', `%${query.search}%`);
        });
      }

      if (query.isActive !== undefined) {
        totalQuery.where({ is_active: query.isActive });
      }

      const totalResult = await totalQuery.count('* as count').first();
      const total = parseInt((totalResult?.count as string) || '0');

      // Apply pagination
      const offset = (query.page - 1) * query.limit;
      const faculties = await queryBuilder.orderBy('name', 'asc').limit(query.limit).offset(offset);

      const result = faculties.map((faculty) => ({
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

      const faculty = await db('faculties').where({ id }).first();

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
      const existingFaculty = await db('faculties').where({ id }).first();

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

      await db('faculties').where({ id }).update(updateData);

      const updatedFaculty = await db('faculties').where({ id }).first();

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
      const existingFaculty = await db('faculties').where({ id }).first();

      if (!existingFaculty) {
        throw new Error('Faculty not found');
      }

      // Check if faculty has departments
      const departmentCount = await db('departments')
        .where({ faculty_id: id, is_active: true })
        .count('* as count')
        .first();

      if (parseInt((departmentCount?.count as string) || '0') > 0) {
        throw new Error('Cannot delete faculty with active departments');
      }

      // Soft delete
      await db('faculties').where({ id }).update({
        is_active: false,
        updated_at: new Date(),
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
      const faculty = await db('faculties').where({ id: data.facultyId, is_active: true }).first();

      if (!faculty) {
        throw new Error('Faculty not found or inactive');
      }

      // Check if department code already exists
      const existingDepartment = await db('departments').where({ code: data.code }).first();

      if (existingDepartment) {
        throw new Error(`Department with code '${data.code}' already exists`);
      }

      const [departmentId] = await db('departments')
        .insert({
          faculty_id: data.facultyId,
          name: data.name,
          code: data.code,
          description: data.description,
          payment_category: data.paymentCategory,
          is_active: data.isActive ?? true,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('id');

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
        paymentCategory: department.payment_category,
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
        queryBuilder = queryBuilder.where(function () {
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

      // Get total count with same filters
      const totalQuery = db('departments as d').leftJoin('faculties as f', 'd.faculty_id', 'f.id');

      // Apply same filters for count
      if (query.search) {
        totalQuery.where(function () {
          this.whereILike('d.name', `%${query.search}%`)
            .orWhereILike('d.code', `%${query.search}%`)
            .orWhereILike('d.description', `%${query.search}%`)
            .orWhereILike('f.name', `%${query.search}%`);
        });
      }

      if (query.facultyId) {
        totalQuery.where({ 'd.faculty_id': query.facultyId });
      }

      if (query.isActive !== undefined) {
        totalQuery.where({ 'd.is_active': query.isActive });
      }

      const totalResult = await totalQuery.count('* as count').first();
      const total = parseInt((totalResult?.count as string) || '0');

      // Apply pagination
      const offset = (query.page - 1) * query.limit;
      const departments = await queryBuilder
        .orderBy('d.name', 'asc')
        .limit(query.limit)
        .offset(offset);

      const result = departments.map((dept) => ({
        id: dept.id,
        facultyId: dept.faculty_id,
        name: dept.name,
        code: dept.code,
        description: dept.description,
        paymentCategory: dept.payment_category,
        isActive: dept.is_active,
        faculty: dept.faculty_id
          ? {
              id: dept.faculty_id,
              name: dept.faculty_name,
              code: dept.faculty_code,
              description: dept.faculty_description,
              isActive: dept.faculty_is_active,
              createdAt: dept.faculty_created_at,
              updatedAt: dept.faculty_updated_at,
            }
          : undefined,
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
        paymentCategory: department.payment_category,
        isActive: department.is_active,
        faculty: department.faculty_id
          ? {
              id: department.faculty_id,
              name: department.faculty_name,
              code: department.faculty_code,
              description: department.faculty_description,
              isActive: department.faculty_is_active,
              createdAt: department.faculty_created_at,
              updatedAt: department.faculty_updated_at,
            }
          : undefined,
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
      const existingDepartment = await db('departments').where({ id }).first();

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
      if (data.paymentCategory !== undefined) updateData.payment_category = data.paymentCategory;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      await db('departments').where({ id }).update(updateData);

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
      const existingDepartment = await db('departments').where({ id }).first();

      if (!existingDepartment) {
        throw new Error('Department not found');
      }

      // Check if department has active applications
      const applicationCount = await db('applications')
        .where({ department_id: id })
        .count('* as count')
        .first();

      if (parseInt((applicationCount?.count as string) || '0') > 0) {
        throw new Error('Cannot delete department with active applications');
      }

      // Soft delete
      await db('departments').where({ id }).update({
        is_active: false,
        updated_at: new Date(),
      });

      this.logger.log('[AdminAcademicService] Department deleted successfully:', id);
      return true;
    } catch (error) {
      this.logger.error('[AdminAcademicService] Error deleting department:', error);
      throw error;
    }
  }

  // ==================== SIMPLIFIED ACADEMIC STRUCTURE ====================

  /**
   * Get the simplified academic structure (faculties and departments only)
   */
  async getAcademicStructure(): Promise<{
    faculties: Faculty[];
    departments: Department[];
  }> {
    try {
      this.logger.log('[AdminAcademicService] Getting simplified academic structure');

      const [faculties, departments] = await Promise.all([
        db('faculties').where({ is_active: true }).orderBy('name'),
        db('departments').where({ is_active: true }).orderBy('name'),
      ]);

      return {
        faculties: faculties.map(this.mapFacultyFromDb),
        departments: departments.map(this.mapDepartmentFromDb),
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
}
