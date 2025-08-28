import { Request, Response } from 'express';

import { logger } from '../../../middleware/logging.js';
import {
  CreatePaymentPurposeRequest,
  PaymentPurposeService,
  UpdatePaymentPurposeRequest,
} from '../services/payment-purpose.service.js';

export class PaymentPurposeController {
  constructor(private paymentPurposeService: PaymentPurposeService) {}

  /**
   * Create a new payment purpose
   */
  async createPaymentPurpose(req: Request, res: Response): Promise<void> {
    try {
      const { name, purpose, description, amount, session, level } = req.body;

      /**
       * const createdBy = (req as any).user?.id;

      if (!createdBy) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated',
          timestamp: new Date(),
        });
        return;
      }
       */

      // TEMPORARILY DISABLED FOR TESTING - Use real admin user ID
      const createdBy = (req as any).user?.id || '63d52b0e-359d-47f3-8842-f03e150ecc13';

      const request: CreatePaymentPurposeRequest = {
        name,
        purpose,
        description,
        amount: parseFloat(amount),
        session,
        level,
        createdBy,
      };

      const paymentPurpose = await this.paymentPurposeService.createPaymentPurpose(request);

      res.status(201).json({
        success: true,
        data: paymentPurpose,
        message: 'Payment purpose created successfully',
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentPurposeController] Failed to create payment purpose: ${error}`);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment purpose',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get all payment purposes with optional filtering
   */
  async getPaymentPurposes(req: Request, res: Response): Promise<void> {
    try {
      const { session, purpose, level, isActive } = req.query;

      const filters: any = {};
      if (session) filters.session = session as string;
      if (purpose) filters.purpose = purpose as string;
      if (level) filters.level = level as string;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const paymentPurposes = await this.paymentPurposeService.getPaymentPurposes(filters);

      res.status(200).json({
        success: true,
        data: paymentPurposes,
        total: paymentPurposes.length,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentPurposeController] Failed to get payment purposes: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payment purposes',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get payment purpose by ID
   */
  async getPaymentPurposeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const paymentPurpose = await this.paymentPurposeService.getPaymentPurposeById(id);

      if (!paymentPurpose) {
        res.status(404).json({
          success: false,
          error: 'Payment purpose not found',
          timestamp: new Date(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: paymentPurpose,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentPurposeController] Failed to get payment purpose by ID: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payment purpose',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get payment purpose by session, purpose, and level
   */
  async getPaymentPurposeByKey(req: Request, res: Response): Promise<void> {
    try {
      const { session, purpose, level } = req.params;

      const paymentPurpose = await this.paymentPurposeService.getPaymentPurposeByKey(
        session,
        purpose as any,
        level
      );

      if (!paymentPurpose) {
        res.status(404).json({
          success: false,
          error: 'Payment purpose not found',
          timestamp: new Date(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: paymentPurpose,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentPurposeController] Failed to get payment purpose by key: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payment purpose',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Update payment purpose
   */
  async updatePaymentPurpose(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdatePaymentPurposeRequest = req.body;

      const paymentPurpose = await this.paymentPurposeService.updatePaymentPurpose(id, updates);

      res.status(200).json({
        success: true,
        data: paymentPurpose,
        message: 'Payment purpose updated successfully',
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentPurposeController] Failed to update payment purpose: ${error}`);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update payment purpose',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Delete payment purpose
   */
  async deletePaymentPurpose(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await this.paymentPurposeService.deletePaymentPurpose(id);

      res.status(200).json({
        success: true,
        message: 'Payment purpose deleted successfully',
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentPurposeController] Failed to delete payment purpose: ${error}`);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete payment purpose',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get payment purposes by session
   */
  async getPaymentPurposesBySession(req: Request, res: Response): Promise<void> {
    try {
      const { session } = req.params;

      const paymentPurposes = await this.paymentPurposeService.getPaymentPurposesBySession(session);

      res.status(200).json({
        success: true,
        data: paymentPurposes,
        total: paymentPurposes.length,
        session,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(
        `[PaymentPurposeController] Failed to get payment purposes by session: ${error}`
      );
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payment purposes by session',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get payment purposes by level
   */
  async getPaymentPurposesByLevel(req: Request, res: Response): Promise<void> {
    try {
      const { level } = req.params;

      const paymentPurposes = await this.paymentPurposeService.getPaymentPurposesByLevel(level);

      res.status(200).json({
        success: true,
        data: paymentPurposes,
        total: paymentPurposes.length,
        level,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentPurposeController] Failed to get payment purposes by level: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payment purposes by level',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get payment purposes by purpose type
   */
  async getPaymentPurposesByPurpose(req: Request, res: Response): Promise<void> {
    try {
      const { purpose } = req.params;

      const paymentPurposes = await this.paymentPurposeService.getPaymentPurposesByPurpose(
        purpose as any
      );

      res.status(200).json({
        success: true,
        data: paymentPurposes,
        total: paymentPurposes.length,
        purpose,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(
        `[PaymentPurposeController] Failed to get payment purposes by purpose: ${error}`
      );
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payment purposes by purpose',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Toggle payment purpose active status
   */
  async togglePaymentPurposeStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const paymentPurpose = await this.paymentPurposeService.togglePaymentPurposeStatus(id);

      res.status(200).json({
        success: true,
        data: paymentPurpose,
        message: `Payment purpose ${paymentPurpose.isActive ? 'activated' : 'deactivated'} successfully`,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentPurposeController] Failed to toggle payment purpose status: ${error}`);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle payment purpose status',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get payment purpose statistics
   */
  async getPaymentPurposeStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await this.paymentPurposeService.getPaymentPurposeStatistics();

      res.status(200).json({
        success: true,
        data: statistics,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentPurposeController] Failed to get payment purpose statistics: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payment purpose statistics',
        timestamp: new Date(),
      });
    }
  }
}
