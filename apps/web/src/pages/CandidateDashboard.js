import { useEffect, useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Link, useParams } from 'react-router-dom';

import ICTBadge from '../components/ICTBadge';
const CandidateDashboard = () => {
  const { candidateId } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/candidates/${candidateId}/dashboard`
        );
        if (response.ok) {
          const data = await response.json();
          setDashboard(data.data);
        } else {
          setError(`Failed to load dashboard: ${response.statusText}`);
        }
      } catch (_err) {
        setError('Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    };
    if (candidateId) {
      fetchDashboard();
    }
  }, [candidateId]);
  const getCompletionColor = (percentage) => {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-error';
  };
  const getCompletionIcon = (percentage) => {
    if (percentage >= 80) return '✅';
    if (percentage >= 60) return '⚠️';
    return '❌';
  };
  if (isLoading) {
    return _jsx('div', {
      className: 'container',
      children: _jsxs('div', {
        className: 'text-center p-8',
        children: [
          _jsx('div', {
            className: 'spinner',
            style: { width: '48px', height: '48px', margin: '0 auto 16px auto' },
          }),
          _jsx('p', { className: 'text-secondary', children: 'Loading candidate dashboard...' }),
        ],
      }),
    });
  }
  if (error) {
    return _jsx('div', {
      className: 'container',
      children: _jsxs('div', {
        className: 'alert alert-error',
        children: [_jsx('strong', { children: 'Error:' }), ' ', error],
      }),
    });
  }
  if (!dashboard) {
    return _jsx('div', {
      className: 'container',
      children: _jsxs('div', {
        className: 'alert alert-warning',
        children: [
          _jsx('strong', { children: 'No Data:' }),
          ' Dashboard information not available',
        ],
      }),
    });
  }
  const { completionStatus } = dashboard;
  return _jsxs('div', {
    className: 'container',
    children: [
      _jsxs('div', {
        className: 'page-header',
        children: [
          _jsx('h1', { children: 'Candidate Dashboard' }),
          _jsx('p', { children: 'Complete your post-UTME application profile' }),
        ],
      }),
      _jsxs('div', {
        className: 'card mb-6',
        children: [
          _jsxs('div', {
            className: 'card-header',
            children: [
              _jsx('h2', { className: 'card-title', children: 'Profile Completion Status' }),
              _jsx('p', {
                className: 'card-subtitle',
                children: 'Track your application progress',
              }),
            ],
          }),
          _jsxs('div', {
            className: 'p-6',
            children: [
              _jsxs('div', {
                className: 'flex items-center justify-between mb-6',
                children: [
                  _jsxs('div', {
                    className: 'flex items-center gap-4',
                    children: [
                      _jsx('span', {
                        className: 'text-4xl',
                        children: getCompletionIcon(completionStatus.overall),
                      }),
                      _jsxs('div', {
                        children: [
                          _jsx('h3', {
                            className: 'text-2xl font-bold',
                            children: 'Overall Progress',
                          }),
                          _jsx('p', {
                            className: 'text-secondary',
                            children: 'Complete your profile to proceed',
                          }),
                        ],
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    className: 'text-right',
                    children: [
                      _jsxs('div', {
                        className: `text-4xl font-bold ${getCompletionColor(completionStatus.overall)}`,
                        children: [completionStatus.overall, '%'],
                      }),
                      _jsx('div', { className: 'text-secondary', children: 'Complete' }),
                    ],
                  }),
                ],
              }),
              _jsx('div', {
                className: 'w-full bg-gray-200 rounded-full h-4 mb-6',
                children: _jsx('div', {
                  className: 'bg-primary h-4 rounded-full transition-all duration-500',
                  style: { width: `${completionStatus.overall}%` },
                }),
              }),
              _jsxs('div', {
                className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4',
                children: [
                  _jsxs('div', {
                    className: `p-4 rounded-lg border-2 ${completionStatus.candidate ? 'border-success bg-success-light' : 'border-gray-300 bg-gray-50'}`,
                    children: [
                      _jsxs('div', {
                        className: 'flex items-center gap-2 mb-2',
                        children: [
                          _jsx('span', {
                            className: 'text-xl',
                            children: completionStatus.candidate ? '✅' : '⭕',
                          }),
                          _jsx('span', { className: 'font-semibold', children: 'Biodata' }),
                        ],
                      }),
                      _jsx('p', {
                        className: 'text-sm text-secondary',
                        children: 'Personal information',
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    className: `p-4 rounded-lg border-2 ${completionStatus.nextOfKin ? 'border-success bg-success-light' : 'border-gray-300 bg-gray-50'}`,
                    children: [
                      _jsxs('div', {
                        className: 'flex items-center gap-2 mb-2',
                        children: [
                          _jsx('span', {
                            className: 'text-xl',
                            children: completionStatus.nextOfKin ? '✅' : '⭕',
                          }),
                          _jsx('span', { className: 'font-semibold', children: 'Next of Kin' }),
                        ],
                      }),
                      _jsx('p', {
                        className: 'text-sm text-secondary',
                        children: 'Emergency contact',
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    className: `p-4 rounded-lg border-2 ${completionStatus.sponsor ? 'border-success bg-success-light' : 'border-gray-300 bg-gray-50'}`,
                    children: [
                      _jsxs('div', {
                        className: 'flex items-center gap-2 mb-2',
                        children: [
                          _jsx('span', {
                            className: 'text-xl',
                            children: completionStatus.sponsor ? '✅' : '⭕',
                          }),
                          _jsx('span', { className: 'font-semibold', children: 'Sponsor' }),
                        ],
                      }),
                      _jsx('p', {
                        className: 'text-sm text-secondary',
                        children: 'Financial sponsor',
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    className: `p-4 rounded-lg border-2 ${completionStatus.education ? 'border-success bg-success-light' : 'border-gray-300 bg-gray-50'}`,
                    children: [
                      _jsxs('div', {
                        className: 'flex items-center gap-2 mb-2',
                        children: [
                          _jsx('span', {
                            className: 'text-xl',
                            children: completionStatus.education ? '✅' : '⭕',
                          }),
                          _jsx('span', { className: 'font-semibold', children: 'Education' }),
                        ],
                      }),
                      _jsx('p', {
                        className: 'text-sm text-secondary',
                        children: 'Academic records',
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    className: `p-4 rounded-lg border-2 ${completionStatus.documents ? 'border-success bg-success-light' : 'border-gray-300 bg-gray-50'}`,
                    children: [
                      _jsxs('div', {
                        className: 'flex items-center gap-2 mb-2',
                        children: [
                          _jsx('span', {
                            className: 'text-xl',
                            children: completionStatus.documents ? '✅' : '⭕',
                          }),
                          _jsx('span', { className: 'font-semibold', children: 'Documents' }),
                        ],
                      }),
                      _jsx('p', {
                        className: 'text-sm text-secondary',
                        children: 'Required uploads',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      _jsxs('div', {
        className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6',
        children: [
          _jsxs('div', {
            className: 'card',
            children: [
              _jsx('div', {
                className: 'card-header',
                children: _jsx('h3', { className: 'card-title', children: 'Complete Biodata' }),
              }),
              _jsxs('div', {
                className: 'p-4',
                children: [
                  _jsx('p', {
                    className: 'text-secondary mb-4',
                    children: 'Fill in your personal information and contact details',
                  }),
                  _jsx(Link, {
                    to: `/candidate/${candidateId}/profile`,
                    className: 'btn btn-primary w-full',
                    children: completionStatus.candidate ? 'Update Profile' : 'Start Profile',
                  }),
                ],
              }),
            ],
          }),
          _jsxs('div', {
            className: 'card',
            children: [
              _jsx('div', {
                className: 'card-header',
                children: _jsx('h3', { className: 'card-title', children: 'Next of Kin' }),
              }),
              _jsxs('div', {
                className: 'p-4',
                children: [
                  _jsx('p', {
                    className: 'text-secondary mb-4',
                    children: 'Add emergency contact and next of kin information',
                  }),
                  _jsx(Link, {
                    to: `/candidate/${candidateId}/next-of-kin`,
                    className: 'btn btn-primary w-full',
                    children: completionStatus.nextOfKin ? 'Update NOK' : 'Add NOK',
                  }),
                ],
              }),
            ],
          }),
          _jsxs('div', {
            className: 'card',
            children: [
              _jsx('div', {
                className: 'card-header',
                children: _jsx('h3', { className: 'card-title', children: 'Sponsor Information' }),
              }),
              _jsxs('div', {
                className: 'p-4',
                children: [
                  _jsx('p', {
                    className: 'text-secondary mb-4',
                    children: 'Provide sponsor details for financial support',
                  }),
                  _jsx(Link, {
                    to: `/candidate/${candidateId}/sponsor`,
                    className: 'btn btn-primary w-full',
                    children: completionStatus.sponsor ? 'Update Sponsor' : 'Add Sponsor',
                  }),
                ],
              }),
            ],
          }),
          _jsxs('div', {
            className: 'card',
            children: [
              _jsx('div', {
                className: 'card-header',
                children: _jsx('h3', { className: 'card-title', children: 'Education Records' }),
              }),
              _jsxs('div', {
                className: 'p-4',
                children: [
                  _jsx('p', {
                    className: 'text-secondary mb-4',
                    children: 'Add your educational background and qualifications',
                  }),
                  _jsx(Link, {
                    to: `/candidate/${candidateId}/education`,
                    className: 'btn btn-primary w-full',
                    children: completionStatus.education ? 'Manage Records' : 'Add Education',
                  }),
                ],
              }),
            ],
          }),
          _jsxs('div', {
            className: 'card',
            children: [
              _jsx('div', {
                className: 'card-header',
                children: _jsx('h3', { className: 'card-title', children: 'Document Uploads' }),
              }),
              _jsxs('div', {
                className: 'p-4',
                children: [
                  _jsx('p', {
                    className: 'text-secondary mb-4',
                    children: 'Upload required documents and certificates',
                  }),
                  _jsx(Link, {
                    to: `/candidate/${candidateId}/documents`,
                    className: 'btn btn-primary w-full',
                    children: completionStatus.documents ? 'Manage Documents' : 'Upload Documents',
                  }),
                ],
              }),
            ],
          }),
          _jsxs('div', {
            className: 'card',
            children: [
              _jsx('div', {
                className: 'card-header',
                children: _jsx('h3', { className: 'card-title', children: 'Application Status' }),
              }),
              _jsxs('div', {
                className: 'p-4',
                children: [
                  _jsx('p', {
                    className: 'text-secondary mb-4',
                    children: 'Check your application progress and status',
                  }),
                  _jsx(Link, {
                    to: `/candidate/${candidateId}/application`,
                    className: 'btn btn-info w-full',
                    children: 'View Status',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      _jsxs('div', {
        className: 'card',
        children: [
          _jsx('div', {
            className: 'card-header',
            children: _jsx('h3', { className: 'card-title', children: 'Recent Activity' }),
          }),
          _jsx('div', {
            className: 'p-4',
            children:
              dashboard.payments && dashboard.payments.length > 0
                ? _jsxs('div', {
                    className: 'space-y-3',
                    children: [
                      _jsx('h4', { className: 'font-semibold mb-3', children: 'Recent Payments' }),
                      dashboard.payments
                        .slice(0, 3)
                        .map((payment) =>
                          _jsxs(
                            'div',
                            {
                              className:
                                'flex items-center justify-between p-3 bg-secondary rounded-lg',
                              children: [
                                _jsxs('div', {
                                  children: [
                                    _jsx('p', {
                                      className: 'font-medium',
                                      children: payment.purpose,
                                    }),
                                    _jsx('p', {
                                      className: 'text-sm text-secondary',
                                      children: new Date(payment.created_at).toLocaleDateString(),
                                    }),
                                  ],
                                }),
                                _jsxs('div', {
                                  className: 'text-right',
                                  children: [
                                    _jsxs('p', {
                                      className: 'font-semibold',
                                      children: ['\u20A6', payment.amount],
                                    }),
                                    _jsx('span', {
                                      className: `text-sm px-2 py-1 rounded-full ${
                                        payment.status === 'success'
                                          ? 'bg-success-light text-success'
                                          : payment.status === 'pending'
                                            ? 'bg-warning-light text-warning'
                                            : 'bg-error-light text-error'
                                      }`,
                                      children: payment.status,
                                    }),
                                  ],
                                }),
                              ],
                            },
                            payment.id
                          )
                        ),
                    ],
                  })
                : _jsx('div', {
                    className: 'text-center py-8',
                    children: _jsx('p', {
                      className: 'text-secondary',
                      children: 'No recent activity to display',
                    }),
                  }),
          }),
        ],
      }),
      _jsx('div', {
        className: 'text-center mt-8 p-4 border-t border-gray-200',
        children: _jsxs('div', {
          className: 'flex items-center justify-center gap-2 text-sm text-gray-600',
          children: [
            _jsx('span', { children: 'Powered by' }),
            _jsx(ICTBadge, { size: 20 }),
            _jsx('span', { children: 'ICT Division' }),
          ],
        }),
      }),
    ],
  });
};
export default CandidateDashboard;
