import { useState } from 'react';
import { Fragment as _Fragment,jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
const Payment = () => {
  const [formData, setFormData] = useState({
    purpose: '',
    jambRegNo: '',
    amount: 0,
    session: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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
  const handleInputChange = (e) => {
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
  const validateForm = () => {
    const newErrors = {};
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
  const handleSubmit = async (e) => {
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
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  return _jsxs('div', {
    className: 'container',
    children: [
      _jsxs('div', {
        className: 'page-header',
        children: [
          _jsx('h1', { children: 'Payment Initiation' }),
          _jsx('p', {
            children:
              'Initiate payments for various fees and charges. Please ensure all information is accurate before proceeding.',
          }),
        ],
      }),
      _jsxs('div', {
        className: 'form-container',
        children: [
          successMessage &&
            _jsxs('div', {
              className: 'alert alert-success',
              children: [_jsx('strong', { children: 'Success!' }), ' ', successMessage],
            }),
          errorMessage &&
            _jsxs('div', {
              className: 'alert alert-error',
              children: [_jsx('strong', { children: 'Error:' }), ' ', errorMessage],
            }),
          _jsxs('form', {
            onSubmit: handleSubmit,
            children: [
              _jsxs('div', {
                className: 'card mb-6',
                children: [
                  _jsxs('div', {
                    className: 'card-header',
                    children: [
                      _jsx('h2', { className: 'card-title', children: 'Payment Details' }),
                      _jsx('p', {
                        className: 'card-subtitle',
                        children: 'Select the type of payment and provide required information',
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    className: 'grid grid-cols-1 md:grid-cols-2 gap-6',
                    children: [
                      _jsxs('div', {
                        className: 'form-group',
                        children: [
                          _jsx('label', {
                            htmlFor: 'purpose',
                            className: 'form-label',
                            children: 'Payment Purpose *',
                          }),
                          _jsxs('select', {
                            id: 'purpose',
                            name: 'purpose',
                            value: formData.purpose,
                            onChange: handleInputChange,
                            className: `form-select ${errors.purpose ? 'error' : ''}`,
                            disabled: isLoading,
                            children: [
                              _jsx('option', { value: '', children: 'Select payment purpose' }),
                              paymentPurposes.map((purpose) =>
                                _jsxs(
                                  'option',
                                  {
                                    value: purpose.value,
                                    children: [
                                      purpose.label,
                                      ' - ',
                                      formatCurrency(purpose.amount),
                                    ],
                                  },
                                  purpose.value
                                )
                              ),
                            ],
                          }),
                          errors.purpose &&
                            _jsx('div', { className: 'form-error', children: errors.purpose }),
                          formData.purpose &&
                            _jsx('div', {
                              className: 'form-help',
                              children: paymentPurposes.find((p) => p.value === formData.purpose)
                                ?.description,
                            }),
                        ],
                      }),
                      _jsxs('div', {
                        className: 'form-group',
                        children: [
                          _jsx('label', {
                            htmlFor: 'session',
                            className: 'form-label',
                            children: 'Academic Session *',
                          }),
                          _jsxs('select', {
                            id: 'session',
                            name: 'session',
                            value: formData.session,
                            onChange: handleInputChange,
                            className: `form-select ${errors.session ? 'error' : ''}`,
                            disabled: isLoading,
                            children: [
                              _jsx('option', { value: '', children: 'Select academic session' }),
                              academicSessions.map((session) =>
                                _jsx('option', { value: session, children: session }, session)
                              ),
                            ],
                          }),
                          errors.session &&
                            _jsx('div', { className: 'form-error', children: errors.session }),
                        ],
                      }),
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
                            name: 'jambRegNo',
                            value: formData.jambRegNo,
                            onChange: handleInputChange,
                            className: `form-input ${errors.jambRegNo ? 'error' : ''}`,
                            placeholder: 'Enter your JAMB registration number',
                            disabled: isLoading,
                          }),
                          errors.jambRegNo &&
                            _jsx('div', { className: 'form-error', children: errors.jambRegNo }),
                        ],
                      }),
                      _jsxs('div', {
                        className: 'form-group',
                        children: [
                          _jsx('label', {
                            htmlFor: 'amount',
                            className: 'form-label',
                            children: 'Amount (NGN) *',
                          }),
                          _jsx('input', {
                            type: 'number',
                            id: 'amount',
                            name: 'amount',
                            value: formData.amount,
                            onChange: handleInputChange,
                            className: `form-input ${errors.amount ? 'error' : ''}`,
                            placeholder: 'Enter amount',
                            min: '0',
                            step: '100',
                            disabled: isLoading || formData.purpose !== 'other',
                          }),
                          errors.amount &&
                            _jsx('div', { className: 'form-error', children: errors.amount }),
                          formData.purpose &&
                            formData.purpose !== 'other' &&
                            _jsxs('div', {
                              className: 'form-help',
                              children: ['Amount: ', formatCurrency(formData.amount)],
                            }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              _jsxs('div', {
                className: 'card mb-6',
                children: [
                  _jsxs('div', {
                    className: 'card-header',
                    children: [
                      _jsx('h2', { className: 'card-title', children: 'Contact Information' }),
                      _jsx('p', {
                        className: 'card-subtitle',
                        children: 'Where to send payment confirmations and receipts',
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    className: 'grid grid-cols-1 md:grid-cols-2 gap-6',
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
                            name: 'email',
                            value: formData.email,
                            onChange: handleInputChange,
                            className: `form-input ${errors.email ? 'error' : ''}`,
                            placeholder: 'Enter your email address',
                            disabled: isLoading,
                          }),
                          errors.email &&
                            _jsx('div', { className: 'form-error', children: errors.email }),
                          _jsx('div', {
                            className: 'form-help',
                            children: 'Payment receipt will be sent to this email',
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
                            name: 'phone',
                            value: formData.phone,
                            onChange: handleInputChange,
                            className: `form-input ${errors.phone ? 'error' : ''}`,
                            placeholder: 'Enter your phone number',
                            disabled: isLoading,
                          }),
                          errors.phone &&
                            _jsx('div', { className: 'form-error', children: errors.phone }),
                          _jsx('div', {
                            className: 'form-help',
                            children: 'SMS notifications will be sent to this number',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              formData.purpose &&
                formData.amount > 0 &&
                _jsxs('div', {
                  className: 'card mb-6',
                  children: [
                    _jsx('div', {
                      className: 'card-header',
                      children: _jsx('h3', {
                        className: 'card-title',
                        children: 'Payment Summary',
                      }),
                    }),
                    _jsx('div', {
                      className: 'p-4 bg-secondary rounded-lg',
                      children: _jsxs('div', {
                        className: 'grid grid-cols-1 md:grid-cols-2 gap-4',
                        children: [
                          _jsxs('div', {
                            children: [
                              _jsx('strong', { children: 'Payment Purpose:' }),
                              _jsx('p', {
                                className: 'text-secondary',
                                children: paymentPurposes.find((p) => p.value === formData.purpose)
                                  ?.label,
                              }),
                            ],
                          }),
                          _jsxs('div', {
                            children: [
                              _jsx('strong', { children: 'Amount:' }),
                              _jsx('p', {
                                className: 'text-primary text-xl font-bold',
                                children: formatCurrency(formData.amount),
                              }),
                            ],
                          }),
                          _jsxs('div', {
                            children: [
                              _jsx('strong', { children: 'Academic Session:' }),
                              _jsx('p', {
                                className: 'text-secondary',
                                children: formData.session,
                              }),
                            ],
                          }),
                          _jsxs('div', {
                            children: [
                              _jsx('strong', { children: 'JAMB Reg No:' }),
                              _jsx('p', {
                                className: 'text-secondary',
                                children: formData.jambRegNo,
                              }),
                            ],
                          }),
                        ],
                      }),
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
                        children: [_jsx('span', { className: 'spinner' }), 'Initiating Payment...'],
                      })
                    : 'Proceed to Payment',
                }),
              }),
            ],
          }),
          _jsxs('div', {
            className: 'card mt-6',
            children: [
              _jsx('div', {
                className: 'card-header',
                children: _jsx('h3', { className: 'card-title', children: 'Payment Information' }),
              }),
              _jsxs('div', {
                className: 'grid grid-cols-1 md:grid-cols-2 gap-6',
                children: [
                  _jsxs('div', {
                    children: [
                      _jsx('h4', {
                        className: 'text-primary mb-2',
                        children: 'Accepted Payment Methods',
                      }),
                      _jsxs('ul', {
                        className: 'text-secondary',
                        style: { paddingLeft: '20px', lineHeight: '1.8' },
                        children: [
                          _jsx('li', { children: 'Debit/Credit Cards (Visa, Mastercard)' }),
                          _jsx('li', { children: 'Bank Transfers (NIBSS)' }),
                          _jsx('li', { children: 'USSD Payments' }),
                          _jsx('li', { children: 'Mobile Money' }),
                        ],
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    children: [
                      _jsx('h4', { className: 'text-primary mb-2', children: 'Important Notes' }),
                      _jsxs('ul', {
                        className: 'text-secondary',
                        style: { paddingLeft: '20px', lineHeight: '1.8' },
                        children: [
                          _jsx('li', { children: 'Keep your payment receipt safe' }),
                          _jsx('li', { children: 'Payment confirmation may take 24-48 hours' }),
                          _jsx('li', { children: 'Contact support if payment fails' }),
                          _jsx('li', { children: 'Refunds processed within 5-7 business days' }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          _jsxs('div', {
            className: 'card mt-6',
            children: [
              _jsx('div', {
                className: 'card-header',
                children: _jsx('h3', {
                  className: 'card-title',
                  children: 'Need Help with Payment?',
                }),
              }),
              _jsxs('div', {
                className: 'text-center',
                children: [
                  _jsx('p', {
                    className: 'text-secondary mb-4',
                    children: 'Having trouble with your payment? Our support team is here to help.',
                  }),
                  _jsxs('div', {
                    className: 'flex gap-4 justify-center flex-wrap',
                    children: [
                      _jsx('a', {
                        href: '/support',
                        className: 'btn btn-secondary',
                        children: 'Contact Support',
                      }),
                      _jsx('a', {
                        href: '/faq',
                        className: 'btn btn-info',
                        children: 'Payment FAQ',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
};
export default Payment;
