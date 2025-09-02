import {
  Payment,
  PaymentHistoryResponse,
  PaymentPurpose,
  PaymentPurposeCategory,
  PaymentPurposeName,
  PaymentStatistics,
  PaymentStatus,
} from '@fuep/types';

import { db } from '../../../db/knex.js';
import { logger } from '../../../middleware/logging.js';
import { PaymentService } from '../../payment/payment.service.js';
import { AdminAuditService } from './admin-audit.service.js';
import { PaymentPurposeService } from './payment-purpose.service.js';

export interface PaymentFilters {
  status?: PaymentStatus;
  purpose?: PaymentPurposeName;
  session?: string;
  level?: string;
  category?: PaymentPurposeCategory;
  startDate?: Date;
  endDate?: Date;
  candidateId?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface PaymentVerificationRequest {
  isVerified: boolean;
  notes?: string;
  externalReference?: string;
}

export interface PaymentRefundRequest {
  amount: number;
  reason: string;
  notes?: string;
}

export class AdminPaymentService {
  private auditService: AdminAuditService;
  private paymentPurposeService: PaymentPurposeService;
  private paymentService: PaymentService;

  constructor(auditService: AdminAuditService) {
    this.auditService = auditService;
    this.paymentPurposeService = new PaymentPurposeService();
    this.paymentService = new PaymentService();
  }

  // ============================================
  // Payment Purpose Management (Reusing PaymentPurposeService)
  // ============================================

  /**
   * Create a new payment purpose
   */
  async createPaymentPurpose(
    request: {
      name: PaymentPurposeName;
      purpose: PaymentPurposeName;
      description?: string;
      amount: number;
      session: string;
      level: string;
      category?: PaymentPurposeCategory;
    },
    adminUserId: string
  ): Promise<PaymentPurpose> {
    try {
      logger.info(`[AdminPaymentService] Creating payment purpose: ${request.name}`);

      const paymentPurpose = await this.paymentPurposeService.createPaymentPurpose({
        ...request,
        isActive: true,
        createdBy: adminUserId,
      });

      // Log the action
      await this.auditService.logAction({
        adminUserId,
        action: 'create',
        resource: 'payment_purposes',
        resourceId: paymentPurpose.id,
        details: request,
      });

      return paymentPurpose;
    } catch (error) {
      logger.error(`[AdminPaymentService] Failed to create payment purpose: ${error}`);
      throw error;
    }
  }

  /**
   * Update payment purpose
   */
  async updatePaymentPurpose(
    id: string,
    updates: Partial<{
      name: PaymentPurposeName;
      purpose: PaymentPurposeName;
      description: string;
      amount: number;
      session: string;
      level: string;
      category: PaymentPurposeCategory;
      isActive: boolean;
    }>,
    adminUserId: string
  ): Promise<PaymentPurpose> {
    try {
      logger.info(`[AdminPaymentService] Updating payment purpose: ${id}`);

      const currentPaymentPurpose = await this.paymentPurposeService.getPaymentPurposeById(id);
      if (!currentPaymentPurpose) {
        throw new Error('Payment purpose not found');
      }

      const updatedPaymentPurpose = await this.paymentPurposeService.updatePaymentPurpose(
        id,
        updates
      );

      // Log the action
      await this.auditService.logAction({
        adminUserId,
        action: 'update',
        resource: 'payment_purposes',
        resourceId: id,
        details: { previous: currentPaymentPurpose, updates },
      });

      return updatedPaymentPurpose;
    } catch (error) {
      logger.error(`[AdminPaymentService] Failed to update payment purpose: ${error}`);
      throw error;
    }
  }

  /**
   * Get payment purpose by ID
   */
  async getPaymentPurposeById(id: string): Promise<PaymentPurpose | null> {
    return await this.paymentPurposeService.getPaymentPurposeById(id);
  }

  /**
   * Get all payment purposes with optional filtering
   */
  async getPaymentPurposes(
    filters: {
      session?: string;
      purpose?: PaymentPurposeName;
      level?: string;
      category?: PaymentPurposeCategory;
      isActive?: boolean;
    } = {}
  ): Promise<PaymentPurpose[]> {
    return await this.paymentPurposeService.getPaymentPurposes(filters);
  }

  /**
   * Delete payment purpose (soft delete)
   */
  async deletePaymentPurpose(id: string, adminUserId: string): Promise<void> {
    try {
      logger.info(`[AdminPaymentService] Deleting payment purpose: ${id}`);

      const currentPaymentPurpose = await this.paymentPurposeService.getPaymentPurposeById(id);
      if (!currentPaymentPurpose) {
        throw new Error('Payment purpose not found');
      }

      // Soft delete by setting isActive to false
      await this.paymentPurposeService.updatePaymentPurpose(id, { isActive: false });

      // Log the action
      await this.auditService.logAction({
        adminUserId,
        action: 'delete',
        resource: 'payment_purposes',
        resourceId: id,
        details: { deleted: currentPaymentPurpose },
      });
    } catch (error) {
      logger.error(`[AdminPaymentService] Failed to delete payment purpose: ${error}`);
      throw error;
    }
  }

