import { z } from 'zod';

import { PaymentProvider, PaymentStatus, PaymentTransaction } from './payment';

// Base Payment Provider Interface
export interface IPaymentProvider {
  readonly provider: PaymentProvider;
  readonly isEnabled: boolean;

  // Initialize payment
  initializePayment(
    request: ProviderPaymentInitiationRequest
  ): Promise<ProviderPaymentGatewayResponse>;

  // Verify payment status
  verifyPayment(providerReference: string): Promise<ProviderPaymentVerificationResult>;

  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string, timestamp: string): boolean;

  // Process webhook
  processWebhook(payload: any): Promise<ProviderWebhookProcessingResult>;

  // Get payment status
  getPaymentStatus(providerReference: string): Promise<PaymentStatus>;
}

// Payment Initiation Request for Providers
export interface ProviderPaymentInitiationRequest {
  candidateId: string;
  purpose: string;
  amount: number;
  currency: string;
  session: string;
  email?: string;
  phone?: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
}

export const ProviderPaymentInitiationRequestSchema = z.object({
  candidateId: z.string().uuid(),
  purpose: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  session: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  idempotencyKey: z.string(),
  metadata: z.record(z.any()).optional(),
});

// Payment Gateway Response from Providers
export interface ProviderPaymentGatewayResponse {
  success: boolean;
  provider: PaymentProvider;
  providerReference: string;
  paymentUrl?: string;
  redirectUrl?: string;
  inlineParams?: Record<string, any>;
  expiresAt: Date;
  metadata: Record<string, any>;
}

export const ProviderPaymentGatewayResponseSchema = z.object({
  success: z.boolean(),
  provider: z.enum(['remita', 'flutterwave', 'paystack']),
  providerReference: z.string(),
  paymentUrl: z.string().url().optional(),
  redirectUrl: z.string().url().optional(),
  inlineParams: z.record(z.any()).optional(),
  expiresAt: z.date(),
  metadata: z.record(z.any()),
});

// Payment Verification Result from Providers
export interface ProviderPaymentVerificationResult {
  success: boolean;
  status: PaymentStatus;
  amount: number;
  currency: string;
  providerReference: string;
  providerData: Record<string, any>;
  verifiedAt: Date;
  error?: string;
}

export const ProviderPaymentVerificationResultSchema = z.object({
  success: z.boolean(),
  status: z.enum([
    'initiated',
    'pending',
    'processing',
    'success',
    'failed',
    'cancelled',
    'disputed',
    'refunded',
  ]),
  amount: z.number().positive(),
  currency: z.string().length(3),
  providerReference: z.string(),
  providerData: z.record(z.any()),
  verifiedAt: z.date(),
  error: z.string().optional(),
});

// Webhook Processing Result from Providers
export interface ProviderWebhookProcessingResult {
  success: boolean;
  paymentId?: string;
  status: PaymentStatus;
  providerReference: string;
  amount: number;
  currency: string;
  providerData: Record<string, any>;
  processedAt: Date;
  error?: string;
}

export const ProviderWebhookProcessingResultSchema = z.object({
  success: z.boolean(),
  paymentId: z.string().uuid().optional(),
  status: z.enum([
    'initiated',
    'pending',
    'processing',
    'success',
    'failed',
    'cancelled',
    'disputed',
    'refunded',
  ]),
  providerReference: z.string(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  providerData: z.record(z.any()),
  processedAt: z.date(),
  error: z.string().optional(),
});

// Provider Configuration
export interface ProviderConfiguration {
  provider: PaymentProvider;
  isEnabled: boolean;
  isPrimary: boolean;
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  baseUrl: string;
  sandboxMode: boolean;
  timeout?: number;
  retryAttempts?: number;
}

export const ProviderConfigurationSchema = z.object({
  provider: z.enum(['remita', 'flutterwave', 'paystack']),
  isEnabled: z.boolean(),
  isPrimary: z.boolean(),
  publicKey: z.string(),
  secretKey: z.string(),
  webhookSecret: z.string(),
  baseUrl: z.string().url(),
  sandboxMode: z.boolean(),
  timeout: z.number().positive().optional(),
  retryAttempts: z.number().min(0).max(5).optional(),
});

// Provider Factory
export interface IPaymentProviderFactory {
  createProvider(provider: PaymentProvider): IPaymentProvider;
  getPrimaryProvider(): IPaymentProvider;
  getAllProviders(): IPaymentProvider[];
}

// Payment Provider Registry
export interface IPaymentProviderRegistry {
  registerProvider(provider: IPaymentProvider): void;
  getProvider(provider: PaymentProvider): IPaymentProvider | null;
  getPrimaryProvider(): IPaymentProvider | null;
  getAllProviders(): IPaymentProvider[];
}
