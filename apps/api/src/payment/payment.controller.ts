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

      // Get candidate ID from JAMB verification (email or JAMB registration number)
      // TODO: In the future, implement candidate authentication middleware for secure sessions
      let candidateId: string | null = null;

      // Try to get candidate ID from JAMB verification if email is provided
      if (requestData.email) {
        try {
          // Look up candidate by email (assuming email is unique)
          const candidate = await this.paymentService.getCandidateByEmail(requestData.email);
          if (candidate) {
            candidateId = candidate.id;
          } else {
            res.status(404).json({
              success: false,
              error: 'Candidate not found with the provided email address',
              timestamp: new Date(),
            });
            return;
          }
        } catch (error) {
          console.error('Error looking up candidate by email:', error);
          res.status(500).json({
            success: false,
            error: 'Failed to verify candidate',
            timestamp: new Date(),
          });
          return;
        }
      }

      // Look up candidate by JAMB registration number if provided
      if (requestData.jambRegNo) {
        try {
          const candidate = await this.paymentService.getCandidateByJambRegNo(
            requestData.jambRegNo
          );
          if (candidate) {
            candidateId = candidate.id;
          } else {
            res.status(404).json({
              success: false,
              error: 'Candidate not found with the provided JAMB registration number',
              timestamp: new Date(),
            });
            return;
          }
        } catch (error) {
          console.error('Error looking up candidate by JAMB registration number:', error);
          res.status(500).json({
            success: false,
            error: 'Failed to verify candidate',
            timestamp: new Date(),
          });
          return;
        }
      }

      // Validate that we have a candidate ID
      if (!candidateId) {
        res.status(400).json({
          success: false,
          error:
            'Candidate ID is required. Please provide either email or JAMB registration number.',
          timestamp: new Date(),
        });
        return;
      }

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

      // Create response using actual payment data from service
      const response = {
        success: true,
        data: {
          id: randomUUID(), // Generate new payment ID for response
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

  async getPaymentPurposes(req: Request, res: Response): Promise<void> {
    try {
      const { session } = req.query;

      if (!session || typeof session !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Session parameter is required',
          timestamp: new Date(),
        });
        return;
      }

      const paymentPurposes = await this.paymentService.getPaymentPurposes(session);

      res.status(200).json({
        success: true,
        data: paymentPurposes,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Payment purposes retrieval failed:', error);
      res.status(500).json({
        success: false,
        error: 'Payment purposes retrieval failed',
        timestamp: new Date(),
      });
    }
  }

  async getCandidatePaymentHistory(req: Request, res: Response): Promise<void> {
    try {
      const { candidateId } = req.params;
      const { session } = req.query;

      if (!candidateId) {
        res.status(400).json({
          success: false,
          error: 'Candidate ID is required',
          timestamp: new Date(),
        });
        return;
      }

      const paymentHistory = await this.paymentService.getCandidatePaymentHistory(
        candidateId,
        session as string
      );

      res.status(200).json({
        success: true,
        data: paymentHistory,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Payment history retrieval failed:', error);
      res.status(500).json({
        success: false,
        error: 'Payment history retrieval failed',
        timestamp: new Date(),
      });
    }
  }

  async getPaymentStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { session } = req.query;

      const statistics = await this.paymentService.getPaymentStatistics(session as string);

      res.status(200).json({
        success: true,
        data: statistics,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Payment statistics retrieval failed:', error);
      res.status(500).json({
        success: false,
        error: 'Payment statistics retrieval failed',
        timestamp: new Date(),
      });
    }
  }
}
