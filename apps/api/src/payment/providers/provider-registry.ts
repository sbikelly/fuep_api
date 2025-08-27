import { IPaymentProvider, IPaymentProviderRegistry, PaymentProvider } from '@fuep/types';

import { RemitaPaymentProvider } from './remita.provider.js';

export class PaymentProviderRegistry implements IPaymentProviderRegistry {
  private providers = new Map<PaymentProvider, IPaymentProvider>();
  private primaryProvider: PaymentProvider | null = null;

  constructor() {
    try {
      console.log('[PaymentProviderRegistry] Constructor called');
      this.initializeProviders();
      console.log('[PaymentProviderRegistry] Initialization completed successfully');
    } catch (error) {
      console.error('[PaymentProviderRegistry] Error in constructor:', error);
      throw error;
    }
  }

  private initializeProviders(): void {
    try {
      console.log('[PaymentProviderRegistry] Initializing Remita payment provider...');
      console.log('[PaymentProviderRegistry] Environment check:');
      console.log('  - REMITA_PUBLIC_KEY:', process.env.REMITA_PUBLIC_KEY ? 'SET' : 'NOT SET');
      console.log('  - REMITA_SECRET_KEY:', process.env.REMITA_SECRET_KEY ? 'SET' : 'NOT SET');


      // Initialize Remita provider
      if (process.env.REMITA_PUBLIC_KEY && process.env.REMITA_SECRET_KEY) {
        console.log('[PaymentProviderRegistry] Creating Remita provider...');
        const remitaProvider = new RemitaPaymentProvider({
          publicKey: process.env.REMITA_PUBLIC_KEY,
          secretKey: process.env.REMITA_SECRET_KEY,
          webhookSecret: process.env.REMITA_WEBHOOK_SECRET || 'remita-webhook-secret',
          baseUrl: process.env.REMITA_BASE_URL || 'https://remitademo.net',
          sandboxMode: process.env.NODE_ENV !== 'production',
          merchantId: process.env.REMITA_MERCHANT_ID || '2547916',
        });

        this.registerProvider(remitaProvider);

        // Set Remita as primary if enabled
        if (remitaProvider.isEnabled) {
          this.primaryProvider = 'remita';
          console.log('[PaymentProviderRegistry] Remita set as primary provider');
        }
      } else {
        console.log('[PaymentProviderRegistry] Remita provider not created - missing credentials');
        throw new Error('Remita credentials are required for payment processing');
      }



      console.log(
        `[PaymentProviderRegistry] Payment providers initialized: ${Array.from(this.providers.keys()).join(', ')}`
      );
      console.log(`[PaymentProviderRegistry] Primary provider: ${this.primaryProvider}`);


    } catch (error) {
      console.error('[PaymentProviderRegistry] Error in initializeProviders:', error);
      throw error;
    }
  }

  registerProvider(provider: IPaymentProvider): void {
    this.providers.set(provider.provider, provider);

    // Set as primary if no primary is set and this provider is enabled
    if (!this.primaryProvider && provider.isEnabled) {
      this.primaryProvider = provider.provider;
    }
  }

  getProvider(provider: PaymentProvider): IPaymentProvider | null {
    return this.providers.get(provider) || null;
  }

  getPrimaryProvider(): IPaymentProvider | null {
    if (!this.primaryProvider) {
      return null;
    }
    return this.providers.get(this.primaryProvider) || null;
  }

  getAllProviders(): IPaymentProvider[] {
    return Array.from(this.providers.values());
  }

  getEnabledProviders(): IPaymentProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.isEnabled);
  }

  // Helper method to get a provider by preference order
  getProviderByPreference(preferences: PaymentProvider[]): IPaymentProvider | null {
    for (const preference of preferences) {
      const provider = this.providers.get(preference);
      if (provider && provider.isEnabled) {
        return provider;
      }
    }

    // Fallback to primary provider
    return this.getPrimaryProvider();
  }

  // Check if any providers are available
  hasAvailableProviders(): boolean {
    return this.getEnabledProviders().length > 0;
  }

  // Get provider status for health checks
  getProviderStatus(): Record<string, { enabled: boolean; isPrimary: boolean }> {
    const status: Record<string, { enabled: boolean; isPrimary: boolean }> = {};

    for (const [name, provider] of this.providers.entries()) {
      status[name] = {
        enabled: provider.isEnabled,
        isPrimary: name === this.primaryProvider,
      };
    }

    return status;
  }
}
