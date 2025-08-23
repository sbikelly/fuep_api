import {
  IPaymentProvider,
  ProviderPaymentGatewayResponse,
  ProviderPaymentInitiationRequest,
} from '@fuep/types';

export class MockPaymentProvider implements IPaymentProvider {
  public readonly provider = 'remita' as const; // Use existing provider type for compatibility
  public readonly isEnabled = true;
  public readonly name = 'Mock Payment Provider';
  public readonly description = 'Mock provider for testing purposes';

  async initializePayment(
    request: ProviderPaymentInitiationRequest
  ): Promise<ProviderPaymentGatewayResponse> {
    // Simulate payment initialization delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    const mockReference = `MOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      provider: 'remita', // Use existing provider type for compatibility
      providerReference: mockReference,
      paymentUrl: `https://mock-payment.example.com/pay/${mockReference}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      metadata: {
        mockProvider: true,
        testMode: true,
        candidateId: request.candidateId,
        purpose: request.purpose,
        amount: request.amount,
        session: request.session,
      },
    };
  }

  async verifyPayment(providerReference: string): Promise<{
    success: boolean;
    status:
      | 'initiated'
      | 'pending'
      | 'processing'
      | 'success'
      | 'failed'
      | 'cancelled'
      | 'disputed'
      | 'refunded';
    amount: number;
    currency: string;
    providerReference: string;
    providerData: Record<string, any>;
    verifiedAt: Date;
    error?: string;
  }> {
    // Simulate verification delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Mock verification - always return success for testing
    return {
      success: true,
      status: 'success',
      amount: 5000, // Mock amount
      currency: 'NGN',
      providerReference,
      providerData: {
        mockProvider: true,
        testMode: true,
        verifiedAt: new Date(),
      },
      verifiedAt: new Date(),
    };
  }

  async processWebhook(payload: any): Promise<{
    success: boolean;
    paymentId?: string;
    status:
      | 'initiated'
      | 'pending'
      | 'processing'
      | 'success'
      | 'failed'
      | 'cancelled'
      | 'disputed'
      | 'refunded';
    providerReference: string;
    amount: number;
    currency: string;
    providerData: Record<string, any>;
    processedAt: Date;
    error?: string;
  }> {
    // Simulate webhook processing delay
    await new Promise((resolve) => setTimeout(resolve, 30));

    return {
      success: true,
      status: 'success',
      providerReference: payload.providerReference || `MOCK_${Date.now()}`,
      amount: payload.amount || 5000,
      currency: payload.currency || 'NGN',
      providerData: {
        mockProvider: true,
        testMode: true,
        webhookReceived: true,
        payload,
      },
      processedAt: new Date(),
    };
  }

  verifyWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
    // Mock signature verification - always return true for testing
    return true;
  }

  async getPaymentStatus(
    providerReference: string
  ): Promise<
    | 'initiated'
    | 'pending'
    | 'processing'
    | 'success'
    | 'failed'
    | 'cancelled'
    | 'disputed'
    | 'refunded'
  > {
    // Mock payment status check - always return success for testing
    return 'success';
  }
}
