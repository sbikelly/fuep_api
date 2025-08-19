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

// Payment types
export type PaymentType = 'post_utme' | 'acceptance' | 'school_fees' | 'other';

export const PaymentTypeSchema = z.enum(['post_utme', 'acceptance', 'school_fees', 'other']);

// Payment purpose types (for database schema alignment)
export type PaymentPurpose = 'post_utme' | 'acceptance' | 'school_fee';

export const PaymentPurposeSchema = z.enum(['post_utme', 'acceptance', 'school_fee']);

// Enhanced Payment Transaction interface for Phase 7
export interface PaymentTransaction extends BaseEntity {
  candidateId: string;
  purpose: PaymentPurpose;
  provider?: PaymentProvider;
  providerRef?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  idempotencyKey: string;
  requestHash: string;
  responseSnapshot?: any;
  statusCode: number;
  firstRequestAt: Date;
  lastRequestAt: Date;
  replayCount: number;
  externalReference?: string;
  metadata?: Record<string, any>;
  webhookReceivedAt?: Date;
  verifiedAt?: Date;
  receiptUrl?: string;
  expiresAt?: Date;
  rawPayload?: any;
}

export const PaymentTransactionSchema = BaseEntitySchema.extend({
  candidateId: z.string().uuid(),
  purpose: PaymentPurposeSchema,
  provider: PaymentProviderSchema.optional(),
  providerRef: z.string().max(128).optional(),
  amount: z.number().positive(),
  currency: z.string().max(8).default('NGN'),
  status: PaymentStatusSchema,
  idempotencyKey: z.string().max(128),
  requestHash: z.string().length(64),
  responseSnapshot: z.any().optional(),
  statusCode: z.number().int().min(100).max(599),
  firstRequestAt: z.date(),
  lastRequestAt: z.date(),
  replayCount: z.number().int().min(1),
  externalReference: z.string().max(128).optional(),
  metadata: z.record(z.any()).optional(),
  webhookReceivedAt: z.date().optional(),
  verifiedAt: z.date().optional(),
  receiptUrl: z.string().url().optional(),
  expiresAt: z.date().optional(),
  rawPayload: z.any().optional(),
});

// Payment Event for audit trail
export interface PaymentEvent extends BaseEntity {
  paymentId: string;
  eventType: string;
  fromStatus?: PaymentStatus;
  toStatus?: PaymentStatus;
  providerEventId?: string;
  signatureHash?: string;
  providerData?: Record<string, any>;
  metadata?: Record<string, any>;
}

export const PaymentEventSchema = BaseEntitySchema.extend({
  paymentId: z.string().uuid(),
  eventType: z.string().max(64),
  fromStatus: PaymentStatusSchema.optional(),
  toStatus: PaymentStatusSchema.optional(),
  providerEventId: z.string().max(128).optional(),
  signatureHash: z.string().length(64).optional(),
  providerData: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

// Payment initiation request (for API compatibility)
export interface PaymentInitiationRequest {
  purpose: PaymentPurpose;
  jambRegNo: string;
  amount: number;
  session: string;
  email?: string;
  phone?: string;
  idempotencyKey?: string; // Auto-generated if not provided
}

export const PaymentInitiationRequestSchema = z.object({
  purpose: PaymentPurposeSchema,
  jambRegNo: z.string().min(1).max(20),
  amount: z.number().positive().describe('Amount in NGN'),
  session: z.string().regex(/^\d{4}\/\d{4}$/),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  idempotencyKey: z.string().optional(),
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

// Idempotency Key Generation
export interface IdempotencyKeyData {
  candidateId: string;
  purpose: PaymentPurpose;
  session: string;
}

export const IdempotencyKeyDataSchema = z.object({
  candidateId: z.string().uuid(),
  purpose: PaymentPurposeSchema,
  session: z.string().regex(/^\d{4}\/\d{4}$/),
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
