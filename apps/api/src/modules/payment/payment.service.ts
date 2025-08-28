import { PaymentPurpose, PaymentStatus } from '@fuep/types';

import { db } from '../../db/knex.js';
import { logger } from '../../middleware/logging.js';
import { EmailService } from '../../services/email.service.js';
import { RemitaPaymentRequest, RemitaService } from './remita.service.js';

export interface PaymentInitiationRequest {
  candidateId: string;
  purpose: PaymentPurpose;
  session: string;
  email: string;
  phone: string;
}

export interface PaymentInitiationResponse {
  success: boolean;
  rrr: string;
  paymentUrl: string;
  expiresAt: Date;
  paymentId: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  rrr: string;
  status: PaymentStatus;
  amount: number;
  purpose: PaymentPurpose;
  session: string;
  candidateId: string;
  verifiedAt?: Date;
}

export class PaymentService {
  private remitaService: RemitaService;
  private emailService: EmailService;

  constructor() {
    console.log('[PaymentService] Constructor called');
    this.remitaService = new RemitaService();
    this.emailService = new EmailService();
    console.log('[PaymentService] Initialized with Remita service');
  }

  /**
   * Initialize payment and generate RRR
   */
  async initiatePayment(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
    try {
      console.log(
        `[PaymentService] Processing payment initiation for candidate: ${request.candidateId}`
      );

      // Get candidate details for name and JAMB number
      const candidate = await this.getCandidateById(request.candidateId);
      if (!candidate) {
        throw new Error(`Candidate with ID ${request.candidateId} not found`);
      }

      // Validate payment purpose and get configured amount, session, and level
      const paymentPurpose = await this.validatePaymentPurpose(request);

      // Create Remita payment request with all required fields
      const remitaRequest: RemitaPaymentRequest = {
        candidateId: request.candidateId,
        purpose: request.purpose,
        amount: paymentPurpose.amount, // Use payment purpose amount
        session: paymentPurpose.session, // Use payment purpose session
        email: request.email,
        phone: request.phone,
      };

      // Generate RRR using Remita
      const rrr = await this.remitaService.generateRRR(remitaRequest);

      // Create payment record
      const payment = await this.createPaymentRecord({
        candidateId: request.candidateId,
        rrr,
        purpose: request.purpose,
        amount: paymentPurpose.amount, // Use payment purpose amount
        session: paymentPurpose.session, // Use payment purpose session
        level: paymentPurpose.level, // Use payment purpose level
        status: 'initiated',
        paymentUrl: this.remitaService.getPaymentUrl(rrr),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      logger.info(
        `[PaymentService] Payment initiated successfully. RRR: ${rrr}, Payment ID: ${payment.id}`
      );

      return {
        success: true,
        rrr,
        paymentUrl: payment.paymentUrl,
        expiresAt: payment.expiresAt,
        paymentId: payment.id,
      };
    } catch (error) {
      logger.error('[PaymentService] Payment initiation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check payment status from Remita
   */
  async checkPaymentStatus(rrr: string): Promise<PaymentStatusResponse> {
    try {
      logger.info(`[PaymentService] Checking payment status for RRR: ${rrr}`);

      // Get payment record
      const payment = await this.getPaymentByRRR(rrr);
      if (!payment) {
        throw new Error(`Payment with RRR ${rrr} not found`);
      }

      // Get status from Remita
      const status = await this.remitaService.getPaymentStatus(rrr);

      // Update local database
      await this.updatePaymentStatus(rrr, status);

      // Send notifications if payment successful
      if (status === 'success') {
        await this.sendPaymentSuccessNotification(payment);
      }

      return {
        success: true,
        rrr,
        status,
        amount: payment.amount,
        purpose: payment.purpose,
        session: payment.session,
        candidateId: payment.candidateId,
        verifiedAt: new Date(),
      };
    } catch (error) {
      logger.error('[PaymentService] Status check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Process webhook from Remita
   */
  async processWebhook(webhookData: any, signature: string): Promise<void> {
    try {
      logger.info('[PaymentService] Processing Remita webhook');

      // Verify webhook signature
      const payload = JSON.stringify(webhookData);
      if (!this.remitaService.verifyWebhookSignature(payload, signature)) {
        throw new Error('Invalid webhook signature');
      }

      const { rrr, status, amount, transactionId } = webhookData;

      // Get payment record
      const payment = await this.getPaymentByRRR(rrr);
      if (!payment) {
        logger.warn(`[PaymentService] Payment with RRR ${rrr} not found for webhook`);
        return;
      }

      // Update payment status
      const mappedStatus = this.remitaService['mapRemitaStatus'](status);
      await this.updatePaymentStatus(rrr, mappedStatus);

      // Send notifications
      if (mappedStatus === 'success') {
        await this.sendPaymentSuccessNotification(payment);
      }

      logger.info(`[PaymentService] Webhook processed successfully for RRR: ${rrr}`);
    } catch (error) {
      logger.error('[PaymentService] Webhook processing failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get payment purposes for a session using the new simplified structure
   */
  async getPaymentPurposes(session: string): Promise<any[]> {
    try {
      logger.info(`[PaymentService] Getting payment purposes for session: ${session}`);

      const paymentPurposes = await db('payment_purposes')
        .where('session', session)
        .andWhere('is_active', true)
        .orderBy(['level', 'purpose']);

      logger.info(
        `[PaymentService] Found ${paymentPurposes.length} active payment purposes for session ${session}`
      );

      return paymentPurposes.map((pp) => ({
        id: pp.id,
        name: pp.name,
        purpose: pp.purpose,
        description: pp.description,
        amount: pp.amount,
        session: pp.session,
        level: pp.level,
        isActive: pp.is_active,
      }));
    } catch (error) {
      logger.error('[PaymentService] Failed to get payment purposes', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get payment history for a candidate
   */
  async getCandidatePaymentHistory(
    candidateId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    try {
      const offset = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        db('payment_transactions')
          .where({ candidateId })
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .offset(offset)
          .select('*'),
        db('payment_transactions').where({ candidateId }).count('* as total').first(),
      ]);

      return {
        success: true,
        data: payments.map((payment: any) => ({
          id: payment.id,
          rrr: payment.rrr,
          purpose: payment.purpose,
          amount: payment.amount,
          session: payment.session,
          level: payment.level,
          status: payment.status,
          paymentUrl: payment.payment_url,
          expiresAt: payment.expires_at,
          createdAt: payment.created_at,
        })),
        total: total?.total || 0,
        page,
        limit,
      };
    } catch (error) {
      logger.error('[PaymentService] Failed to get payment history', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(): Promise<any> {
    try {
      const [totalPayments, totalAmount, statusCounts] = await Promise.all([
        db('payment_transactions').count('* as total').first(),
        db('payment_transactions').sum('amount as total').first(),
        db('payment_transactions').select('status').count('* as count').groupBy('status'),
      ]);

      const statusMap = statusCounts.reduce((acc: any, item: any) => {
        acc[item.status] = parseInt(item.count as string);
        return acc;
      }, {});

      return {
        success: true,
        data: {
          totalPayments: parseInt((totalPayments?.total as string) || '0'),
          totalAmount: parseFloat((totalAmount?.total as string) || '0'),
          successfulPayments: statusMap.success || 0,
          pendingPayments: statusMap.pending || 0,
          failedPayments: statusMap.failed || 0,
          averageAmount:
            totalPayments?.total && parseInt(totalPayments.total as string) > 0
              ? parseFloat((totalAmount?.total as string) || '0') /
                parseInt(totalPayments.total as string)
              : 0,
        },
      };
    } catch (error) {
      logger.error('[PaymentService] Failed to get payment statistics', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get candidate by email
   */
  async getCandidateByEmail(email: string): Promise<any> {
    try {
      return await db('candidates').where({ email }).first();
    } catch (error) {
      logger.error('[PaymentService] Failed to get candidate by email', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get candidate by JAMB registration number
   */
  async getCandidateByJambRegNo(jambRegNo: string): Promise<any> {
    try {
      return await db('candidates').where({ jamb_reg_no: jambRegNo }).first();
    } catch (error) {
      logger.error('[PaymentService] Failed to get candidate by JAMB reg no', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get candidate by ID
   */
  private async getCandidateById(candidateId: string): Promise<any> {
    try {
      return await db('candidates').where({ id: candidateId }).first();
    } catch (error) {
      logger.error('[PaymentService] Failed to get candidate by ID', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Validate payment purpose and get configured details using new simplified structure
   */
  private async validatePaymentPurpose(request: PaymentInitiationRequest): Promise<any> {
    const paymentPurposes = await this.getPaymentPurposes(request.session);
    const configuredPaymentPurpose = paymentPurposes.find((pt) => pt.purpose === request.purpose);

    if (!configuredPaymentPurpose) {
      throw new Error(
        `Payment purpose '${request.purpose}' not configured for session '${request.session}'`
      );
    }

    return configuredPaymentPurpose;
  }

  /**
   * Create payment record in database
   */
  private async createPaymentRecord(paymentData: any): Promise<any> {
    try {
      const [payment] = await db('payment_transactions')
        .insert({
          candidate_id: paymentData.candidateId,
          rrr: paymentData.rrr,
          purpose: paymentData.purpose,
          amount: paymentData.amount,
          session: paymentData.session,
          level: paymentData.level,
          status: paymentData.status,
          payment_url: paymentData.paymentUrl,
          expires_at: paymentData.expiresAt,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning('*');

      return payment;
    } catch (error) {
      logger.error('[PaymentService] Failed to create payment record', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get payment by RRR
   */
  private async getPaymentByRRR(rrr: string): Promise<any> {
    try {
      return await db('payment_transactions').where({ rrr }).first();
    } catch (error) {
      logger.error('[PaymentService] Failed to get payment by RRR', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update payment status
   */
  private async updatePaymentStatus(rrr: string, status: PaymentStatus): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date(),
      };

      if (status === 'success') {
        updateData.verified_at = new Date();
      }

      await db('payment_transactions').where({ rrr }).update(updateData);

      logger.info(`[PaymentService] Payment status updated for RRR ${rrr}: ${status}`);
    } catch (error) {
      logger.error('[PaymentService] Failed to update payment status', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Send payment success notification
   */
  private async sendPaymentSuccessNotification(payment: any): Promise<void> {
    try {
      // Get candidate details
      const candidate = await db('candidates').where({ id: payment.candidateId }).first();
      if (!candidate) {
        logger.warn(`[PaymentService] Candidate not found for payment: ${payment.id}`);
        return;
      }

      // Send email notification
      await this.emailService.sendPaymentConfirmation(
        candidate.email,
        `${candidate.firstname} ${candidate.surname}`,
        {
          amount: payment.amount,
          purpose: payment.purpose,
          reference: payment.rrr,
          date: new Date(),
        }
      );

      logger.info(`[PaymentService] Payment success notification sent for RRR: ${payment.rrr}`);
    } catch (error) {
      logger.error('[PaymentService] Failed to send payment success notification', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw error for notification failures
    }
  }
}
