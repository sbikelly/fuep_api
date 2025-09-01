import {
  Payment,
  PaymentHistoryResponse,
  PaymentInitiationRequest,
  PaymentInitiationResponse,
  PaymentPurpose,
  PaymentPurposeName,
  PaymentReceiptResponse,
  PaymentStatistics,
  PaymentStatus,
  PaymentStatusCheckRequest,
  PaymentStatusCheckResponse,
  RemitaPaymentRequest,
  RemitaRRRResponse,
  RemitaStatusResponse,
} from '@fuep/types';

import { db } from '../../db/knex.js';
import { logger } from '../../middleware/logging.js';
import { EmailService } from '../../services/email.service.js';
import { CandidateService } from '../candidates/candidate.service.js';
import { RemitaService } from './remita.service.js';

/**
 * payments table:
├── id (uuid, primary key)
├── candidate_id (uuid, foreign key)
├── amount (numeric(10,2))
├── currency (varchar(3)) - Kept for view compatibility
├── status (varchar(20)) - Updated enum values
├── purpose (varchar(50))
├── provider (varchar(50)) - Kept for view compatibility
├── provider_ref (varchar(100))
├── description (text)
├── created_at (timestamp)
├── updated_at (timestamp)
├── payment_level (varchar(16)) - NEW
├── session (varchar(16)) - NEW, NOT NULL
├── rrr (varchar(100)) - NEW
├── payment_url (text) - NEW
├── webhook_received_at (timestamp) - NEW
└── verified_at (timestamp) - NEW
 */

export class PaymentService {
  private remitaService: RemitaService;
  private emailService: EmailService;
  private candidateService: CandidateService;

  constructor(candidateService?: CandidateService) {
    console.log('[PaymentService] Constructor called');
    this.remitaService = new RemitaService();
    this.emailService = new EmailService();
    this.candidateService = candidateService || new CandidateService(console);
    console.log('[PaymentService] Initialized with Remita service');
  }

