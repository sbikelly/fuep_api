import {
  PaymentPurpose,
  PaymentPurposeName,
  PaymentStatus,
  RemitaPaymentRequest,
  RemitaRRRResponse,
  RemitaStatusResponse,
} from '@fuep/types';

export class RemitaService {
  private readonly publicKey: string;
  private readonly secretKey: string;
  private readonly merchantId: string;
  private readonly baseUrl: string;
  private readonly webhookSecret: string;

  constructor() {
    this.publicKey = process.env.REMITA_PUBLIC_KEY || '';
    this.secretKey = process.env.REMITA_SECRET_KEY || '';
    this.merchantId = process.env.REMITA_MERCHANT_ID || '';
    this.baseUrl = process.env.REMITA_BASE_URL || 'https://remitademo.net';
    this.webhookSecret = process.env.REMITA_WEBHOOK_SECRET || '';

    if (!this.publicKey || !this.secretKey || !this.merchantId) {
      throw new Error('Remita configuration is incomplete. Please check environment variables.');
    }
  }

  /**
   * Generate RRR (Remita Retrieval Reference) for payment
   */
  async generateRRR(request: RemitaPaymentRequest): Promise<string> {
    try {
      const payload = {
        merchantId: this.merchantId,
        serviceTypeId: this.getServiceTypeId(request.purpose),
        amount: request.purpose.amount,
        orderId: `${request.userId}_${request.userName}_${Date.now()}`,
        payerName: request.userName,
        payerEmail: request.email,
        payerPhone: request.phone,
        description: `FUEP ${request.purpose.purpose} Payment - ${request.purpose.session}`,
        returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success`,
        onCloseUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancelled`,
        customFields: [
          {
            name: 'Registration Number',
            value: request.registrationNumber,
            type: 'String',
          },
          {
            name: 'Purpose',
            value: request.purpose.purpose,
            type: 'String',
          },
          {
            name: 'Session',
            value: request.purpose.session,
            type: 'String',
          },
          {
            name: 'Level',
            value: request.purpose.level,
            type: 'String',
          },
        ],
      };

      console.log('[RemitaService] Generating RRR with payload:', payload);

      const response = await fetch(
        `${this.baseUrl}/v1/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.publicKey}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Remita API error: ${response.status} ${response.statusText}`);
      }

      const result: RemitaRRRResponse = await response.json();
      console.log('[RemitaService] RRR generation response:', result);

      if (result.statuscode !== '00' || !result.rrr) {
        throw new Error(`Failed to generate RRR: ${result.message}`);
      }

      return result.rrr;
    } catch (error) {
      console.error('[RemitaService] RRR generation failed:', error);
      throw new Error(
        `Failed to generate RRR: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get payment status from Remita
   */
  async getPaymentStatus(rrr: string): Promise<PaymentStatus> {
    try {
      console.log('[RemitaService] Checking payment status for RRR:', rrr);

      const response = await fetch(
        `${this.baseUrl}/v1/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentstatus`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.publicKey}`,
          },
          body: JSON.stringify({ rrr }),
        }
      );

      if (!response.ok) {
        throw new Error(`Remita API error: ${response.status} ${response.statusText}`);
      }

      const result: RemitaStatusResponse = await response.json();
      console.log('[RemitaService] Payment status response:', result);

      if (result.statuscode !== '00') {
        throw new Error(`Failed to get payment status: ${result.message}`);
      }

      return this.mapRemitaStatus(result.status);
    } catch (error) {
      console.error('[RemitaService] Payment status check failed:', error);
      throw new Error(
        `Failed to check payment status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify webhook signature from Remita
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = this.generateWebhookSignature(payload);
      return signature === expectedSignature;
    } catch (error) {
      console.error('[RemitaService] Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Generate webhook signature for verification
   */
  private generateWebhookSignature(payload: string): string {
    const crypto = require('crypto');
    return crypto.createHmac('sha512', this.webhookSecret).update(payload).digest('hex');
  }

  /**
   * Map Remita status to internal payment status types
   */
  private mapRemitaStatus(remitaStatus: string): PaymentStatus {
    const status = remitaStatus.toLowerCase();

    switch (status) {
      case 'success':
      case 'completed':
      case '00':
        return 'success';
      case 'pending':
      case '01':
        return 'pending';
      case 'failed':
      case '02':
        return 'failed';
      case 'cancelled':
      case '03':
        return 'cancelled';
      case 'processing':
      case '04':
        return 'processing';
      default:
        console.warn(
          `[RemitaService] Unknown Remita status: ${remitaStatus}, defaulting to pending`
        );
        return 'pending';
    }
  }

  /**
   * Get Remita service type ID based on payment purpose
   */
  private getServiceTypeId(purpose: PaymentPurpose): string {
    // These are example service type IDs - you'll need to get the actual ones from Remita
    const serviceTypeMap: Record<PaymentPurposeName, string> = {
      POST_UTME: '4430731',
      ACCEPTANCE: '4430732',
      SCHOOL_FEES: '4430733',
      SPILL_OVER: '4430734',
      TEACHING_PRACTICE: '4430735',
      LIBRARY_FEE: '4430736',
      HOSTEL_FEE: '4430737',
      MEDICAL_FEE: '4430738',
      SPORTS_FEE: '4430739',
      other: '4430740',
    };

    return serviceTypeMap[purpose.name] || '4430738';
  }

  /**
   * Get payment URL for a given RRR
   */
  getPaymentUrl(rrr: string): string {
    return `${this.baseUrl}/payment/${rrr}`;
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.publicKey && this.secretKey && this.merchantId && this.baseUrl);
  }
}
