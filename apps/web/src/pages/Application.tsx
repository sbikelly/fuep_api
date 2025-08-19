import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getApiBaseUrl } from '../utils/config';

interface JambVerificationRequest {
  jambRegNo: string;
}

interface JambVerificationResponse {
  exists: boolean;
  biodata?: {
    firstName: string;
    lastName: string;
    middleName?: string;
    gender: string;
    dateOfBirth: string;
    stateOfOrigin: string;
    lga: string;
  };
  message?: string;
}

const Application: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'jamb-verification' | 'contact-info' | 'payment-init'>(
    'jamb-verification'
  );
  const [jambRegNo, setJambRegNo] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<JambVerificationResponse | null>(
    null
  );

  const handleJambVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jambRegNo.trim()) {
      setError('JAMB Registration Number is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${getApiBaseUrl()}/auth/check-jamb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jambRegNo: jambRegNo.trim() } as JambVerificationRequest),
      });

      const data: JambVerificationResponse = await response.json();

      if (response.ok && data.exists) {
        setVerificationResult(data);
        setStep('contact-info');
      } else {
        setError(
          data.message ||
            'JAMB Registration Number not found in our system. Please contact the admissions office.'
        );
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !phone.trim()) {
      setError('Email and phone number are required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Basic phone validation (Nigerian format)
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setError('Please enter a valid Nigerian phone number');
      return;
    }

    setStep('payment-init');
  };

  const handlePaymentInitiation = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${getApiBaseUrl()}/payments/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purpose: 'post_utme',
          jambRegNo: jambRegNo.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.redirectUrl) {
        // Redirect to payment gateway
        window.location.href = data.redirectUrl;
      } else {
        setError(data.error || 'Failed to initialize payment. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderJambVerification = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Step 1: Verify JAMB Registration</h2>
        <p className="card-subtitle">
          Enter your JAMB registration number to begin your application
        </p>
      </div>

      <form onSubmit={handleJambVerification}>
        <div className="form-group">
          <label htmlFor="jambRegNo" className="form-label">
            JAMB Registration Number *
          </label>
          <input
            type="text"
            id="jambRegNo"
            value={jambRegNo}
            onChange={(e) => setJambRegNo(e.target.value)}
            className="form-input"
            placeholder="Enter your JAMB registration number"
            disabled={isLoading}
            required
          />
          <div className="form-help">This is the same number you used for JAMB registration</div>
        </div>

        <div className="form-group">
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Verifying...
              </>
            ) : (
              'Verify JAMB Number'
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="alert alert-error mt-4">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );

  const renderContactInfo = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Step 2: Contact Information</h2>
        <p className="card-subtitle">Provide your contact details for the application process</p>
      </div>

      {verificationResult?.biodata && (
        <div className="alert alert-info mb-4">
          <strong>JAMB Verification Successful!</strong>
          <br />
          Found: {verificationResult.biodata.firstName} {verificationResult.biodata.lastName}
          {verificationResult.biodata.middleName && ` ${verificationResult.biodata.middleName}`}
        </div>
      )}

      <form onSubmit={handleContactInfoSubmit}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="Enter your email address"
            disabled={isLoading}
            required
          />
          <div className="form-help">
            We'll send your login credentials and application updates to this email
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="form-input"
            placeholder="Enter your phone number (e.g., 08012345678)"
            disabled={isLoading}
            required
          />
          <div className="form-help">
            We'll send SMS notifications about your application status
          </div>
        </div>

        <div className="form-group">
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading}>
            Continue to Payment
          </button>
        </div>
      </form>

      {error && (
        <div className="alert alert-error mt-4">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );

  const renderPaymentInitiation = () => (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Step 3: Payment Initialization</h2>
        <p className="card-subtitle">Complete your Post-UTME screening payment</p>
      </div>

      <div className="alert alert-info mb-4">
        <strong>Application Summary:</strong>
        <br />
        JAMB Number: {jambRegNo}
        <br />
        Email: {email}
        <br />
        Phone: {phone}
      </div>

      <div className="mb-6">
        <h4 className="text-primary mb-3">Payment Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-secondary rounded-lg">
            <h5 className="font-semibold mb-2">Post-UTME Screening Fee</h5>
            <p className="text-2xl font-bold text-primary">₦2,000</p>
            <p className="text-sm text-secondary">One-time payment</p>
          </div>
          <div className="p-4 bg-secondary rounded-lg">
            <h5 className="font-semibold mb-2">Payment Method</h5>
            <p className="text-primary">Remita Payment Gateway</p>
            <p className="text-sm text-secondary">Secure online payment</p>
          </div>
        </div>
      </div>

      <div className="form-group">
        <button
          onClick={handlePaymentInitiation}
          className="btn btn-primary btn-full btn-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Initializing Payment...
            </>
          ) : (
            'Proceed to Payment'
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-error mt-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="mt-6 p-4 bg-warning rounded-lg">
        <h5 className="font-semibold mb-2">Important Notes:</h5>
        <ul className="text-sm space-y-1">
          <li>• Payment is required to complete your application</li>
          <li>• You'll receive login credentials after successful payment</li>
          <li>• Keep your payment receipt for reference</li>
          <li>• Contact support if you encounter any issues</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="page-header">
        <h1>Start Your FUEP Post-UTME Application</h1>
        <p>
          Begin your journey to FUEP by completing the application process step by step. Follow the
          guided flow to verify your JAMB registration and complete your application.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div
            className={`flex items-center ${step === 'jamb-verification' ? 'text-primary' : 'text-secondary'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'jamb-verification'
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-secondary'
              }`}
            >
              1
            </div>
            <span className="ml-2 font-medium">JAMB Verification</span>
          </div>

          <div
            className={`w-16 h-1 ${step === 'jamb-verification' ? 'bg-secondary' : 'bg-primary'}`}
          ></div>

          <div
            className={`flex items-center ${step === 'contact-info' ? 'text-primary' : 'text-secondary'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'contact-info' ? 'bg-primary text-white' : 'bg-secondary text-secondary'
              }`}
            >
              2
            </div>
            <span className="ml-2 font-medium">Contact Info</span>
          </div>

          <div
            className={`w-16 h-1 ${step === 'contact-info' ? 'bg-secondary' : 'bg-primary'}`}
          ></div>

          <div
            className={`flex items-center ${step === 'payment-init' ? 'text-primary' : 'text-secondary'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'payment-init' ? 'bg-primary text-white' : 'bg-secondary text-secondary'
              }`}
            >
              3
            </div>
            <span className="ml-2 font-medium">Payment</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      {step === 'jamb-verification' && renderJambVerification()}
      {step === 'contact-info' && renderContactInfo()}
      {step === 'payment-init' && renderPaymentInitiation()}

      {/* Navigation */}
      <div className="text-center mt-8">
        <button onClick={() => navigate('/')} className="btn btn-outline">
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default Application;