  /**
   * Get payment purpose statistics
   */
  async getPaymentPurposeStatistics(): Promise<any> {
    return await this.paymentPurposeService.getPaymentPurposeStatistics();
  }

  // ============================================
  // Payment Management (Reusing PaymentService)
  // ============================================

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<Payment | null> {
    try {
      const payment = await db('payments').where('id', id).first();
      if (!payment) return null;

      return this.mapDbRecordToPayment(payment);
    } catch (error) {
      logger.error(`[AdminPaymentService] Failed to get payment by ID: ${error}`);
      throw error;
    }
  }

  /**
   * Get all payments with filtering and pagination
   */
  async getAllPayments(
    filters?: PaymentFilters,
    pagination?: { page: number; limit: number }
  ): Promise<{ payments: Payment[]; total: number }> {
    try {
      let query = db('payments')
        .select(
          'payments.*',
          'candidates.firstname',
          'candidates.surname',
          'candidates.email',
          'candidates.phone'
        )
        .leftJoin('candidates', 'payments.candidate_id', 'candidates.id');

      // Apply filters
      if (filters?.status) {
        query = query.where('payments.status', filters.status);
      }

      if (filters?.purpose) {
        query = query.where('payments.purpose', filters.purpose);
      }

      if (filters?.session) {
        query = query.where('payments.session', filters.session);
      }

      if (filters?.level) {
        query = query.where('payments.payment_level', filters.level);
      }

      if (filters?.startDate) {
        query = query.where('payments.created_at', '>=', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.where('payments.created_at', '<=', filters.endDate);
      }

      if (filters?.candidateId) {
        query = query.where('payments.candidate_id', filters.candidateId);
      }

      if (filters?.minAmount !== undefined) {
        query = query.where('payments.amount', '>=', filters.minAmount);
      }

      if (filters?.maxAmount !== undefined) {
        query = query.where('payments.amount', '<=', filters.maxAmount);
      }

      // Get total count
      const totalResult = await query.clone().count('payments.id as count').first();
      const total = totalResult ? parseInt(totalResult.count as string) : 0;

      // Apply pagination
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        query = query.offset(offset).limit(pagination.limit);
      }

      // Get payments
      const payments = await query.orderBy('payments.created_at', 'desc');

      return {
        payments: payments.map((payment) => this.mapDbRecordToPayment(payment)),
        total,
      };
    } catch (error) {
      logger.error(`[AdminPaymentService] Failed to get payments: ${error}`);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(): Promise<PaymentStatistics> {
    try {
      const statistics = await this.paymentService.getPaymentStatistics();
      return statistics.data;
    } catch (error) {
      logger.error(`[AdminPaymentService] Failed to get payment statistics: ${error}`);
      throw error;
    }
  }

  /**
   * Get payments by month for analytics
   */
  async getPaymentsByMonth(
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<{ [month: string]: number }> {
    try {
      const days =
        timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const results = await db('payments')
        .select(db.raw('DATE(created_at) as date'))
        .sum('amount as total')
        .where('status', 'success')
        .where('created_at', '>=', startDate)
        .groupBy(db.raw('DATE(created_at)'))
        .orderBy('date', 'asc');

      return results.reduce(
        (acc: { [month: string]: number }, row: any) => {
          acc[row.date as string] = parseFloat(row.total as string);
          return acc;
        },
        {} as { [month: string]: number }
      );
    } catch (error) {
      logger.error(`[AdminPaymentService] Failed to get payments by month: ${error}`);
      throw error;
    }
  }

  // ============================================
  // Payment Verification and Reconciliation
  // ============================================

  /**
   * Verify payment
   */
  async verifyPayment(
    paymentId: string,
    adminUserId: string,
    verificationDetails: PaymentVerificationRequest
  ): Promise<Payment> {
    try {
      logger.info(`[AdminPaymentService] Verifying payment: ${paymentId}`);

      const payment = await this.getPaymentById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'success') {
        throw new Error('Only successful payments can be verified');
      }

      const updateData: any = {
        verified_at: verificationDetails.isVerified ? new Date() : null,
        updated_at: new Date(),
      };

      if (verificationDetails.externalReference) {
        updateData.external_reference = verificationDetails.externalReference;
      }

      await db('payments').where('id', paymentId).update(updateData);

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'verify_payment',
        resource: 'payments',
        resourceId: paymentId,
        details: verificationDetails,
      });

      const verifiedPayment = await this.getPaymentById(paymentId);
      if (!verifiedPayment) {
        throw new Error('Failed to retrieve verified payment');
      }

      return verifiedPayment;
    } catch (error) {
      logger.error(`[AdminPaymentService] Failed to verify payment: ${error}`);
      throw error;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(
    paymentId: string,
    adminUserId: string,
    refundDetails: PaymentRefundRequest
  ): Promise<Payment> {
    try {
      logger.info(`[AdminPaymentService] Refunding payment: ${paymentId}`);

      const payment = await this.getPaymentById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'success') {
        throw new Error('Only successful payments can be refunded');
      }

      if (refundDetails.amount > payment.amount) {
        throw new Error('Refund amount cannot exceed payment amount');
      }

      await db('payments').where('id', paymentId).update({
        status: 'refunded',
        refunded_at: new Date(),
        refund_reason: refundDetails.reason,
        updated_at: new Date(),
      });

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'refund_payment',
        resource: 'payments',
        resourceId: paymentId,
        details: refundDetails,
      });

      const refundedPayment = await this.getPaymentById(paymentId);
      if (!refundedPayment) {
        throw new Error('Failed to retrieve refunded payment');
      }

      return refundedPayment;
    } catch (error) {
      logger.error(`[AdminPaymentService] Failed to refund payment: ${error}`);
      throw error;
    }
  }

