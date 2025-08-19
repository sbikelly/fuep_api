import { z } from 'zod';

import { ApiResponse, BaseEntity, BaseEntitySchema } from './common';

// Simplified Application interface for Phase 6 (matches database schema)
export interface SimpleApplication extends BaseEntity {
  candidateId: string;
  session: string;
  programmeCode?: string;
  departmentCode?: string;
  status: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt?: Date;
}

export const SimpleApplicationSchema = BaseEntitySchema.extend({
  candidateId: z.string().uuid(),
  session: z.string().regex(/^\d{4}\/\d{4}$/),
  programmeCode: z.string().max(32).optional(),
  departmentCode: z.string().max(32).optional(),
  status: z.enum(['pending', 'submitted', 'under_review', 'approved', 'rejected']),
  submittedAt: z.date().optional(),
});

// Simplified Profile interface for Phase 6 (matches database schema)
export interface SimpleProfile extends BaseEntity {
  candidateId: string;
  surname?: string;
  firstname?: string;
  othernames?: string;
  gender?: string;
  dob?: Date;
  address?: string;
  state?: string;
  lga?: string;
  city?: string;
  nationality?: string;
  maritalStatus?: string;
}

export const SimpleProfileSchema = BaseEntitySchema.extend({
  candidateId: z.string().uuid(),
  surname: z.string().max(100).optional(),
  firstname: z.string().max(100).optional(),
  othernames: z.string().max(100).optional(),
  gender: z.string().max(10).optional(),
  dob: z.date().optional(),
  address: z.string().max(500).optional(),
  state: z.string().max(64).optional(),
  lga: z.string().max(64).optional(),
  city: z.string().max(64).optional(),
  nationality: z.string().max(64).optional(),
  maritalStatus: z.string().max(32).optional(),
});

// Candidate profile types
export interface Candidate extends BaseEntity {
  userId: string;
  jambRegNo: string;
  surname: string;
  firstname: string;
  othernames?: string;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  nationality: string;
  stateOfOrigin: string;
  lgaOfOrigin: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postalCode?: string;
  passportPhotoUrl?: string;
  signatureUrl?: string;
  profileComplete: boolean;
}

export const CandidateSchema = BaseEntitySchema.extend({
  userId: z.string().uuid(),
  jambRegNo: z.string().min(10).max(15),
  surname: z.string().min(1).max(100),
  firstname: z.string().min(1).max(100),
  othernames: z.string().max(100).optional(),
  dateOfBirth: z.date(),
  gender: z.enum(['male', 'female']),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
  nationality: z.string().min(1).max(100),
  stateOfOrigin: z.string().min(1).max(100),
  lgaOfOrigin: z.string().min(1).max(100),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  email: z.string().email(),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().max(20).optional(),
  passportPhotoUrl: z.string().url().optional(),
  signatureUrl: z.string().url().optional(),
  profileComplete: z.boolean(),
});

// Profile interface for database schema alignment
export interface Profile extends BaseEntity {
  candidateId: string;
  surname?: string;
  firstname?: string;
  othernames?: string;
  gender?: string;
  dob?: Date;
  address?: string;
  state?: string;
  lga?: string;
  city?: string;
  nationality?: string;
  maritalStatus?: string;
}

export const ProfileSchema = BaseEntitySchema.extend({
  candidateId: z.string().uuid(),
  surname: z.string().max(100).optional(),
  firstname: z.string().max(100).optional(),
  othernames: z.string().max(100).optional(),
  gender: z.string().max(10).optional(),
  dob: z.date().optional(),
  address: z.string().max(500).optional(),
  state: z.string().max(64).optional(),
  lga: z.string().max(64).optional(),
  city: z.string().max(64).optional(),
  nationality: z.string().max(64).optional(),
  maritalStatus: z.string().max(32).optional(),
});

// Next of Kin types
export interface NextOfKin extends BaseEntity {
  candidateId: string;
  surname: string;
  firstname: string;
  othernames?: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  occupation: string;
  isEmergencyContact: boolean;
}

export const NextOfKinSchema = BaseEntitySchema.extend({
  candidateId: z.string().uuid(),
  surname: z.string().min(1).max(100),
  firstname: z.string().min(1).max(100),
  othernames: z.string().max(100).optional(),
  relationship: z.string().min(1).max(100),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  email: z.string().email().optional(),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  occupation: z.string().min(1).max(100),
  isEmergencyContact: z.boolean(),
});

// Sponsor types
export interface Sponsor extends BaseEntity {
  candidateId: string;
  surname: string;
  firstname: string;
  othernames?: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  occupation: string;
  employer?: string;
  annualIncome?: number;
  canSponsor: boolean;
}

export const SponsorSchema = BaseEntitySchema.extend({
  candidateId: z.string().uuid(),
  surname: z.string().min(1).max(100),
  firstname: z.string().min(1).max(100),
  othernames: z.string().max(100).optional(),
  relationship: z.string().min(1).max(100),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  email: z.string().email().optional(),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  occupation: z.string().min(1).max(100),
  employer: z.string().max(200).optional(),
  annualIncome: z.number().positive().optional(),
  canSponsor: z.boolean(),
});

