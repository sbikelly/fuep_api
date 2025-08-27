import { z } from 'zod';

// ==================== FACULTY TYPES ====================

export interface Faculty {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFacultyRequest {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateFacultyRequest {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface FacultyQuery {
  search?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

// ==================== DEPARTMENT TYPES ====================

export interface Department {
  id: string;
  facultyId: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  faculty?: Faculty;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDepartmentRequest {
  facultyId: string;
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateDepartmentRequest {
  facultyId?: string;
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface DepartmentQuery {
  search?: string;
  facultyId?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

// ==================== PROGRAM TYPES ====================

export interface Program {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProgramRequest {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateProgramRequest {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface ProgramQuery {
  search?: string;
  isActive?: boolean;
  page: number;
  limit: number;
}

// ==================== PROGRAM-DEPARTMENT LINKING TYPES ====================

export interface ProgramDepartment {
  id: string;
  programId: string;
  departmentId: string;
  isActive: boolean;
  program?: Program;
  department?: Department;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProgramDepartmentRequest {
  programId: string;
  departmentId: string;
  isActive?: boolean;
}

// ==================== ZOD SCHEMAS ====================

export const FacultySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateFacultyRequestSchema = z.object({
  name: z.string().min(1, 'Faculty name is required'),
  code: z.string().min(1, 'Faculty code is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateFacultyRequestSchema = CreateFacultyRequestSchema.partial();

export const DepartmentSchema = z.object({
  id: z.string().uuid(),
  facultyId: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean(),
  faculty: FacultySchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateDepartmentRequestSchema = z.object({
  facultyId: z.string().uuid('Valid faculty ID is required'),
  name: z.string().min(1, 'Department name is required'),
  code: z.string().min(1, 'Department code is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateDepartmentRequestSchema = CreateDepartmentRequestSchema.partial();

export const ProgramSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateProgramRequestSchema = z.object({
  name: z.string().min(1, 'Program name is required'),
  code: z.string().min(1, 'Program code is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateProgramRequestSchema = CreateProgramRequestSchema.partial();

export const ProgramDepartmentSchema = z.object({
  id: z.string().uuid(),
  programId: z.string().uuid(),
  departmentId: z.string().uuid(),
  isActive: z.boolean(),
  program: ProgramSchema.optional(),
  department: DepartmentSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateProgramDepartmentRequestSchema = z.object({
  programId: z.string().uuid('Valid program ID is required'),
  departmentId: z.string().uuid('Valid department ID is required'),
  isActive: z.boolean().default(true),
});
