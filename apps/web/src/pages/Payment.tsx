import React, { useState } from 'react';
// import { PaymentInitiationRequestSchema, PaymentInitiationRequest } from '@fuep/types';

// Temporary type definition for development
interface PaymentInitiationRequest {
  purpose: string;
  jambRegNo: string;
  amount: number;
  session: string;
  email: string;
  phone: string;
}

const Payment: React.FC = () => {
  const [formData, setFormData] = useState<PaymentInitiationRequest>({
    purpose: '',
    jambRegNo: '',
    amount: 0,
    session: '',
    email: '',
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const paymentPurposes = [
    {
      value: 'post_utme',
      label: 'Post-UTME Screening Fee',
      amount: 2000,
      description: 'Required for all candidates',
    },
    {
      value: 'acceptance',
      label: 'Acceptance Fee',
      amount: 5000,
      description: 'For admitted candidates',
    },
    {
      value: 'school_fees',
      label: 'School Fees (First Semester)',
      amount: 25000,
      description: 'After admission',
    },
    { value: 'other', label: 'Other Fees', amount: 0, description: 'Specify amount below' },
  ];

  const academicSessions = ['2024/2025', '2025/2026', '2026/2027'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'purpose') {
      const selectedPurpose = paymentPurposes.find((p) => p.value === value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        amount: selectedPurpose?.amount || 0,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.purpose) {
      newErrors.purpose = 'Payment purpose is required';
    }

    if (!formData.jambRegNo.trim()) {
      newErrors.jambRegNo = 'JAMB registration number is required';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.session) {
      newErrors.session = 'Academic session is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`Payment initiated successfully! Payment URL: ${data.data.paymentUrl}`);
        // In a real app, you might redirect to the payment gateway
        alert(`Payment URL: ${data.data.paymentUrl}`);
      } else {
        setErrorMessage(data.error || 'Failed to initiate payment');
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Payment Initiation</h1>
        <p>
          Initiate payments for various fees and charges. Please ensure all information is accurate
          before proceeding.
        </p>
      </div>

      <div className="form-container">
        {successMessage && (
          <div className="alert alert-success">
            <strong>Success!</strong> {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-error">
            <strong>Error:</strong> {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Payment Details */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title">Payment Details</h2>
              <p className="card-subtitle">
                Select the type of payment and provide required information
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="purpose" className="form-label">
                  Payment Purpose *
                </label>
                <select
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  className={`form-select ${errors.purpose ? 'error' : ''}`}
                  disabled={isLoading}
                >
                  <option value="">Select payment purpose</option>
                  {paymentPurposes.map((purpose) => (
                    <option key={purpose.value} value={purpose.value}>
                      {purpose.label} - {formatCurrency(purpose.amount)}
                    </option>
                  ))}
                </select>
                {errors.purpose && <div className="form-error">{errors.purpose}</div>}
                {formData.purpose && (
                  <div className="form-help">
                    {paymentPurposes.find((p) => p.value === formData.purpose)?.description}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="session" className="form-label">
                  Academic Session *
                </label>
                <select
                  id="session"
                  name="session"
                  value={formData.session}
                  onChange={handleInputChange}
                  className={`form-select ${errors.session ? 'error' : ''}`}
                  disabled={isLoading}
                >
                  <option value="">Select academic session</option>
                  {academicSessions.map((session) => (
                    <option key={session} value={session}>
                      {session}
                    </option>
                  ))}
                </select>
                {errors.session && <div className="form-error">{errors.session}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="jambRegNo" className="form-label">
                  JAMB Registration Number *
                </label>
                <input
                  type="text"
                  id="jambRegNo"
                  name="jambRegNo"
                  value={formData.jambRegNo}
                  onChange={handleInputChange}
                  className={`form-input ${errors.jambRegNo ? 'error' : ''}`}
                  placeholder="Enter your JAMB registration number"
                  disabled={isLoading}
                />
                {errors.jambRegNo && <div className="form-error">{errors.jambRegNo}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="amount" className="form-label">
                  Amount (NGN) *
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className={`form-input ${errors.amount ? 'error' : ''}`}
                  placeholder="Enter amount"
                  min="0"
                  step="100"
                  disabled={isLoading || formData.purpose !== 'other'}
                />
                {errors.amount && <div className="form-error">{errors.amount}</div>}
                {formData.purpose && formData.purpose !== 'other' && (
                  <div className="form-help">Amount: {formatCurrency(formData.amount)}</div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title">Contact Information</h2>
              <p className="card-subtitle">Where to send payment confirmations and receipts</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="Enter your email address"
                  disabled={isLoading}
                />
                {errors.email && <div className="form-error">{errors.email}</div>}
                <div className="form-help">Payment receipt will be sent to this email</div>
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="Enter your phone number"
                  disabled={isLoading}
                />
                {errors.phone && <div className="form-error">{errors.phone}</div>}
                <div className="form-help">SMS notifications will be sent to this number</div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          {formData.purpose && formData.amount > 0 && (
            <div className="card mb-6">
              <div className="card-header">
                <h3 className="card-title">Payment Summary</h3>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <strong>Payment Purpose:</strong>
                    <p className="text-secondary">
                      {paymentPurposes.find((p) => p.value === formData.purpose)?.label}
                    </p>
                  </div>
                  <div>
                    <strong>Amount:</strong>
                    <p className="text-primary text-xl font-bold">
                      {formatCurrency(formData.amount)}
                    </p>
                  </div>
                  <div>
                    <strong>Academic Session:</strong>
                    <p className="text-secondary">{formData.session}</p>
                  </div>
                  <div>
                    <strong>JAMB Reg No:</strong>
                    <p className="text-secondary">{formData.jambRegNo}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="form-group">
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Initiating Payment...
                </>
              ) : (
                'Proceed to Payment'
              )}
            </button>
          </div>
        </form>

        {/* Payment Information */}
        <div className="card mt-6">
          <div className="card-header">
            <h3 className="card-title">Payment Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-primary mb-2">Accepted Payment Methods</h4>
              <ul className="text-secondary" style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>Debit/Credit Cards (Visa, Mastercard)</li>
                <li>Bank Transfers (NIBSS)</li>
                <li>USSD Payments</li>
                <li>Mobile Money</li>
              </ul>
            </div>
            <div>
              <h4 className="text-primary mb-2">Important Notes</h4>
              <ul className="text-secondary" style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                <li>Keep your payment receipt safe</li>
                <li>Payment confirmation may take 24-48 hours</li>
                <li>Contact support if payment fails</li>
                <li>Refunds processed within 5-7 business days</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Support Information */}
        <div className="card mt-6">
          <div className="card-header">
            <h3 className="card-title">Need Help with Payment?</h3>
          </div>
          <div className="text-center">
            <p className="text-secondary mb-4">
              Having trouble with your payment? Our support team is here to help.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a href="/support" className="btn btn-secondary">
                Contact Support
              </a>
              <a href="/faq" className="btn btn-info">
                Payment FAQ
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
