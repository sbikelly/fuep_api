import { z } from 'zod';

// Payment purpose categories for department association
export type PaymentPurposeCategory =
  | 'SCIENCES'
  | 'ARTS'
  | 'LANGUAGES'
  | 'SOCIAL SCIENCES'
  | 'EDUCATION'
  | 'SPECIAL EDUCATION'
  | 'PRIMARY EDUCATION'
  | 'SECONDARY EDUCATION'
  | 'VOCATIONAL EDUCATION'
  | 'ENVIRONMENTAL SCIENCES'
  | 'MANAGEMENT'
  | 'HEALTH'
  | 'ENGINEERING'
  | 'BUSINESS'
  | 'OTHER';

export const PaymentPurposeCategorySchema = z.enum([
  'SCIENCES',
  'ARTS',
  'LANGUAGES',
  'SOCIAL SCIENCES',
  'EDUCATION',
  'SPECIAL EDUCATION',
  'PRIMARY EDUCATION',
  'SECONDARY EDUCATION',
  'VOCATIONAL EDUCATION',
  'ENVIRONMENTAL SCIENCES',
  'MANAGEMENT',
  'HEALTH',
  'ENGINEERING',
  'BUSINESS',
  'OTHER',
]);

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
  paymentCategory?: PaymentPurposeCategory; // Payment category for school fee determination
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
  paymentCategory?: PaymentPurposeCategory; // Payment category for school fee determination
  isActive?: boolean;
}

export interface UpdateDepartmentRequest {
  facultyId?: string;
  name?: string;
  code?: string;
  description?: string;
  paymentCategory?: PaymentPurposeCategory; // Payment category for school fee determination
  isActive?: boolean;
}

export interface DepartmentQuery {
  search?: string;
  facultyId?: string;
  isActive?: boolean;
  page: number;
  limit: number;
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
  paymentCategory: PaymentPurposeCategorySchema.optional(),
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
  paymentCategory: PaymentPurposeCategorySchema.optional(),
  isActive: z.boolean().default(true),
});

export const UpdateDepartmentRequestSchema = CreateDepartmentRequestSchema.partial();

export const FacultyQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export const DepartmentQuerySchema = z.object({
  search: z.string().optional(),
  facultyId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});
