import { db } from '../../db/knex.js';
import { AdminAuditService } from './admin-audit.service.js';

export interface PaymentPurpose {
  id: string;
  name: string;
  purpose: string;
  description?: string;
  amount: number;
  currency: string;
  category: 'academic' | 'administrative' | 'other';
  requiresVerification: boolean;
  isActive: boolean;
  session: string;
  dueDate?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentPurposeAmount {
  id: string;
  paymentPurposeId: string;
  session: string;
  amount: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  createdBy?: string;
  createdAt: Date;
}

export interface PaymentPurposeCreate {
  name: string;
  purpose: string;
  description?: string;
  amount: number;
  currency: string;
  category: 'academic' | 'administrative' | 'other';
  requiresVerification: boolean;
  session: string;
  dueDate?: Date;
}

export interface PaymentPurposeUpdate {
  name?: string;
  purpose?: string;
  description?: string;
  amount?: number;
  currency?: string;
  category?: 'academic' | 'administrative' | 'other';
  requiresVerification?: boolean;
  session?: string;
  dueDate?: Date;
  isActive?: boolean;
}

export interface Payment {
  id: string;
  candidateId: string;
  paymentPurposeId: string;
  amount: number;
  currency: string;
  status:
    | 'initiated'
    | 'pending'
    | 'processing'
    | 'success'
    | 'failed'
    | 'cancelled'
    | 'disputed'
    | 'refunded';
  paymentMethod: string;
  reference: string;
  externalReference?: string;
  gatewayResponse?: any;
  paidAt?: Date;
  verifiedAt?: Date;
  refundedAt?: Date;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentDispute {
  id: string;
  paymentId: string;
  candidateId: string;
  reason: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentReconciliationLog {
  id: string;
  adminUserId: string;
  action: 'verify' | 'refund' | 'dispute' | 'reconcile';
  paymentId: string;
  details: any;
  createdAt: Date;
}

export interface PaymentFilters {
  status?: string;
  paymentMethod?: string;
  startDate?: Date;
  endDate?: Date;
  candidateId?: string;
  paymentPurposeId?: string;
  minAmount?: number;
  maxAmount?: number;
}

export class AdminPaymentService {
  constructor(private auditService: AdminAuditService) {}

  // Payment Type Management
  async createPaymentPurpose(
    paymentPurposeData: {
      name: string;
      purpose: string;
      description?: string;
      amount: number;
      currency: string;
      category: PaymentPurpose['category'];
      requiresVerification: boolean;
      session: string;
      dueDate?: Date;
    },
    adminUserId: string
  ): Promise<PaymentPurpose> {
    try {
      const [paymentPurposeId] = await db('payment_purposes')
        .insert({
          name: paymentPurposeData.name,
          purpose: paymentPurposeData.purpose,
          description: paymentPurposeData.description,
          amount: paymentPurposeData.amount,
          currency: paymentPurposeData.currency,
          category: paymentPurposeData.category,
          requires_verification: paymentPurposeData.requiresVerification,
          session: paymentPurposeData.session,
          due_date: paymentPurposeData.dueDate,
          created_by: adminUserId,
        })
        .returning('id');

      // Extract the ID properly
      const id = typeof paymentPurposeId === 'object' ? paymentPurposeId.id : paymentPurposeId;

      // Create initial amount record
      await db('payment_purpose_amounts').insert({
        payment_purpose_id: id,
        amount: paymentPurposeData.amount,
        currency: paymentPurposeData.currency,
        session: paymentPurposeData.session,
        effective_from: new Date(),
        created_by: adminUserId,
      });

      // Log the action
      await this.auditService.logAction({
        adminUserId,
        action: 'create',
        resource: 'payment_purposes',
        resourceId: id,
        details: paymentPurposeData,
      });

      const createdPaymentPurpose = await this.getPaymentPurposeById(id);
      if (!createdPaymentPurpose) {
        throw new Error('Failed to retrieve created payment purpose');
      }

      return createdPaymentPurpose;
    } catch (error) {
      console.error('Error creating payment purpose:', error);
      throw error;
    }
  }

  async updatePaymentPurpose(
    id: string,
    updateData: Partial<
      Pick<
        PaymentPurpose,
        | 'name'
        | 'purpose'
        | 'description'
        | 'amount'
        | 'currency'
        | 'category'
        | 'requiresVerification'
        | 'session'
        | 'dueDate'
        | 'isActive'
      >
    >,
    adminUserId: string
  ): Promise<PaymentPurpose> {
    try {
      const currentPaymentPurpose = await this.getPaymentPurposeById(id);
      if (!currentPaymentPurpose) {
        throw new Error('Payment purpose not found');
      }

      // Update payment purpose
      await db('payment_purposes').where('id', id).update({
        name: updateData.name,
        purpose: updateData.purpose,
        description: updateData.description,
        amount: updateData.amount,
        currency: updateData.currency,
        category: updateData.category,
        requires_verification: updateData.requiresVerification,
        session: updateData.session,
        due_date: updateData.dueDate,
        is_active: updateData.isActive,
        updated_at: new Date(),
      });

      // If amount changed, create new amount record
      if (updateData.amount && updateData.amount !== currentPaymentPurpose.amount) {
        // First, set the effective_to date of the current active amount record
        await db('payment_purpose_amounts')
          .where({
            payment_purpose_id: id,
            session: updateData.session || currentPaymentPurpose.session,
            effective_to: null,
          })
          .update({
            effective_to: new Date(),
          });

        // Then create new amount record
        await db('payment_purpose_amounts').insert({
          payment_purpose_id: id,
          amount: updateData.amount,
          currency: updateData.currency || currentPaymentPurpose.currency,
          session: updateData.session || currentPaymentPurpose.session,
          effective_from: new Date(),
          created_by: adminUserId,
        });
      }

      // Log the action
      await this.auditService.logAction({
        adminUserId,
        action: 'update',
        resource: 'payment_purposes',
        resourceId: id,
        details: { previous: currentPaymentPurpose, updates: updateData },
      });

      const updatedPaymentPurpose = await this.getPaymentPurposeById(id);
      if (!updatedPaymentPurpose) {
        throw new Error('Failed to retrieve updated payment purpose');
      }

      return updatedPaymentPurpose;
    } catch (error) {
      console.error('Error updating payment purpose:', error);
      throw error;
    }
  }

  async getPaymentPurposeById(id: string): Promise<PaymentPurpose | null> {
    try {
      const paymentPurpose = await db('payment_purposes').where('id', id).first();

      if (!paymentPurpose) return null;

      return {
        id: paymentPurpose.id,
        name: paymentPurpose.name,
        purpose: paymentPurpose.purpose,
        description: paymentPurpose.description,
        amount: paymentPurpose.amount,
        currency: paymentPurpose.currency,
        category: paymentPurpose.category,
        requiresVerification: paymentPurpose.requires_verification,
        isActive: paymentPurpose.is_active,
        session: paymentPurpose.session,
        dueDate: paymentPurpose.due_date,
        createdBy: paymentPurpose.created_by,
        createdAt: paymentPurpose.created_at,
        updatedAt: paymentPurpose.updated_at,
      };
    } catch (error) {
      console.error('Error getting payment purpose by ID:', error);
      return null;
    }
  }

  async getAllPaymentPurposes(): Promise<PaymentPurpose[]> {
    try {
      const paymentPurposes = await db('payment_purposes').orderBy('name', 'asc');

      return paymentPurposes.map((pp) => ({
        id: pp.id,
        name: pp.name,
        purpose: pp.purpose,
        description: pp.description,
        amount: pp.amount,
        currency: pp.currency,
        category: pp.category,
        requiresVerification: pp.requires_verification,
        isActive: pp.is_active,
        session: pp.session,
        dueDate: pp.due_date,
        createdBy: pp.created_by,
        createdAt: pp.created_at,
        updatedAt: pp.updated_at,
      }));
    } catch (error) {
      console.error('Error getting all payment purposes:', error);
      return [];
    }
  }

  async getActivePaymentPurposes(): Promise<PaymentPurpose[]> {
    try {
      const paymentPurposes = await db('payment_purposes')
        .where('is_active', true)
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
        isActive: pp.is_active,
        session: pp.session,
        dueDate: pp.due_date,
        createdBy: pp.created_by,
        createdAt: pp.created_at,
        updatedAt: pp.updated_at,
      }));
    } catch (error) {
      console.error('Error getting active payment purposes:', error);
      return [];
    }
  }

