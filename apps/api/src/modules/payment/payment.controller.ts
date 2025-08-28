import { Request, Response } from 'express';

import { logger } from '../../middleware/logging.js';
import { PaymentService } from './payment.service.js';

export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  /**
   * Initialize payment and generate RRR
   */
  async initiatePayment(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId, purpose, session, email, phone } = req.body;

      const result = await this.paymentService.initiatePayment({
        candidateId,
        purpose,
        session,
        email,
        phone,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'Payment initiated successfully',
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentController] Failed to initiate payment: ${error}`);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate payment',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get payment purposes for a session
   */
  async getPaymentPurposes(req: Request, res: Response): Promise<void> {
    try {
      const { session } = req.query;
      const sessionParam = (session as string) || '2024/2025';

      const paymentPurposes = await this.paymentService.getPaymentPurposes(sessionParam);

      res.status(200).json({
        success: true,
        data: paymentPurposes,
        total: paymentPurposes.length,
        session: sessionParam,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentController] Failed to get payment purposes: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payment purposes',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get payment status by RRR
   */
  async getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      // For backward compatibility, treat paymentId as RRR
      const rrr = paymentId;

      const result = await this.paymentService.checkPaymentStatus(rrr);

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentController] Failed to get payment status: ${error}`);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment status',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Verify payment manually
   */
  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      // For backward compatibility, treat paymentId as RRR
      const rrr = paymentId;

      const result = await this.paymentService.checkPaymentStatus(rrr);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Payment verified successfully',
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentController] Failed to verify payment: ${error}`);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify payment',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Process Remita webhook
   */
  async processRemitaWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { signature } = req.headers;
      const webhookData = req.body;

      if (!signature || typeof signature !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Missing or invalid webhook signature',
          timestamp: new Date(),
        });
        return;
      }

      await this.paymentService.processWebhook(webhookData, signature);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentController] Failed to process webhook: ${error}`);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process webhook',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await this.paymentService.getPaymentStatistics();

      res.status(200).json({
        success: true,
        data: statistics,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentController] Failed to get payment statistics: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payment statistics',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get candidate payment history
   */
  async getCandidatePaymentHistory(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;
      const { page = '1', limit = '10' } = req.query;

      const result = await this.paymentService.getCandidatePaymentHistory(
        candidateId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentController] Failed to get candidate payment history: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve candidate payment history',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get payment receipt (placeholder for future implementation)
   */
  async getPaymentReceipt(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;

      // This is a placeholder - in a real implementation, you would generate a PDF receipt
      res.status(200).json({
        success: true,
        data: {
          paymentId,
          receiptUrl: `/receipts/${paymentId}.pdf`,
          message: 'Receipt generation not yet implemented',
        },
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentController] Failed to get payment receipt: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to generate payment receipt',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get provider status (placeholder for backward compatibility)
   */
  async getProviderStatus(req: Request, res: Response): Promise<void> {
    try {
      // Since we're now using only Remita, return a simple status
      res.status(200).json({
        success: true,
        data: {
          remita: {
            enabled: true,
            isPrimary: true,
            status: 'active',
          },
        },
        timestamp: new Date(),
      });
    } catch (error) {
      logger.error(`[PaymentController] Failed to get provider status: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get provider status',
        timestamp: new Date(),
      });
    }
  }
}