  // ============================================
  // Enhanced Analytics Methods
  // ============================================

  /**
   * Get total revenue for a time range
   */
  async getTotalRevenue(timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<number> {
    try {
      const startDate = this.getStartDateFromTimeRange(timeRange);
      const result = await db('payments')
        .where('status', 'success')
        .where('created_at', '>=', startDate)
        .sum('amount as total')
        .first();

      return result ? parseFloat(result.total as string) : 0;
    } catch (error) {
      logger.error(`[AdminPaymentService] Failed to get total revenue: ${error}`);
      throw error;
    }
  }

  /**
   * Get pending payments count
   */
  async getPendingPaymentsCount(): Promise<number> {
    try {
      const result = await db('payments').where('status', 'pending').count('* as count').first();
      return result ? parseInt(result.count as string) : 0;
    } catch (error) {
      logger.error(`[AdminPaymentService] Failed to get pending payments count: ${error}`);
      throw error;
    }
  }

  /**
   * Get failed payments count
   */
  async getFailedPaymentsCount(): Promise<number> {
    try {
      const result = await db('payments').where('status', 'failed').count('* as count').first();
      return result ? parseInt(result.count as string) : 0;
    } catch (error) {
      logger.error(`[AdminPaymentService] Failed to get failed payments count: ${error}`);
      throw error;
    }
  }

  /**
   * Get successful payments count
   */
  async getSuccessfulPaymentsCount(): Promise<number> {
    try {
      const result = await db('payments').where('status', 'success').count('* as count').first();
      return result ? parseInt(result.count as string) : 0;
    } catch (error) {
      logger.error(`[AdminPaymentService] Failed to get successful payments count: ${error}`);
      throw error;
    }
  }

  /**
   * Get payments by status breakdown
   */
  async getPaymentsByStatus(): Promise<{ [status: string]: number }> {
    try {
      const results = await db('payments').select('status').count('* as count').groupBy('status');

      return results.reduce(
        (acc: { [status: string]: number }, row: any) => {
          acc[row.status as string] = parseInt(row.count as string);
          return acc;
        },
        {} as { [status: string]: number }
      );
    } catch (error) {
      logger.error(`[AdminPaymentService] Failed to get payments by status: ${error}`);
      throw error;
    }
  }

  /**
   * Get payments by purpose breakdown
   */
  async getPaymentsByPurpose(): Promise<{ [purpose: string]: number }> {
    try {
      const results = await db('payments').select('purpose').count('* as count').groupBy('purpose');

      return results.reduce(
        (acc: { [purpose: string]: number }, row: any) => {
          acc[row.purpose as string] = parseInt(row.count as string);
          return acc;
        },
        {} as { [purpose: string]: number }
      );
    } catch (error) {
      logger.error(`[AdminPaymentService] Failed to get payments by purpose: ${error}`);
      throw error;
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Map database record to Payment interface
   */
  private mapDbRecordToPayment(record: any): Payment {
    return {
      id: record.id,
      candidateId: record.candidate_id,
      rrr: record.rrr,
      purpose: record.purpose as PaymentPurposeName,
      amount: parseFloat(record.amount),
      session: record.session,
      status: record.status as PaymentStatus,
      paymentLevel: record.payment_level,
      paymentUrl: record.payment_url,
      webhookReceivedAt: record.webhook_received_at
        ? new Date(record.webhook_received_at)
        : undefined,
      verifiedAt: record.verified_at ? new Date(record.verified_at) : undefined,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  /**
   * Get start date from time range
   */
  private getStartDateFromTimeRange(timeRange: '7d' | '30d' | '90d' | '1y'): Date {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
