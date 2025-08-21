import { z } from 'zod';

import { ApiResponse, BaseEntity, BaseEntitySchema } from './common';

// Payment provider types
export type PaymentProvider = 'remita' | 'flutterwave' | 'paystack';

export const PaymentProviderSchema = z.enum(['remita', 'flutterwave', 'paystack']);

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

// Payment types (these are the same as payment purposes for clarity)
export type PaymentType = 'post_utme' | 'acceptance' | 'school_fee' | 'other';

export const PaymentTypeSchema = z.enum(['post_utme', 'acceptance', 'school_fee', 'other']);

// Payment purpose types (equals payment types for database schema alignment)
// Note: paymentPurpose equals payment types for clarity
export type PaymentPurpose = 'post_utme' | 'acceptance' | 'school_fee';

export const PaymentPurposeSchema = z.enum(['post_utme', 'acceptance', 'school_fee']);

// Enhanced Payment Transaction interface for Phase 7
export interface PaymentTransaction extends BaseEntity {
  candidateId: string;
  purpose: PaymentPurpose;
  provider?: string;
  providerRef?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  // Payment level and session for admin management
  paymentLevel?: string; // e.g., '100', '200', '100L', etc.
  session: string; // e.g., '2024/2025'
  idempotencyKey?: string; // Will be removed in future durable implementation
  requestHash?: string; // Will be removed in future durable implementation
  responseSnapshot?: any;
  statusCode?: number;
  firstRequestAt?: Date;
  lastRequestAt?: Date;
  replayCount?: number;
  externalReference?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
  rawPayload?: any;
  receiptUrl?: string;
  webhookReceivedAt?: Date;
  verifiedAt?: Date;
}

export const PaymentTransactionSchema = BaseEntitySchema.extend({
  candidateId: z.string().uuid(),
  purpose: PaymentPurposeSchema,
  provider: z.string().optional(),
  providerRef: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  status: PaymentStatusSchema,
  // Payment level and session for admin management
  paymentLevel: z.string().max(16).optional(), // e.g., '100', '200', '100L', etc.
  session: z.string().max(16), // e.g., '2024/2025'
  idempotencyKey: z.string().max(128).optional(), // Will be removed in future durable implementation
  requestHash: z.string().max(128).optional(), // Will be removed in future durable implementation
  responseSnapshot: z.any().optional(),
  statusCode: z.number().optional(),
  firstRequestAt: z.date().optional(),
  lastRequestAt: z.date().optional(),
  replayCount: z.number().optional(),
  externalReference: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.date().optional(),
  rawPayload: z.any().optional(),
  receiptUrl: z.string().optional(),
  webhookReceivedAt: z.date().optional(),
  verifiedAt: z.date().optional(),
});

// Payment Type Configuration (for admin management)
export interface PaymentTypeConfig extends BaseEntity {
  name: string; // e.g., 'Post-UTME Application Fee'
  code: PaymentPurpose; // equals payment purpose for clarity
  description?: string;
  amount: number;
  currency: string;
  isActive: boolean;
  session: string; // e.g., '2024/2025'
  dueDate?: Date;
  createdBy?: string; // admin user ID
}

export const PaymentTypeConfigSchema = BaseEntitySchema.extend({
  name: z.string().max(100),
  code: PaymentPurposeSchema,
  description: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  isActive: z.boolean(),
  session: z.string().max(16),
  dueDate: z.date().optional(),
  createdBy: z.string().uuid().optional(),
});

// Payment Event for audit trail
export interface PaymentEvent extends BaseEntity {
  paymentId: string;
  eventType: string;
  fromStatus?: PaymentStatus;
  toStatus?: PaymentStatus;
  providerEventId?: string;
  signatureHash?: string;
  providerData?: any;
  metadata?: Record<string, any>;
}

export const PaymentEventSchema = BaseEntitySchema.extend({
  paymentId: z.string().uuid(),
  eventType: z.string().max(100),
  fromStatus: PaymentStatusSchema.optional(),
  toStatus: PaymentStatusSchema.optional(),
  providerEventId: z.string().max(128).optional(),
  signatureHash: z.string().max(128).optional(),
  providerData: z.any().optional(),
  metadata: z.record(z.any()).optional(),
});

// Payment initiation request (for API compatibility)
export interface PaymentInitiationRequest {
  purpose: PaymentPurpose;
  amount: number;
  currency?: string;
  session: string;
  email?: string;
  phone?: string;
  preferredProvider?: string;
}

export const PaymentInitiationRequestSchema = z.object({
  purpose: PaymentPurposeSchema,
  amount: z.number().positive(),
  currency: z.string().optional(),
  session: z.string().regex(/^\d{4}\/\d{4}$/),
  email: z.string().email().optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  preferredProvider: z.string().optional(),
});

// Simplified PaymentTransaction interface for backward compatibility
export interface SimplePaymentTransaction extends BaseEntity {
  candidateId: string;
  purpose: PaymentPurpose;
  provider?: PaymentProvider;
  providerRef?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  idempotencyKey: string;
  rawPayload?: any;
}

export const SimplePaymentTransactionSchema = BaseEntitySchema.extend({
  candidateId: z.string().uuid(),
  purpose: PaymentPurposeSchema,
  provider: PaymentProviderSchema.optional(),
  providerRef: z.string().max(128).optional(),
  amount: z.number().positive(),
  currency: z.string().max(8).default('NGN'),
  status: PaymentStatusSchema,
  idempotencyKey: z.string().max(128),
  rawPayload: z.any().optional(),
});

