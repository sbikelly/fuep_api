import {
  IPaymentProvider,
  ProviderPaymentGatewayResponse,
  ProviderPaymentInitiationRequest,
  ProviderPaymentVerificationResult,
  ProviderWebhookProcessingResult,
} from '@fuep/types';
import { PaymentProvider, PaymentStatus } from '@fuep/types';
import { createHash, createHmac, timingSafeEqual } from 'crypto';

export class FlutterwavePaymentProvider implements IPaymentProvider {
  readonly provider: PaymentProvider = 'flutterwave';
  readonly isEnabled: boolean;

  private readonly publicKey: string;
  private readonly secretKey: string;
  private readonly webhookSecret: string;
  private readonly baseUrl: string;
  private readonly sandboxMode: boolean;

  constructor(config: {
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
    baseUrl: string;
    sandboxMode: boolean;
  }) {
    this.publicKey = config.publicKey;
    this.secretKey = config.secretKey;
    this.webhookSecret = config.webhookSecret;
    this.baseUrl = config.baseUrl;
    this.sandboxMode = config.sandboxMode;
    this.isEnabled = !!config.publicKey && !!config.secretKey;
  }

  async initializePayment(
    request: ProviderPaymentInitiationRequest
  ): Promise<ProviderPaymentGatewayResponse> {
    try {
      // Generate transaction reference
      const txRef = this.generateTxRef(request);

      // Create payment request
      const paymentRequest = {
        tx_ref: `${request.candidateId}_${request.purpose}_${Date.now()}`, // Use candidate and purpose for transaction reference
        amount: request.amount,
        currency: request.currency,
        redirect_url: `${process.env.PAYMENT_CALLBACK_URL || 'http://localhost:5173'}/payment/callback`,
        customer: {
          email: request.email || 'candidate@fuep.edu.ng',
          phone_number: request.phone || '08000000000',
          name: request.candidateId, // Will be replaced with actual candidate name
        },
        customizations: {
          title: 'FUEP Post-UTME Payment',
          description: `${request.purpose} Payment - ${request.session} Session`,
          logo: 'https://fuep.edu.ng/logo.png',
        },
        meta: {
          candidate_id: request.candidateId,
          purpose: request.purpose,
          session: request.session,
        },
      };

      // In a real implementation, this would make an HTTP request to Flutterwave
      // For now, we'll simulate the response
      const paymentUrl = `${this.baseUrl}/payments?tx_ref=${txRef}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      return {
        success: true,
        provider: this.provider,
        providerReference: txRef,
        paymentUrl,
        redirectUrl: paymentUrl,
        expiresAt,
        metadata: {
          paymentData: paymentRequest,
          txRef,
          publicKey: this.publicKey,
        },
      };
    } catch (error) {
      console.error('Flutterwave payment initialization failed:', error);
      throw new Error('Failed to initialize Flutterwave payment');
    }
  }

  async verifyPayment(providerReference: string): Promise<ProviderPaymentVerificationResult> {
    try {
      // In a real implementation, this would query Flutterwave's API
      // For now, we'll simulate verification
      const verificationData = await this.queryFlutterwaveStatus(providerReference);

      return {
        success: true,
        status: this.mapFlutterwaveStatus(verificationData.status),
        amount: verificationData.amount,
        currency: verificationData.currency || 'NGN',
        providerReference,
        providerData: verificationData,
        verifiedAt: new Date(),
      };
    } catch (error) {
      console.error('Flutterwave payment verification failed:', error);
      return {
        success: false,
        status: 'failed' as PaymentStatus,
        amount: 0,
        currency: 'NGN',
        providerReference,
        providerData: {},
        verifiedAt: new Date(),
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  verifyWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
    try {
      // Verify timestamp is not too old (within 5 minutes)
      const webhookTime = new Date(timestamp).getTime();
      const currentTime = Date.now();
      const timeDiff = Math.abs(currentTime - webhookTime);

      if (timeDiff > 5 * 60 * 1000) {
        // 5 minutes
        console.warn('Flutterwave webhook timestamp too old:', timestamp);
        return false;
      }

      // Generate expected signature
      const expectedSignature = this.generateWebhookSignature(payload, timestamp);

      // Compare signatures
      return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
    } catch (error) {
      console.error('Flutterwave webhook signature verification failed:', error);
      return false;
    }
  }

  async processWebhook(payload: any): Promise<ProviderWebhookProcessingResult> {
    try {
      // Validate webhook payload
      if (!payload.tx_ref || !payload.status || !payload.amount) {
        throw new Error('Invalid webhook payload');
      }

      // Map Flutterwave status to our status
      const status = this.mapFlutterwaveStatus(payload.status);

      return {
        success: true,
        status,
        providerReference: payload.tx_ref,
        amount: parseFloat(payload.amount),
        currency: payload.currency || 'NGN',
        providerData: payload,
        processedAt: new Date(),
      };
    } catch (error) {
      console.error('Flutterwave webhook processing failed:', error);
      return {
        success: false,
        status: 'failed' as PaymentStatus,
        providerReference: payload.tx_ref || 'unknown',
        amount: 0,
        currency: 'NGN',
        providerData: payload,
        processedAt: new Date(),
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      };
    }
  }

  async getPaymentStatus(providerReference: string): Promise<PaymentStatus> {
    try {
      const verificationResult = await this.verifyPayment(providerReference);
      return verificationResult.status;
    } catch (error) {
      console.error('Failed to get Flutterwave payment status:', error);
      return 'failed';
    }
  }

  private generateTxRef(request: ProviderPaymentInitiationRequest): string {
    // Generate a unique transaction reference based on candidate ID, purpose, and session
    const base = `${request.candidateId}_${request.purpose}_${request.session}`;
    const hash = createHash('sha256').update(base).digest('hex');
    return `FLW${hash.substring(0, 12).toUpperCase()}`;
  }

  private async queryFlutterwaveStatus(txRef: string): Promise<any> {
    // In a real implementation, this would query Flutterwave's API
    // For now, we'll simulate the response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'successful',
          amount: '2000.00',
          currency: 'NGN',
          flw_ref: `FLW${Date.now()}`,
          payment_type: 'card',
          customer: {
            email: 'candidate@fuep.edu.ng',
            name: 'Test Candidate',
            phone_number: '08000000000',
          },
        });
      }, 100);
    });
  }

  private mapFlutterwaveStatus(flutterwaveStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: 'pending',
      successful: 'success',
      failed: 'failed',
      cancelled: 'cancelled',
      processing: 'processing',
    };

    return statusMap[flutterwaveStatus.toLowerCase()] || 'pending';
  }

  private generateWebhookSignature(payload: string, timestamp: string): string {
    // Generate HMAC signature using webhook secret
    const data = `${payload}${timestamp}${this.webhookSecret}`;
    return createHmac('sha256', this.webhookSecret).update(data).digest('hex');
  }
}
