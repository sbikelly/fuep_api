import {
  IPaymentProvider,
  ProviderPaymentGatewayResponse,
  ProviderPaymentInitiationRequest,
} from '@fuep/types';
import {
  PaymentEvent,
  PaymentProvider,
  PaymentPurpose,
  PaymentStatus,
  PaymentTransaction,
} from '@fuep/types';
import { createHash, randomUUID } from 'crypto';

import { PaymentProviderRegistry } from './providers/provider-registry.js';
// TODO: Import database connection when implementing actual database operations
// import { db } from '../db/knex.js';

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
    paymentLevel?: string; // e.g., '100', '200', '100L', etc.
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

      // Validate payment amount against configured payment types
      const paymentTypes = await this.getPaymentTypes(request.session);
      const configuredPaymentType = paymentTypes.find((pt) => pt.code === request.purpose);

      if (!configuredPaymentType) {
        throw new Error(
          `Payment type '${request.purpose}' not configured for session '${request.session}'`
        );
      }

      if (request.amount !== configuredPaymentType.amount) {
        throw new Error(
          `Invalid amount. Expected ${configuredPaymentType.amount} for ${request.purpose}, got ${request.amount}`
        );
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
        metadata: {
          session: request.session,
          purpose: request.purpose,
          configuredAmount: configuredPaymentType.amount,
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
        paymentLevel: request.paymentLevel, // Include payment level
        session: request.session, // Include session
        requestHash: '', // Will be removed in future durable implementation
        responseSnapshot: providerResponse,
        statusCode: 201,
        externalReference: providerResponse.providerReference,
        metadata: providerResponse.metadata,
        expiresAt: providerResponse.expiresAt,
        rawPayload: providerResponse,
      });

      // Store payment ID for later use
      const paymentId = payment.id;

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
      const provider = this.providerRegistry.getProvider(payment.provider as PaymentProvider);
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
    try {
      // TODO: Implement actual database query using Knex
      // For now, return null to simulate no payment found
      return null;
    } catch (error) {
      console.error('Error getting payment by provider reference:', error);
      throw error;
    }
  }

  private async getPaymentById(paymentId: string): Promise<PaymentTransaction | null> {
    try {
      // TODO: Implement actual database query using Knex
      // For now, return null to simulate no payment found
      return null;
    } catch (error) {
      console.error('Error getting payment by ID:', error);
      throw error;
    }
  }

  private async createPaymentRecord(data: any): Promise<PaymentTransaction> {
    try {
      // TODO: Implement actual database insert using Knex
      // For now, create a mock payment record
      const payment = {
        id: randomUUID(),
        candidateId: data.candidateId,
        purpose: data.purpose,
        provider: data.provider,
        providerRef: data.providerRef,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        paymentLevel: data.paymentLevel, // Include payment level
        session: data.session, // Include session
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

      // TODO: Insert into database
      // const [insertedPayment] = await db('payments').insert(payment).returning('*');
      // return insertedPayment;

      return payment;
    } catch (error) {
      console.error('Error creating payment record:', error);
      throw error;
    }
  }

  private async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    data: any
  ): Promise<void> {
    try {
      // TODO: Implement actual database update using Knex
      // For now, just log the update
      console.log(`Updating payment ${paymentId} status to ${status}`);

      // TODO: Update payment in database
      // await db('payments')
      //   .where({ id: paymentId })
      //   .update({
      //     status,
      //     updated_at: new Date(),
      //     ...data
      //   });
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  private async updatePaymentReceipt(paymentId: string, receiptUrl: string): Promise<void> {
    try {
      // TODO: Implement actual database update using Knex
      // For now, just log the update
      console.log(`Updating payment ${paymentId} receipt URL to ${receiptUrl}`);

      // TODO: Update payment receipt URL in database
      // await db('payments')
      //   .where({ id: paymentId })
      //   .update({
      //     receipt_url: receiptUrl,
      //     updated_at: new Date()
      //   });
    } catch (error) {
      console.error('Error updating payment receipt:', error);
      throw error;
    }
  }

  private generateProviderEventId(provider: string, payload: any): string {
    // Generate a unique event ID based on provider and payload
    const base = `${provider}_${JSON.stringify(payload)}`;
    return createHash('sha256').update(base).digest('hex');
  }

  private async getPaymentEventByProviderEventId(providerEventId: string): Promise<any> {
    try {
      // TODO: Implement actual database query for provider event deduplication
      // For now, return null to simulate no existing event

      // TODO: Query payment_events table
      // const event = await db('payment_events')
      //   .where({ provider_event_id: providerEventId })
      //   .first();
      // return event;

      return null;
    } catch (error) {
      console.error('Error getting payment event by provider event ID:', error);
      throw error;
    }
  }

  private async createPaymentEvent(data: any): Promise<void> {
    try {
      // TODO: Implement actual database insert using Knex
      // For now, just log the event creation
      console.log(`Creating payment event: ${data.eventType}`);

      // TODO: Insert into payment_events table
      // await db('payment_events').insert({
      //   payment_id: data.paymentId,
      //   event_type: data.eventType,
      //   from_status: data.fromStatus,
      //   to_status: data.toStatus,
      //   provider_event_id: data.providerEventId,
      //   signature_hash: data.signatureHash,
      //   provider_data: data.providerData,
      //   metadata: data.metadata,
      //   created_at: new Date()
      // });
    } catch (error) {
      console.error('Error creating payment event:', error);
      throw error;
    }
  }

  // Health check method
  getProviderStatus(): Record<string, { enabled: boolean; isPrimary: boolean }> {
    return this.providerRegistry.getProviderStatus();
  }

  // Helper method to get candidate by email
  async getCandidateByEmail(email: string): Promise<any> {
    try {
      // TODO: Implement actual database query using Knex
      // For now, return null to indicate candidate not found

      // TODO: Query candidates table
      // const candidate = await db('candidates')
      //   .where({ email: email })
      //   .first();
      // return candidate;

      return null;
    } catch (error) {
      console.error('Error getting candidate by email:', error);
      throw error;
    }
  }

  // Helper method to get candidate by JAMB registration number
  async getCandidateByJambRegNo(jambRegNo: string): Promise<any> {
    try {
      // TODO: Implement actual database query using Knex
      // For now, return null to indicate candidate not found

      // TODO: Query candidates table
      // const candidate = await db('candidates')
      //   .where({ jamb_reg_no: jambRegNo })
      //   .first();
      // return candidate;

      return null;
    } catch (error) {
      console.error('Error getting candidate by JAMB registration number:', error);
      throw error;
    }
  }

  // Helper method to get payment statistics for admin purposes
  async getPaymentStatistics(session?: string): Promise<any> {
    try {
      // TODO: Implement actual database query using Knex
      // For now, return mock statistics

      // TODO: Query payments table for statistics
      // let query = db('payments');
      // if (session) {
      //   query = query.where({ session: session });
      // }
      //
      // const stats = await query
      //   .select(
      //     db.raw('COUNT(*) as total_payments'),
      //     db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as successful_payments', ['success']),
      //     db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as pending_payments', ['pending']),
      //     db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as failed_payments', ['failed']),
      //     db.raw('COALESCE(SUM(CASE WHEN status = ? THEN amount ELSE 0 END), 0) as total_revenue', ['success'])
      //   )
      //   .first();
      //
      // return stats;

      // Mock statistics for testing
      return {
        totalPayments: 150,
        successfulPayments: 120,
        pendingPayments: 20,
        failedPayments: 10,
        totalRevenue: 2500000, // 2.5M NGN
        session: session || '2024/2025',
      };
    } catch (error) {
      console.error('Error getting payment statistics:', error);
      throw error;
    }
  }

  // Helper method to get payment history for a candidate
  async getCandidatePaymentHistory(candidateId: string, session?: string): Promise<any[]> {
    try {
      // TODO: Implement actual database query using Knex
      // For now, return mock payment history

      // TODO: Query payments table
      // let query = db('payments').where({ candidate_id: candidateId });
      // if (session) {
      //   query = query.where({ session: session });
      // }
      // const payments = await query.orderBy('created_at', 'desc');
      // return payments;

      // Mock payment history for testing
      return [
        {
          id: 'mock-payment-1',
          purpose: 'post_utme',
          amount: 2000,
          status: 'success',
          session: session || '2024/2025',
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
        },
        {
          id: 'mock-payment-2',
          purpose: 'acceptance',
          amount: 50000,
          status: 'pending',
          session: session || '2024/2025',
          createdAt: new Date(),
        },
      ];
    } catch (error) {
      console.error('Error getting candidate payment history:', error);
      throw error;
    }
  }

  // Helper method to get payment types for a session
  async getPaymentTypes(session: string): Promise<any[]> {
    try {
      // TODO: Implement actual database query using Knex
      // For now, return mock payment types

      // TODO: Query payment_types table
      // const paymentTypes = await db('payment_types')
      //   .where({ session: session, is_active: true })
      //   .orderBy('name');
      // return paymentTypes;

      // Mock payment types for testing
      return [
        {
          id: 'mock-pt-1',
          name: 'Post-UTME Registration Fee',
          code: 'post_utme',
          amount: 2000,
          currency: 'NGN',
          session: session,
          isActive: true,
        },
        {
          id: 'mock-pt-2',
          name: 'Acceptance Fee',
          code: 'acceptance',
          amount: 50000,
          currency: 'NGN',
          session: session,
          isActive: true,
        },
        {
          id: 'mock-pt-3',
          name: 'School Fee',
          code: 'school_fee',
          amount: 150000,
          currency: 'NGN',
          session: session,
          isActive: true,
        },
      ];
    } catch (error) {
      console.error('Error getting payment types:', error);
      throw error;
    }
  }
}
