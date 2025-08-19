import {
  ApiResponse,
  PaymentInitiationRequestSchema,
  PaymentInitiationResponseSchema,
  PaymentReceiptResponse,
  PaymentStatusCheckRequestSchema,
  PaymentStatusCheckResponse,
} from '@fuep/types';
import { PaymentPurpose } from '@fuep/types';
import { randomBytes, randomUUID } from 'crypto';
import { Request, Response } from 'express';

import { PaymentService } from './payment.service.js';

export class PaymentController {
  private paymentService: PaymentService;

  constructor(paymentService: PaymentService) {
    console.log('[PaymentController] Constructor called');
    this.paymentService = paymentService;
    console.log('[PaymentController] Initialized with provided service');
  }

  async initiatePayment(req: Request, res: Response): Promise<void> {
    try {
      console.log('[PaymentController] Processing payment initiation');

      // Validate request
      const validationResult = PaymentInitiationRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors,
          timestamp: new Date(),
        });
        return;
      }

      const requestData = validationResult.data;

      // TODO: Get candidate ID from authenticated user or JAMB verification
      // For now, we'll use a mock candidate ID
      const candidateId = 'mock-candidate-id';

      // Initialize payment
      const paymentResponse = await this.paymentService.initializePayment({
        candidateId,
        purpose: requestData.purpose,
        amount: requestData.amount,
        currency: 'NGN',
        session: requestData.session,
        email: requestData.email,
        phone: requestData.phone,
      });

      // Create response
      const response = {
        success: true,
        data: {
          id: randomUUID(), // Mock payment ID
          candidateId,
          purpose: requestData.purpose,
          provider: paymentResponse.provider,
          providerRef: paymentResponse.providerReference,
          amount: requestData.amount,
          currency: 'NGN',
          status: 'initiated',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        paymentUrl: paymentResponse.paymentUrl,
        providerRef: paymentResponse.providerReference,
        expiresAt: paymentResponse.expiresAt.toISOString(),
        timestamp: new Date(),
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Payment initiation failed:', error);

      res.status(500).json({
        success: false,
        error: 'Payment initiation failed',
        timestamp: new Date(),
      });
    }
  }

  async getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;

      // Validate request
      const validationResult = PaymentStatusCheckRequestSchema.safeParse({ paymentId });
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid payment ID',
          details: validationResult.error.errors,
          timestamp: new Date(),
        });
        return;
      }

      // Get payment status
      const payment = await this.paymentService.getPaymentStatus(paymentId);
      if (!payment) {
        res.status(404).json({
          success: false,
          error: 'Payment not found',
          timestamp: new Date(),
        });
        return;
      }

      const response: PaymentStatusCheckResponse = {
        success: true,
        data: payment,
        message: `Payment status: ${payment.status}`,
        timestamp: new Date(),
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Payment status check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Payment status check failed',
        timestamp: new Date(),
      });
    }
  }

  async getPaymentReceipt(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;

      // Get payment
      const payment = await this.paymentService.getPaymentStatus(paymentId);
      if (!payment) {
        res.status(404).json({
          success: false,
          error: 'Payment not found',
          timestamp: new Date(),
        });
        return;
      }

      if (payment.status !== 'success') {
        res.status(400).json({
          success: false,
          error: 'Payment must be successful to generate receipt',
          timestamp: new Date(),
        });
        return;
      }

      // Generate receipt URL
      const receiptUrl = await this.paymentService.generateReceipt(paymentId);
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';

      const response: PaymentReceiptResponse = {
        success: true,
        data: {
          id: randomUUID(), // Mock receipt ID
          paymentId: payment.id,
          serial: `RCP${Date.now()}`,
          qrToken: `QR${randomBytes(16).toString('hex')}`,
          pdfUrl: receiptUrl,
          contentHash: randomBytes(32).toString('hex'),
          createdAt: new Date(),
        },
        downloadUrl: `${baseUrl}${receiptUrl}`,
        verificationUrl: `${baseUrl}/payments/${paymentId}`,
        timestamp: new Date(),
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Receipt generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Receipt generation failed',
        timestamp: new Date(),
      });
    }
  }

  async processRemitaWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-remita-signature'] as string;
      const timestamp = req.headers['x-remita-timestamp'] as string;

      if (!signature || !timestamp) {
        res.status(400).json({
          success: false,
          error: 'Missing signature or timestamp',
          timestamp: new Date(),
        });
        return;
      }

      // Process webhook
      await this.paymentService.processWebhook('remita', req.body, signature, timestamp);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Remita webhook processing failed:', error);
      res.status(400).json({
        success: false,
        error: 'Webhook processing failed',
        timestamp: new Date(),
      });
    }
  }

  async processFlutterwaveWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['verif-hash'] as string;
      const timestamp = req.headers['x-timestamp'] as string;

      if (!signature) {
        res.status(400).json({
          success: false,
          error: 'Missing signature',
          timestamp: new Date(),
        });
        return;
      }

      // Process webhook
      await this.paymentService.processWebhook(
        'flutterwave',
        req.body,
        signature,
        timestamp || new Date().toISOString()
      );

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Flutterwave webhook processing failed:', error);
      res.status(400).json({
        success: false,
        error: 'Webhook processing failed',
        timestamp: new Date(),
      });
    }
  }

  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;

      // Verify payment
      const payment = await this.paymentService.verifyPayment(paymentId);
      if (!payment) {
        res.status(404).json({
          success: false,
          error: 'Payment not found',
          timestamp: new Date(),
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: payment,
        message: 'Payment verified successfully',
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Payment verification failed:', error);
      res.status(500).json({
        success: false,
        error: 'Payment verification failed',
        timestamp: new Date(),
      });
    }
  }

  async getProviderStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = this.paymentService.getProviderStatus();

      res.status(200).json({
        success: true,
        data: status,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Provider status check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Provider status check failed',
        timestamp: new Date(),
      });
    }
  }
}
