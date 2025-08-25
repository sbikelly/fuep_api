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

import { db } from '../db/knex.js';
import { logger } from '../middleware/logging.js';
import { EmailService } from '../services/email.service.js';
import { PaymentProviderRegistry } from './providers/provider-registry.js';

export class PaymentService {
  private providerRegistry: PaymentProviderRegistry;
  private emailService: EmailService;

  constructor(providerRegistry: PaymentProviderRegistry) {
    console.log('[PaymentService] Constructor called');
    this.providerRegistry = providerRegistry;
    this.emailService = new EmailService();
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
      const paymentTypes = await this.getPaymentPurposes(request.session);
      const configuredPaymentType = paymentTypes.find((pt) => pt.purpose === request.purpose);

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
        idempotencyKey: `${request.candidateId}_${request.purpose}_${request.session}_${Date.now()}`, // Generate unique idempotency key
        requestHash: createHash('sha256')
          .update(
            `${request.candidateId}${request.purpose}${request.amount}${request.session}${Date.now()}`
          )
          .digest('hex')
          .substring(0, 64), // Generate request hash
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
      const payment = await db('payments').where({ provider_ref: providerRef }).first();

      if (!payment) return null;

      return {
        id: payment.id,
        candidateId: payment.candidate_id,
        purpose: payment.purpose,
        provider: payment.provider,
        providerRef: payment.provider_ref,
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        status: payment.status,
        paymentLevel: payment.payment_level,
        session: payment.session,
        idempotencyKey: payment.idempotency_key,
        requestHash: payment.request_hash,
        responseSnapshot: payment.response_snapshot,
        statusCode: payment.status_code,
        firstRequestAt: new Date(payment.first_request_at),
        lastRequestAt: new Date(payment.last_request_at),
        replayCount: payment.replay_count,
        externalReference: payment.external_reference,
        metadata: payment.metadata,
        expiresAt: payment.expires_at ? new Date(payment.expires_at) : undefined,
        rawPayload: payment.raw_payload,
        createdAt: new Date(payment.created_at),
        updatedAt: new Date(payment.updated_at),
      };
    } catch (error) {
      console.error('Error getting payment by provider reference:', error);
      throw error;
    }
  }

  private async getPaymentById(paymentId: string): Promise<PaymentTransaction | null> {
    try {
      const payment = await db('payments').where({ id: paymentId }).first();

      if (!payment) return null;

      return {
        id: payment.id,
        candidateId: payment.candidate_id,
        purpose: payment.purpose,
        provider: payment.provider,
        providerRef: payment.provider_ref,
        amount: parseFloat(payment.amount),
        currency: payment.currency,
        status: payment.status,
        paymentLevel: payment.payment_level,
        session: payment.session,
        idempotencyKey: payment.idempotency_key,
        requestHash: payment.request_hash,
        responseSnapshot: payment.response_snapshot,
        statusCode: payment.status_code,
        firstRequestAt: new Date(payment.first_request_at),
        lastRequestAt: new Date(payment.last_request_at),
        replayCount: payment.replay_count,
        externalReference: payment.external_reference,
        metadata: payment.metadata,
        expiresAt: payment.expires_at ? new Date(payment.expires_at) : undefined,
        rawPayload: payment.raw_payload,
        createdAt: new Date(payment.created_at),
        updatedAt: new Date(payment.updated_at),
      };
    } catch (error) {
      console.error('Error getting payment by ID:', error);
      throw error;
    }
  }

  private async createPaymentRecord(data: any): Promise<PaymentTransaction> {
    try {
      const paymentData = {
        candidate_id: data.candidateId,
        purpose: data.purpose,
        provider: data.provider,
        provider_ref: data.providerRef,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        payment_level: data.paymentLevel,
        session: data.session,
        idempotency_key: data.idempotencyKey,
        request_hash: data.requestHash,
        response_snapshot: data.responseSnapshot,
        status_code: data.statusCode || 201,
        first_request_at: new Date(),
        last_request_at: new Date(),
        replay_count: 1,
        external_reference: data.externalReference,
        metadata: data.metadata,
        expires_at: data.expiresAt,
        raw_payload: data.rawPayload,
      };

      const [insertedPayment] = await db('payments').insert(paymentData).returning('*');

      return {
        id: insertedPayment.id,
        candidateId: insertedPayment.candidate_id,
        purpose: insertedPayment.purpose,
        provider: insertedPayment.provider,
        providerRef: insertedPayment.provider_ref,
        amount: parseFloat(insertedPayment.amount),
        currency: insertedPayment.currency,
        status: insertedPayment.status,
        paymentLevel: insertedPayment.payment_level,
        session: insertedPayment.session,
        idempotencyKey: insertedPayment.idempotency_key,
        requestHash: insertedPayment.request_hash,
        responseSnapshot: insertedPayment.response_snapshot,
        statusCode: insertedPayment.status_code,
        firstRequestAt: new Date(insertedPayment.first_request_at),
        lastRequestAt: new Date(insertedPayment.last_request_at),
        replayCount: insertedPayment.replay_count,
        externalReference: insertedPayment.external_reference,
        metadata: insertedPayment.metadata,
        expiresAt: insertedPayment.expires_at ? new Date(insertedPayment.expires_at) : undefined,
        rawPayload: insertedPayment.raw_payload,
        createdAt: new Date(insertedPayment.created_at),
        updatedAt: new Date(insertedPayment.updated_at),
      };
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
      const updateData: any = {
        status,
        updated_at: new Date(),
        last_request_at: new Date(),
      };

      // Add additional fields if provided
      if (data.webhookReceivedAt) {
        updateData.webhook_received_at = data.webhookReceivedAt;
      }
      if (data.verifiedAt) {
        updateData.verified_at = data.verifiedAt;
      }
      if (data.receiptUrl) {
        updateData.receipt_url = data.receiptUrl;
      }
      if (data.rawPayload) {
        updateData.raw_payload = data.rawPayload;
      }
      if (data.metadata) {
        updateData.metadata = data.metadata;
      }

      await db('payments').where({ id: paymentId }).update(updateData);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  private async updatePaymentReceipt(paymentId: string, receiptUrl: string): Promise<void> {
    try {
      await db('payments').where({ id: paymentId }).update({
        receipt_url: receiptUrl,
        updated_at: new Date(),
      });
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
      const event = await db('payment_events')
        .where({ provider_event_id: providerEventId })
        .first();
      return event;
    } catch (error) {
      console.error('Error getting payment event by provider event ID:', error);
      throw error;
    }
  }

  private async createPaymentEvent(data: any): Promise<void> {
    try {
      await db('payment_events').insert({
        payment_id: data.paymentId,
        event_type: data.eventType,
        from_status: data.fromStatus,
        to_status: data.toStatus,
        provider_event_id: data.providerEventId,
        signature_hash: data.signatureHash,
        provider_data: data.providerData,
        metadata: data.metadata,
        created_at: new Date(),
      });
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
      const candidate = await db('candidates').where({ email: email }).first();
      return candidate;
    } catch (error) {
      console.error('Error getting candidate by email:', error);
      throw error;
    }
  }

  // Helper method to get candidate by JAMB registration number
  async getCandidateByJambRegNo(jambRegNo: string): Promise<any> {
    try {
      const candidate = await db('candidates').where({ jamb_reg_no: jambRegNo }).first();
      return candidate;
    } catch (error) {
      console.error('Error getting candidate by JAMB registration number:', error);
      throw error;
    }
  }

  // Helper method to get payment statistics for admin purposes
  async getPaymentStatistics(session?: string): Promise<any> {
    try {
      let query = db('payments');
      if (session) {
        query = query.where({ session: session });
      }

      const stats = await query
        .select(
          db.raw('COUNT(*) as total_payments'),
          db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as successful_payments', ['success']),
          db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as pending_payments', ['pending']),
          db.raw('COUNT(CASE WHEN status = ? THEN 1 END) as failed_payments', ['failed']),
          db.raw('COALESCE(SUM(CASE WHEN status = ? THEN amount ELSE 0 END), 0) as total_revenue', [
            'success',
          ])
        )
        .first();

      return {
        totalPayments: parseInt(stats.total_payments as string) || 0,
        successfulPayments: parseInt(stats.successful_payments as string) || 0,
        pendingPayments: parseInt(stats.pending_payments as string) || 0,
        failedPayments: parseInt(stats.failed_payments as string) || 0,
        totalRevenue: parseFloat(stats.total_revenue as string) || 0,
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
      let query = db('payments').where({ candidate_id: candidateId });
      if (session) {
        query = query.where({ session: session });
      }

      const payments = await query
        .select(
          'id',
          'purpose',
          'amount',
          'status',
          'session',
          'created_at',
          'provider',
          'currency'
        )
        .orderBy('created_at', 'desc');

      return payments.map((payment) => ({
        id: payment.id,
        purpose: payment.purpose,
        amount: parseFloat(payment.amount),
        status: payment.status,
        session: payment.session,
        provider: payment.provider,
        currency: payment.currency,
        createdAt: new Date(payment.created_at),
      }));
    } catch (error) {
      console.error('Error getting candidate payment history:', error);
      throw error;
    }
  }

  async getPaymentPurposes(session: string): Promise<any[]> {
    const paymentPurposes = await db('payment_purposes')
      .where('session', session)
      .andWhere('is_active', true)
      .orderBy('name', 'asc');

    return paymentPurposes.map((pp) => ({
      id: pp.id,
      name: pp.name,
      purpose: pp.purpose,
      description: pp.description,
      amount: pp.amount,
      currency: pp.currency,
      category: pp.category,
      requiresVerification: pp.requires_verification,
      session: pp.session,
      dueDate: pp.due_date,
      isActive: pp.is_active,
    }));
  }

  async getPaymentPurposeByPurpose(purpose: string): Promise<{
    id: string;
    name: string;
    purpose: string;
    amount: number;
    currency: string;
    session: string;
    isActive: boolean;
  } | null> {
    const paymentPurpose = await db('payment_purposes').where('purpose', purpose).first();

    if (!paymentPurpose) return null;

    return {
      id: paymentPurpose.id,
      name: paymentPurpose.name,
      purpose: paymentPurpose.purpose,
      amount: paymentPurpose.amount,
      currency: paymentPurpose.currency,
      session: paymentPurpose.session,
      isActive: paymentPurpose.is_active,
    };
  }

  /**
   * Create a new payment with email confirmation
   */
  async createPayment(paymentData: {
    candidateId: string;
    amount: number;
    purpose: string;
    session: string;
    provider: string;
  }): Promise<{
    success: boolean;
    paymentId?: string;
    message: string;
    error?: string;
  }> {
    try {
      // Validate payment amount
      const paymentType = await this.getPaymentPurposeByPurpose(paymentData.purpose);
      if (!paymentType) {
        return {
          success: false,
          message: 'Invalid payment purpose',
          error: 'Payment purpose not found',
        };
      }

      if (paymentData.amount !== paymentType.amount) {
        return {
          success: false,
          message: `Invalid payment amount. Expected: ₦${paymentType.amount}, Received: ₦${paymentData.amount}`,
          error: 'Amount mismatch',
        };
      }

      // Get candidate information for email
      const candidate = await db('candidates').where('id', paymentData.candidateId).first();

      const profile = await db('profiles').where('candidate_id', paymentData.candidateId).first();

      if (!candidate || !profile?.email) {
        return {
          success: false,
          message: 'Candidate not found or email not available',
          error: 'Candidate lookup failed',
        };
      }

      // Create payment record
      const [paymentId] = await db('payments')
        .insert({
          candidate_id: paymentData.candidateId,
          amount: paymentData.amount,
          purpose: paymentData.purpose,
          status: 'pending',
          provider: paymentData.provider,
          session: paymentData.session,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('id');

      // Update candidate payment status based on purpose
      if (paymentData.purpose === 'post_utme') {
        await db('candidates').where('id', paymentData.candidateId).update({
          post_utme_paid: true,
          updated_at: new Date(),
        });
      } else if (paymentData.purpose === 'acceptance') {
        await db('candidates').where('id', paymentData.candidateId).update({
          acceptance_paid: true,
          updated_at: new Date(),
        });
      } else if (paymentData.purpose === 'school_fees') {
        await db('candidates').where('id', paymentData.candidateId).update({
          school_fees_paid: true,
          updated_at: new Date(),
        });
      }

      // Send payment confirmation email
      if (profile.email) {
        await this.emailService.sendPaymentConfirmation(
          profile.email,
          candidate.name || 'Candidate',
          {
            amount: paymentData.amount,
            purpose: paymentData.purpose,
            reference: paymentId,
            date: new Date(),
          }
        );
      }

      logger.info('Payment created successfully', {
        module: 'payment',
        operation: 'createPayment',
        metadata: { paymentId, candidateId: paymentData.candidateId, amount: paymentData.amount },
      });

      return {
        success: true,
        paymentId,
        message: 'Payment created successfully',
      };
    } catch (error) {
      logger.error('Failed to create payment', {
        module: 'payment',
        operation: 'createPayment',
        metadata: { paymentData },
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        message: 'Failed to create payment',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Confirm payment and send confirmation email
   */
  async confirmPayment(
    paymentId: string,
    providerResponse: any
  ): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      // Update payment status
      await db('payments')
        .where('id', paymentId)
        .update({
          status: 'success',
          provider_response: JSON.stringify(providerResponse),
          updated_at: new Date(),
        });

      // Get payment and candidate information for email
      const payment = await db('payments').where('id', paymentId).first();

      if (!payment) {
        return {
          success: false,
          message: 'Payment not found',
          error: 'Payment lookup failed',
        };
      }

      const candidate = await db('candidates').where('id', payment.candidate_id).first();

      const profile = await db('profiles').where('candidate_id', payment.candidate_id).first();

      // Send payment confirmation email
      if (profile?.email) {
        await this.emailService.sendPaymentConfirmation(
          profile.email,
          candidate?.name || 'Candidate',
          {
            amount: payment.amount,
            purpose: payment.purpose,
            reference: paymentId,
            date: new Date(),
          }
        );
      }

      logger.info('Payment confirmed successfully', {
        module: 'payment',
        operation: 'confirmPayment',
        metadata: { paymentId, candidateId: payment.candidate_id },
      });

      return {
        success: true,
        message: 'Payment confirmed successfully',
      };
    } catch (error) {
      logger.error('Failed to confirm payment', {
        module: 'payment',
        operation: 'confirmPayment',
        metadata: { paymentId, providerResponse },
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        message: 'Failed to confirm payment',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
