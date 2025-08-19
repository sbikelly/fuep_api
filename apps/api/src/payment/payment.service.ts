import {
  IPaymentProvider,
  ProviderPaymentGatewayResponse,
  ProviderPaymentInitiationRequest,
} from '@fuep/types';
import { PaymentEvent, PaymentPurpose, PaymentStatus, PaymentTransaction } from '@fuep/types';
import { createHash, randomUUID } from 'crypto';

import { PaymentProviderRegistry } from './providers/provider-registry.js';

export class PaymentService {
  private providerRegistry: PaymentProviderRegistry;

  constructor(providerRegistry: PaymentProviderRegistry) {
    console.log('[PaymentService] Constructor called');
    this.providerRegistry = providerRegistry;
    console.log('[PaymentService] Initialized with provided registry');
  }

  async initializePayment(request: {
    candidateId: string;
    purpose: PaymentPurpose;
    amount: number;
    currency: string;
    session: string;
    email?: string;
    phone?: string;
    preferredProvider?: string;
  }): Promise<ProviderPaymentGatewayResponse> {
    try {
      console.log(
        `[PaymentService] Processing payment initiation for candidate: ${request.candidateId}`
      );

      // Select payment provider
      const provider = this.selectPaymentProvider(request.preferredProvider);
      if (!provider) {
        throw new Error('No payment providers available');
      }

      // Create provider request
      const providerRequest: ProviderPaymentInitiationRequest = {
        candidateId: request.candidateId,
        purpose: request.purpose,
        amount: request.amount,
        currency: request.currency,
        session: request.session,
        email: request.email,
        phone: request.phone,
        idempotencyKey: '', // Will be removed in future durable implementation
        metadata: {
          session: request.session,
          purpose: request.purpose,
        },
      };

      // Initialize payment with provider
      const providerResponse = await provider.initializePayment(providerRequest);

      // Create payment record in database
      const payment = await this.createPaymentRecord({
        candidateId: request.candidateId,
        purpose: request.purpose,
        provider: provider.provider,
        providerRef: providerResponse.providerReference,
        amount: request.amount,
        currency: request.currency,
        status: 'initiated' as PaymentStatus,
        idempotencyKey: '', // Will be removed in future durable implementation
        requestHash: '', // Will be removed in future durable implementation
        responseSnapshot: providerResponse,
        statusCode: 201,
        externalReference: providerResponse.providerReference,
        metadata: providerResponse.metadata,
        expiresAt: providerResponse.expiresAt,
        rawPayload: providerResponse,
      });

      // Create payment event
      await this.createPaymentEvent({
        paymentId: payment.id,
        eventType: 'initiated',
        toStatus: 'initiated',
        providerData: providerResponse.metadata,
        metadata: { provider: provider.provider },
      });

      return providerResponse;
    } catch (error) {
      console.error('Payment initialization failed:', error);
      throw new Error('Failed to initialize payment');
    }
  }

  async processWebhook(
    provider: string,
    payload: any,
    signature: string,
    timestamp: string
  ): Promise<void> {
    try {
      const paymentProvider = this.providerRegistry.getProvider(provider as any);
      if (!paymentProvider) {
        throw new Error(`Unknown payment provider: ${provider}`);
      }

      // Verify webhook signature
      if (!paymentProvider.verifyWebhookSignature(JSON.stringify(payload), signature, timestamp)) {
        throw new Error('Invalid webhook signature');
      }

      // Generate provider event ID for deduplication
      const providerEventId = this.generateProviderEventId(provider, payload);
      const signatureHash = createHash('sha256').update(signature).digest('hex');

      console.log(
        `[PaymentService] Processing webhook for provider: ${provider}, event ID: ${providerEventId}`
      );

      // Check if this webhook event has already been processed
      const existingEvent = await this.getPaymentEventByProviderEventId(providerEventId);
      if (existingEvent) {
        console.log(`[PaymentService] Webhook event already processed: ${providerEventId}`);
        return; // Idempotent - ignore duplicate
      }

      // Process webhook
      const result = await paymentProvider.processWebhook(payload);
      if (!result.success) {
        throw new Error(result.error || 'Webhook processing failed');
      }

      // Find payment by provider reference
      const payment = await this.getPaymentByProviderRef(result.providerReference);
      if (!payment) {
        throw new Error(`Payment not found for provider reference: ${result.providerReference}`);
      }

      // Update payment status
      await this.updatePaymentStatus(payment.id, result.status, {
        webhookReceivedAt: new Date(),
        verifiedAt: new Date(),
        metadata: result.providerData,
      });

      // Create payment event with deduplication fields
      await this.createPaymentEvent({
        paymentId: payment.id,
        eventType: 'webhook_received',
        fromStatus: payment.status,
        toStatus: result.status,
        providerEventId,
        signatureHash,
        providerData: result.providerData,
        metadata: {
          provider: provider,
          webhookTimestamp: timestamp,
        },
      });

      // If payment is successful, generate receipt
      if (result.status === 'success') {
        await this.generateReceipt(payment.id);
      }
    } catch (error) {
      console.error('Webhook processing failed:', error);
      throw error;
    }
  }

