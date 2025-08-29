import { z } from 'zod';

import { Department, Faculty } from './academic';
import { ApiResponse, BaseEntity, BaseEntitySchema } from './common';

// ============================================
// Simplified Candidate Types
// ============================================

// Main Candidate Interface - Simplified and streamlined
export interface Candidate extends BaseEntity {
  jambRegNo: string; // Will double as username
  firstname: string;
  surname: string;
  othernames?: string;
  gender?: 'male' | 'female' | 'other'; // Default to 'other'
  dob?: string; // Date of birth in YYYY-MM-DD format
  nationality?: string;
  state?: string;
  lga?: string;
  address?: string;
  email?: string;
  phone?: string;
  passportPhotoUrl?: string;
  signatureUrl?: string;
  department?: string; // Course of study (DEPRECATED - use departmentId)
  departmentId?: string; // Foreign key to departments table
  departmentInfo?: Department; // Full department information including faculty
  modeOfEntry?: 'UTME' | 'DE'; // Default to 'UTME'
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed'; // Default to 'single'
  // Document upload fields removed

  // Registration progress flags
  registrationCompleted: boolean;
  biodataCompleted: boolean;
  educationCompleted: boolean;
  nextOfKinCompleted: boolean;
  sponsorCompleted: boolean;

  // Status fields (derived from other tables)
  admissionStatus?: 'pending' | 'admitted' | 'rejected'; // From Application table
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'; // From Application table
  rrr?: string; // From Application table

  // Authentication
  passwordHash?: string;
}

