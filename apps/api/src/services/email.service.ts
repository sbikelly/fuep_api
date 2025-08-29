import nodemailer from 'nodemailer';

import { logger } from '../middleware/logging.js';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter (using MailHog for development)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'fuep_mailhog',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: false, // true for 465, false for other ports
      // No auth configuration for MailHog
    });
  }

  /**
   * Send email with temporary password to candidate
   */
  async sendTemporaryPassword(
    to: string,
    jambRegNo: string,
    temporaryPassword: string,
    candidateName: string
  ): Promise<boolean> {
    try {
      const template = this.generateTemporaryPasswordTemplate(
        jambRegNo,
        temporaryPassword,
        candidateName
      );

      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@fuep.edu.ng',
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info('Temporary password email sent successfully', {
        module: 'email',
        operation: 'sendTemporaryPassword',
        metadata: { to, jambRegNo, candidateName },
      });

      return true;
    } catch (error) {
      logger.error('Failed to send temporary password email', {
        module: 'email',
        operation: 'sendTemporaryPassword',
        metadata: { to, jambRegNo, candidateName },
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Send registration completion email
   */
  async sendRegistrationCompletion(
    to: string,
    candidateName: string,
    jambRegNo: string
  ): Promise<boolean> {
    try {
      const template = this.generateRegistrationCompletionTemplate(candidateName, jambRegNo);

      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@fuep.edu.ng',
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info('Registration completion email sent successfully', {
        module: 'email',
        operation: 'sendRegistrationCompletion',
        metadata: { to, jambRegNo, candidateName },
      });

      return true;
    } catch (error) {
      logger.error('Failed to send registration completion email', {
        module: 'email',
        operation: 'sendRegistrationCompletion',
        metadata: { to, jambRegNo, candidateName },
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(
    to: string,
    candidateName: string,
    paymentDetails: {
      amount: number;
      purpose: string;
      reference: string;
      date: Date;
    }
  ): Promise<boolean> {
    try {
      const template = this.generatePaymentConfirmationTemplate(candidateName, paymentDetails);

      await this.transporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@fuep.edu.ng',
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      logger.info('Payment confirmation email sent successfully', {
        module: 'email',
        operation: 'sendPaymentConfirmation',
        metadata: { to, candidateName, paymentDetails },
      });

      return true;
    } catch (error) {
      logger.error('Failed to send payment confirmation email', {
        module: 'email',
        operation: 'sendPaymentConfirmation',
        metadata: { to, candidateName, paymentDetails },
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Generate temporary password email template
   */
  private generateTemporaryPasswordTemplate(
    jambRegNo: string,
    temporaryPassword: string,
    candidateName: string
  ): EmailTemplate {
    const subject = 'FUEP Post-UTME Portal - Your Login Credentials';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>FUEP Post-UTME Portal - Login Credentials</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #134F47; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .credentials { background-color: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #134F47; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FUEP Post-UTME Portal</h1>
            <p>Welcome to Federal University of Education, Pankshin</p>
          </div>
          
          <div class="content">
            <h2>Hello ${candidateName},</h2>
            
            <p>Your Post-UTME application account has been created successfully. Please find your login credentials below:</p>
            
            <div class="credentials">
              <h3>Login Credentials:</h3>
              <p><strong>Username:</strong> ${jambRegNo}</p>
              <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
            </div>
            
            <div class="warning">
              <h4>⚠️ Important Security Notice:</h4>
              <ul>
                <li>This is a temporary password for your first login</li>
                <li>You will be required to change your password immediately after logging in</li>
                <li>Do not share these credentials with anyone</li>
                <li>If you did not request this account, please contact the admissions office immediately</li>
              </ul>
            </div>
            
            <h3>Next Steps:</h3>
            <ol>
              <li>Visit the FUEP Post-UTME Portal</li>
              <li>Log in using your JAMB registration number and temporary password</li>
              <li>Change your password when prompted</li>
              <li>Complete your registration profile</li>
              <li>Complete your registration</li>
              <li>Submit your application</li>
            </ol>
            
            <p><strong>Portal URL:</strong> <a href="${process.env.PORTAL_URL || 'http://localhost:5173'}">FUEP Post-UTME Portal</a></p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>For support, contact: admissions@fuep.edu.ng</p>
            <p>© ${new Date().getFullYear()} Federal University of Education, Pankshin. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
FUEP Post-UTME Portal - Login Credentials

Hello ${candidateName},

Your Post-UTME application account has been created successfully. Please find your login credentials below:

Login Credentials:
Username: ${jambRegNo}
Temporary Password: ${temporaryPassword}

IMPORTANT SECURITY NOTICE:
- This is a temporary password for your first login
- You will be required to change your password immediately after logging in
- Do not share these credentials with anyone
- If you did not request this account, please contact the admissions office immediately

Next Steps:
1. Visit the FUEP Post-UTME Portal
2. Log in using your JAMB registration number and temporary password
3. Change your password when prompted
4. Complete your registration profile
5. Complete your registration
6. Submit your application

Portal URL: ${process.env.PORTAL_URL || 'http://localhost:5173'}

This is an automated message. Please do not reply to this email.
For support, contact: admissions@fuep.edu.ng

© ${new Date().getFullYear()} Federal University of Education, Pankshin. All rights reserved.
    `;

    return { subject, html, text };
  }

  /**
   * Generate registration completion email template
   */
  private generateRegistrationCompletionTemplate(
    candidateName: string,
    jambRegNo: string
  ): EmailTemplate {
    const subject = 'FUEP Post-UTME Portal - Registration Complete';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>FUEP Post-UTME Portal - Registration Complete</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #134F47; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .success { background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FUEP Post-UTME Portal</h1>
            <p>Registration Complete</p>
          </div>
          
          <div class="content">
            <h2>Congratulations ${candidateName}!</h2>
            
            <div class="success">
              <h3>✅ Registration Complete</h3>
              <p>Your Post-UTME application registration has been completed successfully.</p>
            </div>
            
            <h3>What's Next?</h3>
            <ol>
              <li><strong>Application Review:</strong> Your application is now under review</li>
              <li><strong>Application Review:</strong> We will review your application</li>
              <li><strong>Admission Decision:</strong> You will be notified of the admission decision</li>
              <li><strong>Acceptance Process:</strong> If admitted, complete acceptance fee payment</li>
              <li><strong>Matriculation:</strong> Receive your matriculation number</li>
            </ol>
            
            <h3>Important Information:</h3>
            <ul>
              <li><strong>JAMB Registration Number:</strong> ${jambRegNo}</li>
              <li><strong>Application Status:</strong> Under Review</li>
              <li><strong>Next Update:</strong> Within 48-72 hours</li>
            </ul>
            
            <p>You can log in to your dashboard anytime to check your application status and receive updates.</p>
            
            <p><strong>Portal URL:</strong> <a href="${process.env.PORTAL_URL || 'http://localhost:5173'}">FUEP Post-UTME Portal</a></p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>For support, contact: admissions@fuep.edu.ng</p>
            <p>© ${new Date().getFullYear()} Federal University of Education, Pankshin. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
FUEP Post-UTME Portal - Registration Complete

Congratulations ${candidateName}!

✅ Registration Complete
Your Post-UTME application registration has been completed successfully.

What's Next?
1. Application Review: Your application is now under review
2. Application Review: We will review your application
3. Admission Decision: You will be notified of the admission decision
4. Acceptance Process: If admitted, complete acceptance fee payment
5. Matriculation: Receive your matriculation number

Important Information:
- JAMB Registration Number: ${jambRegNo}
- Application Status: Under Review
- Next Update: Within 48-72 hours

You can log in to your dashboard anytime to check your application status and receive updates.

Portal URL: ${process.env.PORTAL_URL || 'http://localhost:5173'}

This is an automated message. Please do not reply to this email.
For support, contact: admissions@fuep.edu.ng

© ${new Date().getFullYear()} Federal University of Education, Pankshin. All rights reserved.
    `;

    return { subject, html, text };
  }

  /**
   * Generate payment confirmation email template
   */
  private generatePaymentConfirmationTemplate(
    candidateName: string,
    paymentDetails: {
      amount: number;
      purpose: string;
      reference: string;
      date: Date;
    }
  ): EmailTemplate {
    const subject = 'FUEP Post-UTME Portal - Payment Confirmation';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>FUEP Post-UTME Portal - Payment Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #134F47; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .payment { background-color: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #134F47; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FUEP Post-UTME Portal</h1>
            <p>Payment Confirmation</p>
          </div>
          
          <div class="content">
            <h2>Hello ${candidateName},</h2>
            
            <p>Your payment has been received and confirmed successfully.</p>
            
            <div class="payment">
              <h3>Payment Details:</h3>
              <p><strong>Purpose:</strong> ${paymentDetails.purpose}</p>
              <p><strong>Amount:</strong> ₦${paymentDetails.amount.toLocaleString()}</p>
              <p><strong>Reference:</strong> ${paymentDetails.reference}</p>
              <p><strong>Date:</strong> ${paymentDetails.date.toLocaleDateString()}</p>
            </div>
            
            <p>Your payment has been processed and your account has been updated accordingly.</p>
            
            <p>You can now proceed with the next step in your application process.</p>
            
            <p><strong>Portal URL:</strong> <a href="${process.env.PORTAL_URL || 'http://localhost:5173'}">FUEP Post-UTME Portal</a></p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>For support, contact: admissions@fuep.edu.ng</p>
            <p>© ${new Date().getFullYear()} Federal University of Education, Pankshin. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
FUEP Post-UTME Portal - Payment Confirmation

Hello ${candidateName},

Your payment has been received and confirmed successfully.

Payment Details:
Purpose: ${paymentDetails.purpose}
Amount: ₦${paymentDetails.amount.toLocaleString()}
Reference: ${paymentDetails.reference}
Date: ${paymentDetails.date.toLocaleDateString()}

Your payment has been processed and your account has been updated accordingly.

You can now proceed with the next step in your application process.

Portal URL: ${process.env.PORTAL_URL || 'http://localhost:5173'}

This is an automated message. Please do not reply to this email.
For support, contact: admissions@fuep.edu.ng

© ${new Date().getFullYear()} Federal University of Education, Pankshin. All rights reserved.
    `;

    return { subject, html, text };
  }

  /**
   * Test email service connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.error('Email service connection test failed', {
        module: 'email',
        operation: 'testConnection',
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
