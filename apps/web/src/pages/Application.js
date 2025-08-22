import { useState } from 'react';
import { Fragment as _Fragment,jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useNavigate } from 'react-router-dom';

import { getApiBaseUrl } from '../utils/config';
const Application = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('jamb-verification');
  const [jambRegNo, setJambRegNo] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const handleJambVerification = async (e) => {
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
        body: JSON.stringify({ jambRegNo: jambRegNo.trim() }),
      });
      const data = await response.json();
      if (response.ok && data.exists) {
        setVerificationResult(data);
        setStep('contact-info');
      } else {
        setError(
          data.message ||
            'JAMB Registration Number not found in our system. Please contact the admissions office.'
        );
      }
    } catch (_error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleContactInfoSubmit = async (e) => {
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
    } catch (_error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const renderJambVerification = () =>
    _jsxs('div', {
      className: 'card',
      children: [
        _jsxs('div', {
          className: 'card-header',
          children: [
            _jsx('h2', { className: 'card-title', children: 'Step 1: Verify JAMB Registration' }),
            _jsx('p', {
              className: 'card-subtitle',
              children: 'Enter your JAMB registration number to begin your application',
            }),
          ],
        }),
        _jsxs('form', {
          onSubmit: handleJambVerification,
          children: [
            _jsxs('div', {
              className: 'form-group',
              children: [
                _jsx('label', {
                  htmlFor: 'jambRegNo',
                  className: 'form-label',
                  children: 'JAMB Registration Number *',
                }),
                _jsx('input', {
                  type: 'text',
                  id: 'jambRegNo',
                  value: jambRegNo,
                  onChange: (e) => setJambRegNo(e.target.value),
                  className: 'form-input',
                  placeholder: 'Enter your JAMB registration number',
                  disabled: isLoading,
                  required: true,
                }),
                _jsx('div', {
                  className: 'form-help',
                  children: 'This is the same number you used for JAMB registration',
                }),
              ],
            }),
            _jsx('div', {
              className: 'form-group',
              children: _jsx('button', {
                type: 'submit',
                className: 'btn btn-primary btn-full btn-lg',
                disabled: isLoading,
                children: isLoading
                  ? _jsxs(_Fragment, {
                      children: [_jsx('span', { className: 'spinner' }), 'Verifying...'],
                    })
                  : 'Verify JAMB Number',
              }),
            }),
          ],
        }),
        error &&
          _jsxs('div', {
            className: 'alert alert-error mt-4',
            children: [_jsx('strong', { children: 'Error:' }), ' ', error],
          }),
      ],
    });
  const renderContactInfo = () =>
    _jsxs('div', {
      className: 'card',
      children: [
        _jsxs('div', {
          className: 'card-header',
          children: [
            _jsx('h2', { className: 'card-title', children: 'Step 2: Contact Information' }),
            _jsx('p', {
              className: 'card-subtitle',
              children: 'Provide your contact details for the application process',
            }),
          ],
        }),
        verificationResult?.biodata &&
          _jsxs('div', {
            className: 'alert alert-info mb-4',
            children: [
              _jsx('strong', { children: 'JAMB Verification Successful!' }),
              _jsx('br', {}),
              'Found: ',
              verificationResult.biodata.firstName,
              ' ',
              verificationResult.biodata.lastName,
              verificationResult.biodata.middleName && ` ${verificationResult.biodata.middleName}`,
            ],
          }),
        _jsxs('form', {
          onSubmit: handleContactInfoSubmit,
          children: [
            _jsxs('div', {
              className: 'form-group',
              children: [
                _jsx('label', {
                  htmlFor: 'email',
                  className: 'form-label',
                  children: 'Email Address *',
                }),
                _jsx('input', {
                  type: 'email',
                  id: 'email',
                  value: email,
                  onChange: (e) => setEmail(e.target.value),
                  className: 'form-input',
                  placeholder: 'Enter your email address',
                  disabled: isLoading,
                  required: true,
                }),
                _jsx('div', {
                  className: 'form-help',
                  children:
                    "We'll send your login credentials and application updates to this email",
                }),
              ],
            }),
            _jsxs('div', {
              className: 'form-group',
              children: [
                _jsx('label', {
                  htmlFor: 'phone',
                  className: 'form-label',
                  children: 'Phone Number *',
                }),
                _jsx('input', {
                  type: 'tel',
                  id: 'phone',
                  value: phone,
                  onChange: (e) => setPhone(e.target.value),
                  className: 'form-input',
                  placeholder: 'Enter your phone number (e.g., 08012345678)',
                  disabled: isLoading,
                  required: true,
                }),
                _jsx('div', {
                  className: 'form-help',
                  children: "We'll send SMS notifications about your application status",
                }),
              ],
            }),
            _jsx('div', {
              className: 'form-group',
              children: _jsx('button', {
                type: 'submit',
                className: 'btn btn-primary btn-full btn-lg',
                disabled: isLoading,
                children: 'Continue to Payment',
              }),
            }),
          ],
        }),
        error &&
          _jsxs('div', {
            className: 'alert alert-error mt-4',
            children: [_jsx('strong', { children: 'Error:' }), ' ', error],
          }),
      ],
    });
  const renderPaymentInitiation = () =>
    _jsxs('div', {
      className: 'card',
      children: [
        _jsxs('div', {
          className: 'card-header',
          children: [
            _jsx('h2', { className: 'card-title', children: 'Step 3: Payment Initialization' }),
            _jsx('p', {
              className: 'card-subtitle',
              children: 'Complete your Post-UTME screening payment',
            }),
          ],
        }),
        _jsxs('div', {
          className: 'alert alert-info mb-4',
          children: [
            _jsx('strong', { children: 'Application Summary:' }),
            _jsx('br', {}),
            'JAMB Number: ',
            jambRegNo,
            _jsx('br', {}),
            'Email: ',
            email,
            _jsx('br', {}),
            'Phone: ',
            phone,
          ],
        }),
        _jsxs('div', {
          className: 'mb-6',
          children: [
            _jsx('h4', { className: 'text-primary mb-3', children: 'Payment Details' }),
            _jsxs('div', {
              className: 'grid grid-cols-1 md:grid-cols-2 gap-4',
              children: [
                _jsxs('div', {
                  className: 'p-4 bg-secondary rounded-lg',
                  children: [
                    _jsx('h5', {
                      className: 'font-semibold mb-2',
                      children: 'Post-UTME Screening Fee',
                    }),
                    _jsx('p', {
                      className: 'text-2xl font-bold text-primary',
                      children: '\u20A62,000',
                    }),
                    _jsx('p', {
                      className: 'text-sm text-secondary',
                      children: 'One-time payment',
                    }),
                  ],
                }),
                _jsxs('div', {
                  className: 'p-4 bg-secondary rounded-lg',
                  children: [
                    _jsx('h5', { className: 'font-semibold mb-2', children: 'Payment Method' }),
                    _jsx('p', { className: 'text-primary', children: 'Remita Payment Gateway' }),
                    _jsx('p', {
                      className: 'text-sm text-secondary',
                      children: 'Secure online payment',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        _jsx('div', {
          className: 'form-group',
          children: _jsx('button', {
            onClick: handlePaymentInitiation,
            className: 'btn btn-primary btn-full btn-lg',
            disabled: isLoading,
            children: isLoading
              ? _jsxs(_Fragment, {
                  children: [_jsx('span', { className: 'spinner' }), 'Initializing Payment...'],
                })
              : 'Proceed to Payment',
          }),
        }),
        error &&
          _jsxs('div', {
            className: 'alert alert-error mt-4',
            children: [_jsx('strong', { children: 'Error:' }), ' ', error],
          }),
        _jsxs('div', {
          className: 'mt-6 p-4 bg-warning rounded-lg',
          children: [
            _jsx('h5', { className: 'font-semibold mb-2', children: 'Important Notes:' }),
            _jsxs('ul', {
              className: 'text-sm space-y-1',
              children: [
                _jsx('li', { children: '\u2022 Payment is required to complete your application' }),
                _jsx('li', {
                  children: "\u2022 You'll receive login credentials after successful payment",
                }),
                _jsx('li', { children: '\u2022 Keep your payment receipt for reference' }),
                _jsx('li', { children: '\u2022 Contact support if you encounter any issues' }),
              ],
            }),
          ],
        }),
      ],
    });
  return _jsxs('div', {
    className: 'container',
    children: [
      _jsxs('div', {
        className: 'page-header',
        children: [
          _jsx('h1', { children: 'Start Your FUEP Post-UTME Application' }),
          _jsx('p', {
            children:
              'Begin your journey to FUEP by completing the application process step by step. Follow the guided flow to verify your JAMB registration and complete your application.',
          }),
        ],
      }),
      _jsx('div', {
        className: 'mb-8',
        children: _jsxs('div', {
          className: 'flex items-center justify-center space-x-4',
          children: [
            _jsxs('div', {
              className: `flex items-center ${step === 'jamb-verification' ? 'text-primary' : 'text-secondary'}`,
              children: [
                _jsx('div', {
                  className: `w-8 h-8 rounded-full flex items-center justify-center ${
                    step === 'jamb-verification'
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-secondary'
                  }`,
                  children: '1',
                }),
                _jsx('span', { className: 'ml-2 font-medium', children: 'JAMB Verification' }),
              ],
            }),
            _jsx('div', {
              className: `w-16 h-1 ${step === 'jamb-verification' ? 'bg-secondary' : 'bg-primary'}`,
            }),
            _jsxs('div', {
              className: `flex items-center ${step === 'contact-info' ? 'text-primary' : 'text-secondary'}`,
              children: [
                _jsx('div', {
                  className: `w-8 h-8 rounded-full flex items-center justify-center ${step === 'contact-info' ? 'bg-primary text-white' : 'bg-secondary text-secondary'}`,
                  children: '2',
                }),
                _jsx('span', { className: 'ml-2 font-medium', children: 'Contact Info' }),
              ],
            }),
            _jsx('div', {
              className: `w-16 h-1 ${step === 'contact-info' ? 'bg-secondary' : 'bg-primary'}`,
            }),
            _jsxs('div', {
              className: `flex items-center ${step === 'payment-init' ? 'text-primary' : 'text-secondary'}`,
              children: [
                _jsx('div', {
                  className: `w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment-init' ? 'bg-primary text-white' : 'bg-secondary text-secondary'}`,
                  children: '3',
                }),
                _jsx('span', { className: 'ml-2 font-medium', children: 'Payment' }),
              ],
            }),
          ],
        }),
      }),
      step === 'jamb-verification' && renderJambVerification(),
      step === 'contact-info' && renderContactInfo(),
      step === 'payment-init' && renderPaymentInitiation(),
      _jsx('div', {
        className: 'text-center mt-8',
        children: _jsx('button', {
          onClick: () => navigate('/'),
          className: 'btn btn-outline',
          children: '\u2190 Back to Home',
        }),
      }),
    ],
  });
};
export default Application;