// Candidate Schema for validation
export const CandidateSchema = BaseEntitySchema.extend({
  jambRegNo: z.string().min(10).max(20),
  firstname: z.string().min(1).max(100),
  surname: z.string().min(1).max(100),
  othernames: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // YYYY-MM-DD format
  nationality: z.string().max(64).optional(),
  state: z.string().max(64).optional(),
  lga: z.string().max(64).optional(),
  address: z.string().max(500).optional(),
  email: z.string().email().max(160).optional(),
  phone: z.string().max(32).optional(),
  passportPhotoUrl: z.string().max(255).optional(),
  signatureUrl: z.string().max(255).optional(),
  department: z.string().max(100).optional(), // DEPRECATED
  departmentId: z.string().uuid().optional(),
  modeOfEntry: z.enum(['UTME', 'DE']).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  // Document upload fields removed

  // Registration progress flags
  registrationCompleted: z.boolean(),
  biodataCompleted: z.boolean(),
  educationCompleted: z.boolean(),
  nextOfKinCompleted: z.boolean(),
  sponsorCompleted: z.boolean(),

  // Status fields
  admissionStatus: z.enum(['pending', 'admitted', 'rejected']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  rrr: z.string().max(100).optional(),

  // Authentication
  passwordHash: z.string().optional(),
});

// ============================================
// Simplified Application Types
// ============================================

export interface Application extends BaseEntity {
  candidateId: string;
  applicationNumber: string;
  session: string;
  status: 'pending' | 'admitted' | 'rejected'; // Default to 'pending'
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;

  // Payment information
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'; // Post-UTME payment
  paymentRRR?: string;

  // Form status
  formPrinted: boolean;
  printedAt?: Date;
}

export const ApplicationSchema = BaseEntitySchema.extend({
  candidateId: z.string().uuid(),
  applicationNumber: z.string().min(1).max(50),
  session: z.string().regex(/^\d{4}\/\d{4}$/),
  status: z.enum(['pending', 'admitted', 'rejected']),
  submittedAt: z.date().optional(),
  reviewedAt: z.date().optional(),
  reviewedBy: z.string().uuid().optional(),
  reviewNotes: z.string().max(1000).optional(),

  // Payment information
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']),
  paymentRRR: z.string().max(100).optional(),

  // Form status
  formPrinted: z.boolean(),
  printedAt: z.date().optional(),
});

// ============================================
// Simplified Education Record Types
// ============================================

export interface EducationRecord extends BaseEntity {
  candidateId: string;

  // Secondary School Information
  secondarySchool?: string;
  certificateType?: 'SSCE' | 'GCE';
  examYear?: number;
  examType?: 'WAEC' | 'NECO' | 'NABTEB';
  seatingCount?: number;
  examNumbers?: string[]; // Multiple exam numbers for multiple sittings

  // Subject Results
  subjects: Array<{
    subject: string;
    grade: string;
  }>;

  // UTME Information (for UTME candidates)
  jambScore?: number;
  jambSubjects?: Array<{
    subject: string;
    score: number;
  }>;

  // DE Information (for DE candidates)
  certificateTypeDE?: 'NCE' | 'ND' | 'HND';
  institutionName?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  cgpa?: string;
  certificateNumber?: string;
  grade?: string; // A-Level grade
  // Document upload fields removed

  // Verification
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verificationNotes?: string;
}

export const EducationRecordSchema = BaseEntitySchema.extend({
  candidateId: z.string().uuid(),

  // Secondary School Information
  secondarySchool: z.string().max(200).optional(),
  certificateType: z.enum(['SSCE', 'GCE']).optional(),
  examYear: z.number().int().positive().optional(),
  examType: z.enum(['WAEC', 'NECO', 'NABTEB']).optional(),
  seatingCount: z.number().int().positive().optional(),
  examNumbers: z.array(z.string()).optional(),

  // Subject Results
  subjects: z.array(
    z.object({
      subject: z.string().min(1).max(100),
      grade: z.string().min(1).max(10),
    })
  ),

  // UTME Information
  jambScore: z.number().int().min(0).max(400).optional(),
  jambSubjects: z
    .array(
      z.object({
        subject: z.string().min(1).max(100),
        score: z.number().int().min(0).max(100),
      })
    )
    .optional(),

  // DE Information
  certificateTypeDE: z.enum(['NCE', 'ND', 'HND']).optional(),
  institutionName: z.string().max(200).optional(),
  fieldOfStudy: z.string().max(100).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  cgpa: z.string().max(10).optional(),
  certificateNumber: z.string().max(100).optional(),
  grade: z.string().max(20).optional(),
  // Document upload fields removed

  // Verification
  verificationStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
  verificationNotes: z.string().max(1000).optional(),
});

// ============================================
// Simplified Next of Kin Types
// ============================================

export interface NextOfKin extends BaseEntity {
  candidateId: string;
  surname: string;
  firstname: string;
  othernames?: string;
  relationship: string;
  phone: string;
  email?: string;
  address: string;
  occupation: string;
}

export const NextOfKinSchema = BaseEntitySchema.extend({
  candidateId: z.string().uuid(),
  surname: z.string().min(1).max(100),
  firstname: z.string().min(1).max(100),
  othernames: z.string().max(100).optional(),
  relationship: z.string().min(1).max(100),
  phone: z.string().max(32),
  email: z.string().email().max(160).optional(),
  address: z.string().min(1).max(500),
  occupation: z.string().min(1).max(100),
});

// ============================================
// Simplified Sponsor Types
// ============================================

export interface Sponsor extends BaseEntity {
  candidateId: string;
  surname: string;
  firstname: string;
  othernames?: string;
  relationship: string;
  phone: string;
  email?: string;
  address: string;
  occupation: string;
  paymentResponsibility: boolean;
}

export const SponsorSchema = BaseEntitySchema.extend({
  candidateId: z.string().uuid(),
  surname: z.string().min(1).max(100),
  firstname: z.string().min(1).max(100),
  othernames: z.string().max(100).optional(),
  relationship: z.string().min(1).max(100),
  phone: z.string().max(32),
  email: z.string().email().max(160).optional(),
  address: z.string().min(1).max(500),
  occupation: z.string().min(1).max(100),
  paymentResponsibility: z.boolean(),
});

// Upload types removed - documents module no longer exists

// ============================================
// Profile Completion Status Types
// ============================================

export interface ProfileCompletionStatus {
  biodata: boolean;
  education: boolean;
  nextOfKin: boolean;
  sponsor: boolean;
  application: boolean;
  payment: boolean;
  overall: number; // Percentage 0-100
}

export const ProfileCompletionStatusSchema = z.object({
  biodata: z.boolean(),
  education: z.boolean(),
  nextOfKin: z.boolean(),
  sponsor: z.boolean(),
  application: z.boolean(),
  payment: z.boolean(),
  overall: z.number().min(0).max(100),
});

// ============================================
// Next Step Information Types
// ============================================

export interface NextStepInfo {
  nextStep: string;
  completedSteps: string[];
  remainingSteps: string[];
  candidateType: 'UTME' | 'DE';
  progress: number; // Percentage 0-100
}

export const NextStepInfoSchema = z.object({
  nextStep: z.string(),
  completedSteps: z.array(z.string()),
  remainingSteps: z.array(z.string()),
  candidateType: z.enum(['UTME', 'DE']),
  progress: z.number().min(0).max(100),
});

// ============================================
// Request/Response Types
// ============================================

// Candidate Profile Update Request
export interface CandidateProfileUpdateRequest {
  firstname?: string;
  surname?: string;
  othernames?: string;
  gender?: 'male' | 'female' | 'other';
  dob?: string; // YYYY-MM-DD format
  nationality?: string;
  state?: string;
  lga?: string;
  address?: string;
  email?: string;
  phone?: string;
  department?: string;
  departmentId?: string;
  modeOfEntry?: 'UTME' | 'DE';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  passportPhotoUrl?: string;
  signatureUrl?: string;
}

export const CandidateProfileUpdateRequestSchema = z.object({
  firstname: z.string().min(1).max(100).optional(),
  surname: z.string().min(1).max(100).optional(),
  othernames: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  nationality: z.string().max(64).optional(),
  state: z.string().max(64).optional(),
  lga: z.string().max(64).optional(),
  address: z.string().max(500).optional(),
  email: z.string().email().max(160).optional(),
  phone: z.string().max(32).optional(),
  passportPhotoUrl: z.string().max(255).optional(),
  signatureUrl: z.string().max(255).optional(),
  department: z.string().max(100).optional(),
  departmentId: z.string().uuid().optional(),
  modeOfEntry: z.enum(['UTME', 'DE']).optional(),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  // Document upload fields removed
});

// Application Create Request
export interface ApplicationCreateRequest {
  session: string;
  department?: string;
}

export const ApplicationCreateRequestSchema = z.object({
  session: z.string().regex(/^\d{4}\/\d{4}$/),
  department: z.string().max(100).optional(),
});

// Application Status Update Request
export interface ApplicationStatusUpdateRequest {
  status: 'pending' | 'admitted' | 'rejected';
  submittedAt?: string; // ISO date string
}

export const ApplicationStatusUpdateRequestSchema = z.object({
  status: z.enum(['pending', 'admitted', 'rejected']),
  submittedAt: z.string().datetime().optional(),
});

// ============================================
// Response Types
// ============================================

export interface CandidateProfileUpdateResponse extends ApiResponse<Candidate> {
  message: string;
}

export const CandidateProfileUpdateResponseSchema = z.object({
  success: z.boolean(),
  data: CandidateSchema,
  message: z.string(),
  timestamp: z.date(),
});

export interface ApplicationCreateResponse extends ApiResponse<Application> {
  message: string;
}

export const ApplicationCreateResponseSchema = z.object({
  success: z.boolean(),
  data: ApplicationSchema,
  message: z.string(),
  timestamp: z.date(),
});

export interface ApplicationStatusUpdateResponse extends ApiResponse<Application> {
  message: string;
}

export const ApplicationStatusUpdateResponseSchema = z.object({
  success: z.boolean(),
  data: ApplicationSchema,
  message: z.string(),
  timestamp: z.date(),
});