// Enhanced Payment initiation response
export interface PaymentInitiationResponse extends ApiResponse<PaymentTransaction> {
  paymentUrl?: string; // Provider payment URL
  providerRef?: string; // Provider reference (RRR, etc.)
  expiresAt: string; // ISO date string
  redirectUrl?: string; // URL to redirect user for payment
  inlineParams?: Record<string, any>; // Parameters for inline payment forms
  clientPollUrl?: string; // URL for client to poll payment status
}

export const PaymentInitiationResponseSchema = z.object({
  success: z.boolean(),
  data: PaymentTransactionSchema,
  paymentUrl: z.string().url().optional(),
  providerRef: z.string().optional(),
  expiresAt: z.string().datetime(),
  redirectUrl: z.string().url().optional(),
  inlineParams: z.record(z.any()).optional(),
  clientPollUrl: z.string().url().optional(),
  timestamp: z.date(),
});

// Payment verification request
export interface PaymentVerificationRequest {
  transactionId: string;
  providerReference: string;
}

export const PaymentVerificationRequestSchema = z.object({
  transactionId: z.string().uuid(),
  providerReference: z.string().min(1).max(100),
});

// Payment verification response
export interface PaymentVerificationResponse {
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  providerReference: string;
  providerData: Record<string, any>;
  verifiedAt: Date;
}

export const PaymentVerificationResponseSchema = z.object({
  transactionId: z.string().uuid(),
  status: PaymentStatusSchema,
  amount: z.number().positive(),
  currency: z.string().length(3),
  providerReference: z.string().min(1).max(100),
  providerData: z.record(z.any()),
  verifiedAt: z.date(),
});

// Webhook payload types
export interface WebhookPayload {
  provider: PaymentProvider;
  signature: string;
  timestamp: string;
  data: Record<string, any>;
}

export const WebhookPayloadSchema = z.object({
  provider: PaymentProviderSchema,
  signature: z.string(),
  timestamp: z.string(),
  data: z.record(z.any()),
});

// Remita-specific types
export interface RemitaPaymentData {
  rrr: string;
  orderId: string;
  amount: number;
  status: string;
  transactionId: string;
  paymentDate: string;
  channel: string;
  bankCode?: string;
  bankName?: string;
}

export const RemitaPaymentDataSchema = z.object({
  rrr: z.string(),
  orderId: z.string(),
  amount: z.number().positive(),
  status: z.string(),
  transactionId: z.string(),
  paymentDate: z.string(),
  channel: z.string(),
  bankCode: z.string().optional(),
  bankName: z.string().optional(),
});

// Flutterwave-specific types
export interface FlutterwavePaymentData {
  tx_ref: string;
  flw_ref: string;
  amount: number;
  currency: string;
  status: string;
  payment_type: string;
  customer: {
    email: string;
    name: string;
    phone_number: string;
  };
  meta: Record<string, any>;
}

export const FlutterwavePaymentDataSchema = z.object({
  tx_ref: z.string(),
  flw_ref: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  status: z.string(),
  payment_type: z.string(),
  customer: z.object({
    email: z.string().email(),
    name: z.string(),
    phone_number: z.string(),
  }),
  meta: z.record(z.any()),
});

// Payment fees configuration
export interface PaymentFees {
  postUtme: number;
  acceptance: number;
  schoolFees: number;
  processingFee: number;
  processingFeePercentage: number;
}

export const PaymentFeesSchema = z.object({
  postUtme: z.number().positive(),
  acceptance: z.number().positive(),
  schoolFees: z.number().positive(),
  processingFee: z.number().min(0),
  processingFeePercentage: z.number().min(0).max(100),
});

// Payment reconciliation types
export interface PaymentReconciliation {
  transactionId: string;
  providerReference: string;
  expectedAmount: number;
  actualAmount: number;
  status: 'pending' | 'reconciled' | 'disputed' | 'failed';
  discrepancyAmount?: number;
  discrepancyReason?: string;
  reconciledAt?: Date;
  reconciledBy?: string;
  notes?: string;
}

export const PaymentReconciliationSchema = BaseEntitySchema.extend({
  transactionId: z.string().uuid(),
  providerReference: z.string().min(1).max(100),
  expectedAmount: z.number().positive(),
  actualAmount: z.number().positive(),
  status: z.enum(['pending', 'reconciled', 'disputed', 'failed']),
  discrepancyAmount: z.number().optional(),
  discrepancyReason: z.string().max(1000).optional(),
  reconciledAt: z.date().optional(),
  reconciledBy: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

// Payment Status Check
export interface PaymentStatusCheckRequest {
  paymentId: string;
}

export const PaymentStatusCheckRequestSchema = z.object({
  paymentId: z.string().uuid(),
});

export interface PaymentStatusCheckResponse extends ApiResponse<PaymentTransaction> {
  message: string;
}

export const PaymentStatusCheckResponseSchema = z.object({
  success: z.boolean(),
  data: PaymentTransactionSchema,
  message: z.string(),
  timestamp: z.date(),
});

// Payment Receipt
export interface PaymentReceipt {
  id: string;
  paymentId: string;
  serial: string;
  qrToken: string;
  pdfUrl: string;
  contentHash: string;
  createdAt: Date;
}

export const PaymentReceiptSchema = BaseEntitySchema.extend({
  paymentId: z.string().uuid(),
  serial: z.string().max(32),
  qrToken: z.string().max(64),
  pdfUrl: z.string().url(),
  contentHash: z.string().max(64),
});

// Payment Receipt Response
export interface PaymentReceiptResponse extends ApiResponse<PaymentReceipt> {
  downloadUrl: string;
  verificationUrl: string;
}

export const PaymentReceiptResponseSchema = z.object({
  success: z.boolean(),
  data: PaymentReceiptSchema,
  downloadUrl: z.string().url(),
  verificationUrl: z.string().url(),
  timestamp: z.date(),
});