  async deletePaymentPurpose(id: string, adminUserId: string): Promise<void> {
    try {
      const currentPaymentPurpose = await this.getPaymentPurposeById(id);
      if (!currentPaymentPurpose) {
        throw new Error('Payment purpose not found');
      }

      // Soft delete by setting is_active to false
      await db('payment_purposes').where('id', id).update({
        is_active: false,
        updated_at: new Date(),
      });

      // Log the action
      await this.auditService.logAction({
        adminUserId,
        action: 'delete',
        resource: 'payment_purposes',
        resourceId: id,
        details: { deleted: currentPaymentPurpose },
      });
    } catch (error) {
      console.error('Error deleting payment purpose:', error);
      throw error;
    }
  }

  // Payment Management
  async getPaymentById(id: string): Promise<Payment | null> {
    try {
      const payment = await db('payments').where('id', id).first();

      if (!payment) return null;

      return this.mapDbRecordToPayment(payment);
    } catch (error) {
      throw new Error(
        `Failed to get payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAllPayments(
    filters?: PaymentFilters,
    pagination?: { page: number; limit: number }
  ): Promise<{ payments: Payment[]; total: number }> {
    try {
      let query = db('payments');

      // Apply filters
      if (filters?.status) {
        query = query.where('status', filters.status);
      }

      if (filters?.paymentMethod) {
        query = query.where('payment_method', filters.paymentMethod);
      }

      if (filters?.startDate) {
        query = query.where('created_at', '>=', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.where('created_at', '<=', filters.endDate);
      }

      if (filters?.candidateId) {
        query = query.where('candidate_id', filters.candidateId);
      }

      if (filters?.paymentPurposeId) {
        query = query.where('payment_purpose_id', filters.paymentPurposeId);
      }

      if (filters?.minAmount !== undefined) {
        query = query.where('amount', '>=', filters.minAmount);
      }

      if (filters?.maxAmount !== undefined) {
        query = query.where('amount', '<=', filters.maxAmount);
      }

      // Get total count
      const totalResult = await query.clone().count('* as count').first();
      const total = totalResult ? parseInt(totalResult.count as string) : 0;

      // Apply pagination
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        query = query.offset(offset).limit(pagination.limit);
      }

      // Get payments
      const payments = await query.orderBy('created_at', 'desc');

      return {
        payments: payments.map((payment) => this.mapDbRecordToPayment(payment)),
        total,
      };
    } catch (error) {
      throw new Error(
        `Failed to get payments: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getPaymentsByMonth(
    timeRange: '7d' | '30d' | '90d' | '1y'
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
      throw new Error(
        `Failed to get payments by month: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Payment Verification and Reconciliation
  async verifyPayment(
    paymentId: string,
    adminUserId: string,
    verificationDetails: {
      isVerified: boolean;
      notes?: string;
      externalReference?: string;
    }
  ): Promise<Payment> {
    try {
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

      // Log reconciliation
      await this.logReconciliation(adminUserId, 'verify', paymentId, {
        isVerified: verificationDetails.isVerified,
        notes: verificationDetails.notes,
        externalReference: verificationDetails.externalReference,
      });

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'verify_payment',
        resource: 'payment',
        resourceId: paymentId,
        details: verificationDetails,
      });

      const verifiedPayment = await this.getPaymentById(paymentId);
      if (!verifiedPayment) {
        throw new Error('Failed to retrieve verified payment');
      }
      return verifiedPayment;
    } catch (error) {
      throw new Error(
        `Failed to verify payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async refundPayment(
    paymentId: string,
    adminUserId: string,
    refundDetails: {
      amount: number;
      reason: string;
      notes?: string;
    }
  ): Promise<Payment> {
    try {
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

      // Log reconciliation
      await this.logReconciliation(adminUserId, 'refund', paymentId, {
        amount: refundDetails.amount,
        reason: refundDetails.reason,
        notes: refundDetails.notes,
      });

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'refund_payment',
        resource: 'payment',
        resourceId: paymentId,
        details: refundDetails,
      });

      const refundedPayment = await this.getPaymentById(paymentId);
      if (!refundedPayment) {
        throw new Error('Failed to retrieve refunded payment');
      }
      return refundedPayment;
    } catch (error) {
      throw new Error(
        `Failed to refund payment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Payment Disputes
  async createPaymentDispute(
    paymentId: string,
    disputeData: {
      reason: string;
      description: string;
    },
    adminUserId: string
  ): Promise<PaymentDispute> {
    try {
      const payment = await this.getPaymentById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      const [disputeId] = await db('payment_disputes')
        .insert({
          payment_id: paymentId,
          candidate_id: payment.candidateId,
          reason: disputeData.reason,
          description: disputeData.description,
          status: 'open',
        })
        .returning('id');

      // Update payment status to disputed
      await db('payments').where('id', paymentId).update({
        status: 'disputed',
        updated_at: new Date(),
      });

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'create_payment_dispute',
        resource: 'payment_dispute',
        resourceId: disputeId,
        details: {
          paymentId,
          reason: disputeData.reason,
          description: disputeData.description,
        },
      });

      const createdDispute = await this.getPaymentDisputeById(disputeId);
      if (!createdDispute) {
        throw new Error('Failed to retrieve created payment dispute');
      }
      return createdDispute;
    } catch (error) {
      throw new Error(
        `Failed to create payment dispute: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async resolvePaymentDispute(
    disputeId: string,
    resolution: string,
    adminUserId: string
  ): Promise<PaymentDispute> {
    try {
      const dispute = await this.getPaymentDisputeById(disputeId);
      if (!dispute) {
        throw new Error('Dispute not found');
      }

      if (dispute.status !== 'open' && dispute.status !== 'under_review') {
        throw new Error('Dispute cannot be resolved in current status');
      }

      await db('payment_disputes').where('id', disputeId).update({
        status: 'resolved',
        resolution,
        resolved_by: adminUserId,
        resolved_at: new Date(),
        updated_at: new Date(),
      });

      // Log audit
      await this.auditService.logAction({
        adminUserId,
        action: 'resolve_payment_dispute',
        resource: 'payment_dispute',
        resourceId: disputeId,
        details: { resolution },
      });

      const resolvedDispute = await this.getPaymentDisputeById(disputeId);
      if (!resolvedDispute) {
        throw new Error('Failed to retrieve resolved payment dispute');
      }
      return resolvedDispute;
    } catch (error) {
      throw new Error(
        `Failed to resolve payment dispute: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getPaymentDisputeById(id: string): Promise<PaymentDispute | null> {
    try {
      const dispute = await db('payment_disputes').where('id', id).first();

      if (!dispute) return null;

      return {
        id: dispute.id,
        paymentId: dispute.payment_id,
        candidateId: dispute.candidate_id,
        reason: dispute.reason,
        description: dispute.description,
        status: dispute.status,
        resolution: dispute.resolution,
        resolvedBy: dispute.resolved_by,
        resolvedAt: dispute.resolved_at,
        createdAt: dispute.created_at,
        updatedAt: dispute.updated_at,
      };
    } catch (error) {
      throw new Error(
        `Failed to get payment dispute: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getAllPaymentDisputes(
    status?: string,
    pagination?: { page: number; limit: number }
  ): Promise<{ disputes: PaymentDispute[]; total: number }> {
    try {
      let query = db('payment_disputes');

      if (status) {
        query = query.where('status', status);
      }

      // Get total count
      const totalResult = await query.clone().count('* as count').first();
      const total = totalResult ? parseInt(totalResult.count as string) : 0;

      // Apply pagination
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        query = query.offset(offset).limit(pagination.limit);
      }

      // Get disputes
      const disputes = await query.orderBy('created_at', 'desc');

      return {
        disputes: disputes.map((dispute) => ({
          id: dispute.id,
          paymentId: dispute.payment_id,
          candidateId: dispute.candidate_id,
          reason: dispute.reason,
          description: dispute.description,
          status: dispute.status,
          resolution: dispute.resolution,
          resolvedBy: dispute.resolved_by,
          resolvedAt: dispute.resolved_at,
          createdAt: dispute.created_at,
          updatedAt: dispute.updated_at,
        })),
        total,
      };
    } catch (error) {
      throw new Error(
        `Failed to get payment disputes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Statistics and Analytics
  async getTotalPayments(): Promise<number> {
    try {
      const result = await db('payments').count('* as count').first();
      return result ? parseInt(result.count as string) : 0;
    } catch (error) {
      throw new Error(
        `Failed to get total payments: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getPaymentStatistics(): Promise<{
    totalAmount: number;
    totalSuccessful: number;
    totalPending: number;
    totalFailed: number;
    totalRefunded: number;
    totalDisputed: number;
    averageAmount: number;
    paymentsByMethod: { [method: string]: number };
    paymentsByStatus: { [status: string]: number };
  }> {
    try {
      const [
        totalAmount,
        totalSuccessful,
        totalPending,
        totalFailed,
        totalRefunded,
        totalDisputed,
        averageAmount,
        paymentsByMethod,
        paymentsByStatus,
      ] = await Promise.all([
        db('payments').sum('amount as total').first(),
        db('payments').where('status', 'success').count('* as count').first(),
        db('payments').where('status', 'pending').count('* as count').first(),
        db('payments').where('status', 'failed').count('* as count').first(),
        db('payments').where('status', 'refunded').count('* as count').first(),
        db('payments').where('status', 'disputed').count('* as count').first(),
        db('payments').avg('amount as avg').first(),
        db('payments').select('payment_method').count('* as count').groupBy('payment_method'),
        db('payments').select('status').count('* as count').groupBy('status'),
      ]);

      return {
        totalAmount: totalAmount ? parseFloat(totalAmount.total as string) : 0,
        totalSuccessful: totalSuccessful ? parseInt(totalSuccessful.count as string) : 0,
        totalPending: totalPending ? parseInt(totalPending.count as string) : 0,
        totalFailed: totalFailed ? parseInt(totalFailed.count as string) : 0,
        totalRefunded: totalRefunded ? parseInt(totalRefunded.count as string) : 0,
        totalDisputed: totalDisputed ? parseInt(totalDisputed.count as string) : 0,
        averageAmount: averageAmount ? parseFloat(averageAmount.avg as string) : 0,
        paymentsByMethod: paymentsByMethod.reduce(
          (acc: { [method: string]: number }, row) => {
            acc[row.payment_method as string] = parseInt(row.count as string);
            return acc;
          },
          {} as { [method: string]: number }
        ),
        paymentsByStatus: paymentsByStatus.reduce(
          (acc: { [status: string]: number }, row) => {
            acc[row.status as string] = parseInt(row.count as string);
            return acc;
          },
          {} as { [status: string]: number }
        ),
      };
    } catch (error) {
      throw new Error(
        `Failed to get payment statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Enhanced Analytics Methods
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
      throw new Error(
        `Failed to get total revenue: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getPendingPaymentsCount(): Promise<number> {
    try {
      const result = await db('payments').where('status', 'pending').count('* as count').first();

      return result ? parseInt(result.count as string) : 0;
    } catch (error) {
      throw new Error(
        `Failed to get pending payments count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getFailedPaymentsCount(): Promise<number> {
    try {
      const result = await db('payments').where('status', 'failed').count('* as count').first();

      return result ? parseInt(result.count as string) : 0;
    } catch (error) {
      throw new Error(
        `Failed to get failed payments count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getSuccessfulPaymentsCount(): Promise<number> {
    try {
      const result = await db('payments').where('status', 'success').count('* as count').first();

      return result ? parseInt(result.count as string) : 0;
    } catch (error) {
      throw new Error(
        `Failed to get successful payments count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

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

  // Private Helper Methods
  private mapDbRecordToPayment(record: any): Payment {
    return {
      id: record.id,
      candidateId: record.candidate_id,
      paymentPurposeId: record.payment_purpose_id,
      amount: record.amount,
      currency: record.currency,
      status: record.status,
      paymentMethod: record.payment_method,
      reference: record.reference,
      externalReference: record.external_reference,
      gatewayResponse: record.gateway_response,
      paidAt: record.paid_at,
      verifiedAt: record.verified_at,
      refundedAt: record.refunded_at,
      refundReason: record.refund_reason,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  private async logAmountChange(
    paymentPurposeId: string,
    amount: number,
    currency: string,
    reason: string,
    adminUserId: string
  ): Promise<void> {
    try {
      await db('payment_purpose_amounts').insert({
        payment_purpose_id: paymentPurposeId,
        amount,
        currency,
        effective_from: new Date(),
        reason,
        created_by: adminUserId,
      });
    } catch (error) {
      console.error('Failed to log amount change:', error);
    }
  }

  private async logReconciliation(
    adminUserId: string,
    action: string,
    paymentId: string,
    details: any
  ): Promise<void> {
    try {
      await db('payment_reconciliation_logs').insert({
        admin_user_id: adminUserId,
        action,
        payment_id: paymentId,
        details: JSON.stringify(details),
      });
    } catch (error) {
      console.error('Failed to log reconciliation:', error);
    }
  }
}