  async verifyPayment(paymentId: string): Promise<PaymentTransaction | null> {
    try {
      const payment = await this.getPaymentById(paymentId);
      if (!payment) {
        return null;
      }

      // Get provider
      const provider = this.providerRegistry.getProvider(payment.provider!);
      if (!provider) {
        throw new Error(`Payment provider not found: ${payment.provider}`);
      }

      // Verify with provider
      const verificationResult = await provider.verifyPayment(payment.providerRef!);

      // Update payment if status changed
      if (verificationResult.status !== payment.status) {
        await this.updatePaymentStatus(payment.id, verificationResult.status, {
          verifiedAt: new Date(),
          metadata: verificationResult.providerData,
        });

        // Create payment event
        await this.createPaymentEvent({
          paymentId: payment.id,
          eventType: 'status_changed',
          fromStatus: payment.status,
          toStatus: verificationResult.status,
          providerData: verificationResult.providerData,
          metadata: { verificationMethod: 'manual' },
        });
      }

      return await this.getPaymentById(paymentId);
    } catch (error) {
      console.error('Payment verification failed:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentTransaction | null> {
    return await this.getPaymentById(paymentId);
  }

  async generateReceipt(paymentId: string): Promise<string> {
    try {
      const payment = await this.getPaymentById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'success') {
        throw new Error('Payment must be successful to generate receipt');
      }

      // Generate receipt (this would create a PDF in a real implementation)
      const receiptUrl = `/receipts/${paymentId}.pdf`;

      // Update payment with receipt URL
      await this.updatePaymentReceipt(paymentId, receiptUrl);

      return receiptUrl;
    } catch (error) {
      console.error('Receipt generation failed:', error);
      throw error;
    }
  }

  private selectPaymentProvider(preferredProvider?: string): IPaymentProvider | null {
    if (preferredProvider) {
      const provider = this.providerRegistry.getProvider(preferredProvider as any);
      if (provider && provider.isEnabled) {
        return provider;
      }
    }

    // Fallback to primary provider
    return this.providerRegistry.getPrimaryProvider();
  }

  // Database operations (these would be implemented with actual database calls)
  private async getPaymentByProviderRef(providerRef: string): Promise<PaymentTransaction | null> {
    // TODO: Implement database query
    return null;
  }

  private async getPaymentById(paymentId: string): Promise<PaymentTransaction | null> {
    // TODO: Implement database query
    return null;
  }

  private async createPaymentRecord(data: any): Promise<PaymentTransaction> {
    // TODO: Implement database insert
    const payment = {
      id: randomUUID(),
      candidateId: data.candidateId,
      purpose: data.purpose,
      provider: data.provider,
      providerRef: data.providerRef,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      idempotencyKey: data.idempotencyKey,
      requestHash: data.requestHash,
      responseSnapshot: data.responseSnapshot,
      statusCode: data.statusCode || 201,
      firstRequestAt: new Date(),
      lastRequestAt: new Date(),
      replayCount: 1,
      externalReference: data.externalReference,
      metadata: data.metadata,
      expiresAt: data.expiresAt,
      rawPayload: data.rawPayload,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PaymentTransaction;

    return payment;
  }

  private async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    data: any
  ): Promise<void> {
    // TODO: Implement database update
    console.log(`Updating payment ${paymentId} status to ${status}`);
  }

  private async updatePaymentReceipt(paymentId: string, receiptUrl: string): Promise<void> {
    // TODO: Implement database update
    console.log(`Updating payment ${paymentId} receipt URL to ${receiptUrl}`);
  }

  private generateProviderEventId(provider: string, payload: any): string {
    // Generate a unique event ID based on provider and payload
    const base = `${provider}_${JSON.stringify(payload)}`;
    return createHash('sha256').update(base).digest('hex');
  }

  private async getPaymentEventByProviderEventId(providerEventId: string): Promise<any> {
    // TODO: Implement database query for provider event deduplication
    return null; // For now, return null to simulate no existing event
  }

  private async createPaymentEvent(data: any): Promise<void> {
    // TODO: Implement database insert
    console.log(`Creating payment event: ${data.eventType}`);
  }

  // Health check method
  getProviderStatus(): Record<string, { enabled: boolean; isPrimary: boolean }> {
    return this.providerRegistry.getProviderStatus();
  }
}
