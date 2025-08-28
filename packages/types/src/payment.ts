import { z } from 'zod';

import { ApiResponse, BaseEntity, BaseEntitySchema } from './common';

// Payment provider types - simplified to just Remita
export type PaymentProvider = 'remita';

export const PaymentProviderSchema = z.enum(['remita']);

// Payment status types (aligned with database schema)
export type PaymentStatus =
  | 'initiated'
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'disputed'
  | 'refunded';

export const PaymentStatusSchema = z.enum([
  'initiated',
  'pending',
  'processing',
  'success',
  'failed',
  'cancelled',
  'disputed',
  'refunded',
]);

// Payment purpose types (these are the payment purposes for clarity)
export type PaymentPurpose =
  | 'POST_UTME'
  | 'ACCEPTANCE'
  | 'SCHOOL_FEES'
  | 'LIBRARY_FEE'
  | 'HOSTEL_FEE'
  | 'MEDICAL_FEE'
  | 'SPORTS_FEE'
  | 'other';

export const PaymentPurposeSchema = z.enum([
  'POST_UTME',
  'ACCEPTANCE',
  'SCHOOL_FEES',
  'LIBRARY_FEE',
  'HOSTEL_FEE',
  'MEDICAL_FEE',
  'SPORTS_FEE',
  'other',
]);

// Simplified Payment Transaction interface
export interface PaymentTransaction extends BaseEntity {
  candidateId: string;
  rrr: string; // Remita Retrieval Reference
  purpose: PaymentPurpose;
  amount: number;
  session: string;
  status: PaymentStatus;
  paymentLevel?: string; // e.g., '100', '200', '100L', etc.
  paymentUrl?: string;
  expiresAt?: Date;
  webhookReceivedAt?: Date;
  verifiedAt?: Date;
}

export const PaymentTransactionSchema = BaseEntitySchema.extend({
  candidateId: z.string().uuid(),
  rrr: z.string().min(1).max(50),
  purpose: PaymentPurposeSchema,
  amount: z.number().positive(),
  session: z.string().max(16),
  status: PaymentStatusSchema,
  paymentLevel: z.string().max(16).optional(),
  paymentUrl: z.string().url().optional(),
  expiresAt: z.date().optional(),
  webhookReceivedAt: z.date().optional(),
  verifiedAt: z.date().optional(),
});

// Payment purpose configuration - simplified structure
export interface PaymentPurposeConfig extends BaseEntity {
  name: string;
  purpose: PaymentPurpose;
  description?: string;
  amount: number;
  isActive: boolean;
  session: string;
  level: string;
  createdBy?: string;
}

export const PaymentPurposeConfigSchema = BaseEntitySchema.extend({
  name: z.string().max(100),
  purpose: PaymentPurposeSchema,
  description: z.string().optional(),
  amount: z.number().positive(),
  isActive: z.boolean(),
  session: z.string().max(16),
  level: z.string().max(10),
  createdBy: z.string().uuid().optional(),
});

// Payment initiation request
export interface PaymentInitiationRequest {
  candidateId: string;
  purpose: PaymentPurpose;
  amount: number;
  session: string;
  email: string;
  phone: string;
}

export const PaymentInitiationRequestSchema = z.object({
  candidateId: z.string().uuid(),
  purpose: PaymentPurposeSchema,
  amount: z.number().positive(),
  session: z.string().max(16),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
});

// Payment initiation response
export interface PaymentInitiationResponse {
  success: boolean;
  rrr: string;
  paymentUrl: string;
  expiresAt: Date;
  paymentId: string;
}

export const PaymentInitiationResponseSchema = z.object({
  success: z.boolean(),
  rrr: z.string(),
  paymentUrl: z.string().url(),
  expiresAt: z.date(),
  paymentId: z.string().uuid(),
});

// Payment status check request
export interface PaymentStatusCheckRequest {
  rrr: string;
}

export const PaymentStatusCheckRequestSchema = z.object({
  rrr: z.string().min(1).max(50),
});

// Payment status check response
export interface PaymentStatusCheckResponse {
  success: boolean;
  rrr: string;
  status: PaymentStatus;
  amount: number;
  purpose: PaymentPurpose;
  session: string;
  candidateId: string;
  verifiedAt?: Date;
}

export const PaymentStatusCheckResponseSchema = z.object({
  success: z.boolean(),
  rrr: z.string(),
  status: PaymentStatusSchema,
  amount: z.number().positive(),
  purpose: PaymentPurposeSchema,
  session: z.string(),
  candidateId: z.string().uuid(),
  verifiedAt: z.date().optional(),
});

// Payment receipt response
export interface PaymentReceiptResponse {
  success: boolean;
  rrr: string;
  amount: number;
  purpose: PaymentPurpose;
  session: string;
  candidateId: string;
  status: PaymentStatus;
  paidAt?: Date;
  receiptUrl?: string;
}

export const PaymentReceiptResponseSchema = z.object({
  success: z.boolean(),
  rrr: z.string(),
  amount: z.number().positive(),
  purpose: PaymentPurposeSchema,
  session: z.string(),
  candidateId: z.string().uuid(),
  status: PaymentStatusSchema,
  paidAt: z.date().optional(),
  receiptUrl: z.string().url().optional(),
});

// Payment statistics
export interface PaymentStatistics {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  averageAmount: number;
}

export const PaymentStatisticsSchema = z.object({
  totalPayments: z.number(),
  totalAmount: z.number(),
  successfulPayments: z.number(),
  pendingPayments: z.number(),
  failedPayments: z.number(),
  averageAmount: z.number(),
});

// Payment history response
export interface PaymentHistoryResponse {
  success: boolean;
  data: PaymentTransaction[];
  total: number;
  page: number;
  limit: number;
}

export const PaymentHistoryResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(PaymentTransactionSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

// Webhook payload from Remita
export interface RemitaWebhookPayload {
  rrr: string;
  status: string;
  amount: string;
  transactionId: string;
  orderId: string;
  message: string;
  timestamp: string;
}

export const RemitaWebhookPayloadSchema = z.object({
  rrr: z.string(),
  status: z.string(),
  amount: z.string(),
  transactionId: z.string(),
  orderId: z.string(),
  message: z.string(),
  timestamp: z.string(),
});

// Export all schemas
export const PaymentSchemas = {
  PaymentTransactionSchema,
  PaymentPurposeConfigSchema,
  PaymentInitiationRequestSchema,
  PaymentInitiationResponseSchema,
  PaymentStatusCheckRequestSchema,
  PaymentStatusCheckResponseSchema,
  PaymentReceiptResponseSchema,
  PaymentStatisticsSchema,
  PaymentHistoryResponseSchema,
  RemitaWebhookPayloadSchema,
} as const;