// Education types
export interface Education extends BaseEntity {
  candidateId: string;
  institutionName: string;
  qualification: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date;
  isCompleted: boolean;
  grade?: string;
  cgpa?: number;
  maxCgpa?: number;
  certificateUrl?: string;
  transcriptUrl?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationNotes?: string;
}

export const EducationSchema = BaseEntitySchema.extend({
  candidateId: z.string().uuid(),
  institutionName: z.string().min(1).max(200),
  qualification: z.string().min(1).max(100),
  fieldOfStudy: z.string().min(1).max(100),
  startDate: z.date(),
  endDate: z.date().optional(),
  isCompleted: z.boolean(),
  grade: z.string().max(10).optional(),
  cgpa: z.number().min(0).max(5).optional(),
  maxCgpa: z.number().min(0).max(5).optional(),
  certificateUrl: z.string().url().optional(),
  transcriptUrl: z.string().url().optional(),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']),
  verificationNotes: z.string().max(1000).optional(),
});

// Application types
export interface Application extends BaseEntity {
  candidateId: string;
  applicationNumber: string;
  session: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentReference?: string;
  totalAmount: number;
  amountPaid: number;
  formPrinted: boolean;
  printedAt?: Date;
}

export const ApplicationSchema = BaseEntitySchema.extend({
  candidateId: z.string().uuid(),
  applicationNumber: z.string().min(1).max(50),
  session: z.string().regex(/^\d{4}\/\d{4}$/),
  status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'rejected']),
  submittedAt: z.date().optional(),
  reviewedAt: z.date().optional(),
  reviewedBy: z.string().uuid().optional(),
  reviewNotes: z.string().max(1000).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']),
  paymentReference: z.string().max(100).optional(),
  totalAmount: z.number().positive(),
  amountPaid: z.number().min(0),
  formPrinted: z.boolean(),
  printedAt: z.date().optional(),
});

// Candidate profile update request
export interface CandidateProfileUpdateRequest {
  surname?: string;
  firstname?: string;
  othernames?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  nationality?: string;
  stateOfOrigin?: string;
  lgaOfOrigin?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export const CandidateProfileUpdateRequestSchema = CandidateSchema.partial().pick({
  surname: true,
  firstname: true,
  othernames: true,
  dateOfBirth: true,
  gender: true,
  maritalStatus: true,
  nationality: true,
  stateOfOrigin: true,
  lgaOfOrigin: true,
  phoneNumber: true,
  email: true,
  address: true,
  city: true,
  state: true,
  postalCode: true,
});

// Profile completion status
export interface ProfileCompletionStatus {
  candidate: boolean;
  nextOfKin: boolean;
  sponsor: boolean;
  education: boolean;
  documents: boolean;
  overall: number; // percentage 0-100
}

export const ProfileCompletionStatusSchema = z.object({
  candidate: z.boolean(),
  nextOfKin: z.boolean(),
  sponsor: z.boolean(),
  education: z.boolean(),
  documents: z.boolean(),
  overall: z.number().min(0).max(100),
});

// Profile Update Request
export interface ProfileUpdateRequest {
  surname?: string;
  firstname?: string;
  othernames?: string;
  gender?: string;
  dob?: string; // ISO date string
  address?: string;
  state?: string;
  lga?: string;
  city?: string;
  nationality?: string;
  maritalStatus?: string;
}

export const ProfileUpdateRequestSchema = z.object({
  surname: z.string().min(1).max(100).optional(),
  firstname: z.string().min(1).max(100).optional(),
  othernames: z.string().max(100).optional(),
  gender: z.string().max(10).optional(),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // YYYY-MM-DD format
  address: z.string().max(500).optional(),
  state: z.string().max(64).optional(),
  lga: z.string().max(64).optional(),
  city: z.string().max(64).optional(),
  nationality: z.string().max(64).optional(),
  maritalStatus: z.string().max(32).optional(),
});

// Profile Update Response
export interface ProfileUpdateResponse extends ApiResponse<SimpleProfile> {
  message: string;
}

export const ProfileUpdateResponseSchema = z.object({
  success: z.boolean(),
  data: SimpleProfileSchema,
  message: z.string(),
  timestamp: z.date(),
});

// Application Lifecycle
export interface ApplicationCreateRequest {
  session: string;
  programmeCode?: string;
  departmentCode?: string;
}

export const ApplicationCreateRequestSchema = z.object({
  session: z.string().regex(/^\d{4}\/\d{4}$/),
  programmeCode: z.string().max(32).optional(),
  departmentCode: z.string().max(32).optional(),
});

export interface ApplicationCreateResponse extends ApiResponse<SimpleApplication> {
  message: string;
}

export const ApplicationCreateResponseSchema = z.object({
  success: z.boolean(),
  data: SimpleApplicationSchema,
  message: z.string(),
  timestamp: z.date(),
});

// Application Status Update
export interface ApplicationStatusUpdateRequest {
  status: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt?: string; // ISO date string
}

export const ApplicationStatusUpdateRequestSchema = z.object({
  status: z.enum(['pending', 'submitted', 'under_review', 'approved', 'rejected']),
  submittedAt: z.string().datetime().optional(),
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