  /**
   * Initialize payment and generate RRR
   */
  async initiatePayment(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
    try {
      console.log(
        `[PaymentService] Processing payment initiation for candidate: ${request.userId}, purpose: ${request.purpose.purpose}`
      );

      // Validate payment purpose and get configured amount, session, and level
      const paymentPurpose = await this.validatePaymentPurpose(request);

      // Check if the candidate has already paid/initiated payment for the same paymentpurposename, session and level
      const existingPayment = await db('payments')
        .where({
          candidate_id: request.userId,
          purpose: paymentPurpose.name,
          session: paymentPurpose.session,
          payment_level: paymentPurpose.level,
        })
        .first();

      if (existingPayment) {
        throw new Error(
          `User has already paid or initiated payment for this purpose, session, and level:\n ${JSON.stringify(existingPayment)}`
        );
      }

      // Create Remita payment request with all required fields
      const remitaRequest: RemitaPaymentRequest = request;

      // Generate RRR using Remita
      const rrr = await this.remitaService.generateRRR(remitaRequest);

      //check if the rrr was generated
      if (!rrr) {
        throw new Error('Failed to generate RRR');
      }

      // Create payment record
      const payment = await this.createPaymentRecord({
        userId: request.userId,
        rrr,
        purpose: request.purpose,
        amount: paymentPurpose.amount, // Use payment purpose amount
        session: paymentPurpose.session, // Use payment purpose session
        level: paymentPurpose.level, // Use payment purpose level
        status: 'initiated',
        paymentUrl: this.remitaService.getPaymentUrl(rrr),
      });

      logger.info(
        `[PaymentService] Payment initiated successfully. RRR: ${rrr}, Payment ID: ${payment.id}`
      );

      return {
        success: true,
        rrr,
        paymentUrl: payment.paymentUrl,
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
  async checkPaymentStatus(rrr: string): Promise<PaymentStatusCheckResponse> {
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
        category: pp.category, // Changed from facultyId to category
        createdBy: pp.created_by,
        updated_at: pp.updated_at,
        created_at: pp.created_at,
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
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    try {
      const offset = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        db('payments')
          .where({ candidate_id: userId })
          .orderBy('created_at', 'desc')
          .limit(limit)
          .offset(offset)
          .select('*'),
        db('payments').where({ candidate_id: userId }).count('* as total').first(),
      ]);

      return {
        success: true,
        data: payments.map((payment: any) => ({
          id: payment.id,
          rrr: payment.rrr,
          purpose: payment.purpose,
          amount: payment.amount,
          session: payment.session,
          level: payment.payment_level,
          status: payment.status,
          paidAt: payment.verified_at,
          paymentUrl: payment.payment_url,
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
        db('payments').count('* as total').first(),
        db('payments').sum('amount as total').first(),
        db('payments').select('status').count('* as count').groupBy('status'),
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
   * Validate payment purpose and get configured details using new simplified structure
   * For school fee payments, check candidate's department category
   */
  private async validatePaymentPurpose(request: PaymentInitiationRequest): Promise<any> {
    const paymentPurposes = await this.getPaymentPurposes(request.purpose.session);

    // For school fee payments, we need to check the candidate's department category
    if (request.purpose.purpose === 'SCHOOL_FEES') {
      // Get candidate's department information
      const candidate = await db('candidates')
        .select('candidates.*', 'departments.payment_category')
        .leftJoin('departments', 'candidates.department_id', 'departments.id')
        .where('candidates.id', request.userId)
        .first();

      if (!candidate) {
        throw new Error(`Candidate with ID ${request.userId} not found`);
      }

      if (!candidate.department_id) {
        throw new Error(`Candidate ${request.userId} is not associated with any department`);
      }

      if (!candidate.payment_category) {
        throw new Error(
          `Department for candidate ${request.userId} does not have a payment category configured`
        );
      }

      // Find payment purpose that matches the candidate's department category
      const configuredPaymentPurpose = paymentPurposes.find(
        (pt) => pt.purpose === request.purpose.purpose && pt.category === candidate.payment_category
      );

      if (!configuredPaymentPurpose) {
        throw new Error(
          `School fee payment purpose not configured for department category '${candidate.payment_category}' in session '${request.purpose.session}'`
        );
      }

      logger.info(
        `[PaymentService] Found school fee payment purpose for category '${candidate.payment_category}': ${JSON.stringify(configuredPaymentPurpose)}`
      );

      return configuredPaymentPurpose;
    } else {
      // For non-school fee payments, use the original logic
      const configuredPaymentPurpose = paymentPurposes.find(
        (pt) => pt.purpose === request.purpose.purpose
      );

      if (!configuredPaymentPurpose) {
        throw new Error(
          `Payment purpose '${request.purpose.purpose}' not configured for session '${request.purpose.session}'`
        );
      }

      return configuredPaymentPurpose;
    }
  }

  /**
   * Create payment record in database
   */
  private async createPaymentRecord(paymentData: any): Promise<any> {
    try {
      const [payment] = await db('payments')
        .insert({
          candidate_id: paymentData.userId,
          rrr: paymentData.rrr,
          purpose: paymentData.purpose,
          amount: paymentData.amount,
          session: paymentData.session,
          payment_level: paymentData.level,
          status: paymentData.status,
          payment_url: paymentData.paymentUrl,
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
      return await db('payments').where({ rrr }).first();
    } catch (error) {
      logger.error('[PaymentService] Failed to get payment by RRR', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get payment by candidate id
   */
  private async getPaymentByuserId(userId: string): Promise<any> {
    try {
      return await db('payments').where({ candidate_id: userId }).first();
    } catch (error) {
      logger.error('[PaymentService] Failed to get payment by candidate id', {
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

      await db('payments').where({ rrr }).update(updateData);

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
      const candidate = await db('candidates').where({ id: payment.userId }).first();
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
