import {
  IPaymentProvider,
  ProviderPaymentGatewayResponse,
  ProviderPaymentInitiationRequest,
  ProviderPaymentVerificationResult,
  ProviderWebhookProcessingResult,
} from '@fuep/types';
import { PaymentProvider, PaymentStatus } from '@fuep/types';
import { createHash, createHmac, timingSafeEqual } from 'crypto';

export class RemitaPaymentProvider implements IPaymentProvider {
  readonly provider: PaymentProvider = 'remita';
  readonly isEnabled: boolean;

  private readonly publicKey: string;
  private readonly secretKey: string;
  private readonly webhookSecret: string;
  private readonly baseUrl: string;
  private readonly sandboxMode: boolean;
  private readonly merchantId: string;

  constructor(config: {
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
    baseUrl: string;
    sandboxMode: boolean;
    merchantId: string;
  }) {
    this.publicKey = config.publicKey;
    this.secretKey = config.secretKey;
    this.webhookSecret = config.webhookSecret;
    this.baseUrl = config.baseUrl;
    this.sandboxMode = config.sandboxMode;
    this.merchantId = config.merchantId;
    this.isEnabled = !!config.publicKey && !!config.secretKey;
  }

  async initializePayment(
    request: ProviderPaymentInitiationRequest
  ): Promise<ProviderPaymentGatewayResponse> {
    try {
      // Generate RRR (Remita Retrieval Reference)
      const rrr = this.generateRRR(request);

      // Create payment order
      const orderData = {
        merchantId: this.merchantId,
        serviceTypeId: this.getServiceTypeId(request.purpose),
        amount: request.amount,
        orderId: request.idempotencyKey,
        payerName: `${request.candidateId}`, // Will be updated with actual name
        payerEmail: request.email || 'candidate@fuep.edu.ng',
        payerPhone: request.phone || '08000000000',
        description: `FUEP ${request.purpose} payment for ${request.session} session`,
        customFields: [
          { name: 'candidate_id', value: request.candidateId },
          { name: 'purpose', value: request.purpose },
          { name: 'session', value: request.session },
        ],
      };

      // In a real implementation, this would make an HTTP request to Remita
      // For now, we'll simulate the response
      const paymentUrl = `${this.baseUrl}/payment/${rrr}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      return {
        success: true,
        provider: this.provider,
        providerReference: rrr,
        paymentUrl,
        redirectUrl: paymentUrl,
        expiresAt,
        metadata: {
          orderData,
          rrr,
          merchantId: this.merchantId,
        },
      };
    } catch (error) {
      console.error('Remita payment initialization failed:', error);
      throw new Error('Failed to initialize Remita payment');
    }
  }

  async verifyPayment(providerReference: string): Promise<ProviderPaymentVerificationResult> {
    try {
      // In a real implementation, this would query Remita's API
      // For now, we'll simulate verification
      const verificationData = await this.queryRemitaStatus(providerReference);

      return {
        success: true,
        status: this.mapRemitaStatus(verificationData.status),
        amount: verificationData.amount,
        currency: verificationData.currency || 'NGN',
        providerReference,
        providerData: verificationData,
        verifiedAt: new Date(),
      };
    } catch (error) {
      console.error('Remita payment verification failed:', error);
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
        console.warn('Remita webhook timestamp too old:', timestamp);
        return false;
      }

      // Generate expected signature
      const expectedSignature = this.generateWebhookSignature(payload, timestamp);

      // Compare signatures
      return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
    } catch (error) {
      console.error('Remita webhook signature verification failed:', error);
      return false;
    }
  }

  async processWebhook(payload: any): Promise<ProviderWebhookProcessingResult> {
    try {
      // Validate webhook payload
      if (!payload.rrr || !payload.status || !payload.amount) {
        throw new Error('Invalid webhook payload');
      }

      // Map Remita status to our status
      const status = this.mapRemitaStatus(payload.status);

      return {
        success: true,
        status,
        providerReference: payload.rrr,
        amount: parseFloat(payload.amount),
        currency: payload.currency || 'NGN',
        providerData: payload,
        processedAt: new Date(),
      };
    } catch (error) {
      console.error('Remita webhook processing failed:', error);
      return {
        success: false,
        status: 'failed' as PaymentStatus,
        providerReference: payload.rrr || 'unknown',
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
      console.error('Failed to get Remita payment status:', error);
      return 'failed';
    }
  }

  private generateRRR(request: ProviderPaymentInitiationRequest): string {
    // Generate a unique RRR based on candidate ID, purpose, and session
    const base = `${request.candidateId}_${request.purpose}_${request.session}`;
    const hash = createHash('sha256').update(base).digest('hex');
    return `RRR${hash.substring(0, 12).toUpperCase()}`;
  }

  private getServiceTypeId(purpose: string): string {
    // Map payment purpose to Remita service type ID
    const serviceTypeMap: Record<string, string> = {
      post_utme: '4430731', // Example service type ID
      acceptance: '4430732',
      school_fee: '4430733',
    };

    return serviceTypeMap[purpose] || '4430731';
  }

  private async queryRemitaStatus(rrr: string): Promise<any> {
    // In a real implementation, this would query Remita's API
    // For now, we'll simulate the response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'success',
          amount: '2000.00',
          currency: 'NGN',
          transactionId: `TXN${Date.now()}`,
          paymentDate: new Date().toISOString(),
          channel: 'card',
        });
      }, 100);
    });
  }

  private mapRemitaStatus(remitaStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: 'pending',
      success: 'success',
      failed: 'failed',
      cancelled: 'cancelled',
      processing: 'processing',
    };

    return statusMap[remitaStatus.toLowerCase()] || 'pending';
  }

  private generateWebhookSignature(payload: string, timestamp: string): string {
    // Generate HMAC signature using webhook secret
    const data = `${payload}${timestamp}${this.webhookSecret}`;
    return createHmac('sha256', this.webhookSecret).update(data).digest('hex');
  }
}
