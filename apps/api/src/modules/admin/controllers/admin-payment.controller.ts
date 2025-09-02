import {
  PaymentPurpose,
  PaymentPurposeCategory,
  PaymentPurposeName,
  PaymentStatus,
} from '@fuep/types';
import { Request, Response } from 'express';

import { logger } from '../../../middleware/logging.js';
import { AdminAuditService } from '../services/admin-audit.service.js';
import { AdminPaymentService } from '../services/admin-payment.service.js';

export class AdminPaymentController {
  private adminPaymentService: AdminPaymentService;

  constructor() {
    const auditService = new AdminAuditService();
    this.adminPaymentService = new AdminPaymentService(auditService);
  }

  // ============================================
  // Payment Purpose Management
  // ============================================

  /**
   * Create a new payment purpose
   * POST /admin/payment-purposes
   */
  async createPaymentPurpose(req: Request, res: Response): Promise<void> {
    try {
      const { name, purpose, description, amount, session, level, category } = req.body;

      // Validate required fields
      if (!name || !purpose || !amount || !session || !level) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: name, purpose, amount, session, level',
        });
        return;
      }

      const paymentPurpose = await this.adminPaymentService.createPaymentPurpose(
        {
          name,
          purpose,
          description,
          amount,
          session,
          level,
          category,
        },
        'admin-user-id' // Placeholder for now
      );

      res.status(201).json({
        success: true,
        message: 'Payment purpose created successfully',
        data: paymentPurpose,
      });
    } catch (error) {
      logger.error(`[AdminPaymentController] Failed to create payment purpose: ${error}`);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Get all payment purposes with optional filtering
   * GET /admin/payment-purposes
   */
  async getPaymentPurposes(req: Request, res: Response): Promise<void> {
    try {
      const { session, purpose, level, category, isActive } = req.query;

      const filters: {
        session?: string;
        purpose?: PaymentPurposeName;
        level?: string;
        category?: PaymentPurposeCategory;
        isActive?: boolean;
      } = {};

      if (session) filters.session = session as string;
      if (purpose) filters.purpose = purpose as PaymentPurposeName;
      if (level) filters.level = level as string;
      if (category) filters.category = category as PaymentPurposeCategory;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const paymentPurposes = await this.adminPaymentService.getPaymentPurposes(filters);

      res.status(200).json({
        success: true,
        message: 'Payment purposes retrieved successfully',
        data: paymentPurposes,
        total: paymentPurposes.length,
      });
    } catch (error) {
      logger.error(`[AdminPaymentController] Failed to get payment purposes: ${error}`);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Get payment purpose by ID
   * GET /admin/payment-purposes/:id
   */
  async getPaymentPurposeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const paymentPurpose = await this.adminPaymentService.getPaymentPurposeById(id);

      if (!paymentPurpose) {
        res.status(404).json({
          success: false,
          message: 'Payment purpose not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Payment purpose retrieved successfully',
        data: paymentPurpose,
      });
    } catch (error) {
      logger.error(`[AdminPaymentController] Failed to get payment purpose: ${error}`);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Update payment purpose
   * PUT /admin/payment-purposes/:id
   */
  async updatePaymentPurpose(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const paymentPurpose = await this.adminPaymentService.updatePaymentPurpose(
        id,
        updates,
        'admin-user-id' // Placeholder for now
      );

      res.status(200).json({
        success: true,
        message: 'Payment purpose updated successfully',
        data: paymentPurpose,
      });
    } catch (error) {
      logger.error(`[AdminPaymentController] Failed to update payment purpose: ${error}`);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Delete payment purpose (soft delete)
   * DELETE /admin/payment-purposes/:id
   */
  async deletePaymentPurpose(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.adminPaymentService.deletePaymentPurpose(id, 'admin-user-id'); // Placeholder for now

      res.status(200).json({
        success: true,
        message: 'Payment purpose deleted successfully',
      });
    } catch (error) {
      logger.error(`[AdminPaymentController] Failed to delete payment purpose: ${error}`);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Get payment purpose statistics
   * GET /admin/payment-purposes/stats
   */
  async getPaymentPurposeStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.adminPaymentService.getPaymentPurposeStatistics();

      res.status(200).json({
        success: true,
        message: 'Payment purpose statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      logger.error(`[AdminPaymentController] Failed to get payment purpose statistics: ${error}`);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  // ============================================
  // Payment Management
  // ============================================

  /**
   * Get all payments with filtering and pagination
   * GET /admin/payments
   */
  async getAllPayments(req: Request, res: Response): Promise<void> {
    try {
      const {
        status,
        purpose,
        session,
        level,
        category,
        startDate,
        endDate,
        candidateId,
        minAmount,
        maxAmount,
        page = '1',
        limit = '10',
      } = req.query;

      const filters: {
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
      } = {};

      if (status) filters.status = status as PaymentStatus;
      if (purpose) filters.purpose = purpose as PaymentPurposeName;
      if (session) filters.session = session as string;
      if (level) filters.level = level as string;
      if (category) filters.category = category as PaymentPurposeCategory;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (candidateId) filters.candidateId = candidateId as string;
      if (minAmount) filters.minAmount = parseFloat(minAmount as string);
      if (maxAmount) filters.maxAmount = parseFloat(maxAmount as string);

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await this.adminPaymentService.getAllPayments(filters, pagination);

      res.status(200).json({
        success: true,
        message: 'Payments retrieved successfully',
        data: result.payments,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / pagination.limit),
        },
      });
    } catch (error) {
      logger.error(`[AdminPaymentController] Failed to get payments: ${error}`);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Get payment by ID
   * GET /admin/payments/:id
   */
  async getPaymentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const payment = await this.adminPaymentService.getPaymentById(id);

      if (!payment) {
        res.status(404).json({
          success: false,
          message: 'Payment not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Payment retrieved successfully',
        data: payment,
      });
    } catch (error) {
      logger.error(`[AdminPaymentController] Failed to get payment: ${error}`);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Verify payment
   * POST /admin/payments/:id/verify
   */
  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isVerified, notes, externalReference } = req.body;

      if (typeof isVerified !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'isVerified field is required and must be a boolean',
        });
        return;
      }

      const payment = await this.adminPaymentService.verifyPayment(
        id,
        'admin-user-id', // Placeholder for now
        {
          isVerified,
          notes,
          externalReference,
        }
      );

      res.status(200).json({
        success: true,
        message: `Payment ${isVerified ? 'verified' : 'unverified'} successfully`,
        data: payment,
      });
    } catch (error) {
      logger.error(`[AdminPaymentController] Failed to verify payment: ${error}`);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Refund payment
   * POST /admin/payments/:id/refund
   */
  async refundPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { amount, reason, notes } = req.body;

      if (!amount || !reason) {
        res.status(400).json({
          success: false,
          message: 'amount and reason fields are required',
        });
        return;
      }

      const payment = await this.adminPaymentService.refundPayment(
        id,
        'admin-user-id', // Placeholder for now
        {
          amount: parseFloat(amount),
          reason,
          notes,
        }
      );

      res.status(200).json({
        success: true,
        message: 'Payment refunded successfully',
        data: payment,
      });
    } catch (error) {
      logger.error(`[AdminPaymentController] Failed to refund payment: ${error}`);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  // ============================================
  // Analytics and Statistics
  // ============================================

  /**
   * Get payment statistics
   * GET /admin/payments/stats
   */
  async getPaymentStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.adminPaymentService.getPaymentStatistics();

      res.status(200).json({
        success: true,
        message: 'Payment statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      logger.error(`[AdminPaymentController] Failed to get payment statistics: ${error}`);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Get payments by month for analytics
   * GET /admin/payments/analytics/monthly
   */
  async getPaymentsByMonth(req: Request, res: Response): Promise<void> {
    try {
      const { timeRange = '30d' } = req.query;

      const monthlyData = await this.adminPaymentService.getPaymentsByMonth(
        timeRange as '7d' | '30d' | '90d' | '1y'
      );

      res.status(200).json({
        success: true,
        message: 'Monthly payment analytics retrieved successfully',
        data: monthlyData,
        timeRange,
      });
    } catch (error) {
      logger.error(`[AdminPaymentController] Failed to get monthly payments: ${error}`);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Get total revenue for a time range
   * GET /admin/payments/analytics/revenue
   */
  async getTotalRevenue(req: Request, res: Response): Promise<void> {
    try {
      const { timeRange = '30d' } = req.query;

      const revenue = await this.adminPaymentService.getTotalRevenue(
        timeRange as '7d' | '30d' | '90d' | '1y'
      );

      res.status(200).json({
        success: true,
        message: 'Total revenue retrieved successfully',
        data: { revenue, timeRange },
      });
    } catch (error) {
      logger.error(`[AdminPaymentController] Failed to get total revenue: ${error}`);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Get payment counts by status
   * GET /admin/payments/analytics/counts
   */
  async getPaymentCounts(req: Request, res: Response): Promise<void> {
    try {
      const [pending, failed, successful] = await Promise.all([
        this.adminPaymentService.getPendingPaymentsCount(),
        this.adminPaymentService.getFailedPaymentsCount(),
        this.adminPaymentService.getSuccessfulPaymentsCount(),
      ]);

      res.status(200).json({
        success: true,
        message: 'Payment counts retrieved successfully',
        data: {
          pending,
          failed,
          successful,
        },
      });
    } catch (error) {
      logger.error(`[AdminPaymentController] Failed to get payment counts: ${error}`);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Get payments breakdown by status
   * GET /admin/payments/analytics/by-status
   */
  async getPaymentsByStatus(req: Request, res: Response): Promise<void> {
    try {
      const breakdown = await this.adminPaymentService.getPaymentsByStatus();

      res.status(200).json({
        success: true,
        message: 'Payments by status breakdown retrieved successfully',
        data: breakdown,
      });
    } catch (error) {
      logger.error(`[AdminPaymentController] Failed to get payments by status: ${error}`);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  /**
   * Get payments breakdown by purpose
   * GET /admin/payments/analytics/by-purpose
   */
  async getPaymentsByPurpose(req: Request, res: Response): Promise<void> {
    try {
      const breakdown = await this.adminPaymentService.getPaymentsByPurpose();

      res.status(200).json({
        success: true,
        message: 'Payments by purpose breakdown retrieved successfully',
        data: breakdown,
      });
    } catch (error) {
      logger.error(`[AdminPaymentController] Failed to get payments by purpose: ${error}`);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
}
