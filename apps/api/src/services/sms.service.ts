import { logger } from '../middleware/logging.js';

export interface SMSOptions {
  to: string;
  message: string;
  from?: string;
}

export class SMSService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || 'IMRPspVHZ0JFUNCy';
    this.baseUrl = 'https://api.brevo.com/v3';
  }

  /**
   * Send SMS notification to candidate
   */
  async sendSMS(to: string, message: string, from: string = 'FUEP'): Promise<boolean> {
    try {
      // Format phone number to include country code if not present
      let formattedPhone = to;
      if (!to.startsWith('+')) {
        // Assume Nigerian number if no country code
        formattedPhone = `+234${to.replace(/^0/, '')}`;
      }

      // Brevo SMS API endpoint - using the correct v3 endpoint
      const response = await fetch(`${this.baseUrl}/transactionalSMS/sms`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          recipient: formattedPhone,
          content: message,
          sender: from,
          webUrl: 'https://fuep.edu.ng',
          tag: 'candidate_registration',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('Brevo SMS API error details', {
          module: 'sms',
          operation: 'sendSMS',
          metadata: {
            status: response.status,
            statusText: response.statusText,
            errorData,
            requestBody: {
              recipient: formattedPhone,
              content: message,
              sender: from,
              webUrl: 'https://fuep.edu.ng',
              tag: 'candidate_registration',
            },
          },
        });
        throw new Error(
          `Brevo SMS API error: ${errorData.message || response.statusText} (Status: ${response.status})`
        );
      }

      const result = await response.json();

      logger.info('SMS sent successfully', {
        module: 'sms',
        operation: 'sendSMS',
        metadata: { to, from, messageId: result.messageId },
      });

      return true;
    } catch (error) {
      logger.error('Failed to send SMS', {
        module: 'sms',
        operation: 'sendSMS',
        metadata: { to, from, message },
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Send temporary password SMS to candidate
   */
  async sendTemporaryPasswordSMS(
    to: string,
    jambRegNo: string,
    temporaryPassword: string,
    candidateName: string
  ): Promise<boolean> {
    const message = `Hello ${candidateName}, your FUEP Post-UTME login credentials: Username: ${jambRegNo}, Password: ${temporaryPassword}. Change password after first login. Portal: https://fuep.edu.ng`;

    return this.sendSMS(to, message, 'FUEP');
  }

  /**
   * Send registration completion SMS
   */
  async sendRegistrationCompletionSMS(
    to: string,
    candidateName: string,
    jambRegNo: string
  ): Promise<boolean> {
    const message = `Congratulations ${candidateName}! Your FUEP Post-UTME registration is complete. JAMB: ${jambRegNo}. Check your email for further instructions.`;

    return this.sendSMS(to, message, 'FUEP');
  }

  /**
   * Send payment confirmation SMS
   */
  async sendPaymentConfirmationSMS(
    to: string,
    candidateName: string,
    paymentDetails: {
      amount: number;
      purpose: string;
      reference: string;
    }
  ): Promise<boolean> {
    const message = `Payment confirmed ${candidateName}! Amount: ₦${paymentDetails.amount}, Purpose: ${paymentDetails.purpose}, Ref: ${paymentDetails.reference}. Thank you!`;

    return this.sendSMS(to, message, 'FUEP');
  }
}
