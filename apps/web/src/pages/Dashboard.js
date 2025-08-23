import { useEffect, useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Link, useNavigate } from 'react-router-dom';

import { getApiBaseUrl } from '../utils/config';
const Dashboard = () => {
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCandidateData(token);
  }, [navigate]);
  const fetchCandidateData = async (token) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/candidates/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setCandidate(data.candidate);
        setPayments(data.payments || []);
      } else {
        setError('Failed to load candidate data');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/');
  };
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'paid':
        return 'text-success';
      case 'pending':
      case 'in_progress':
        return 'text-warning';
      case 'failed':
      case 'rejected':
        return 'text-error';
      default:
        return 'text-secondary';
    }
  };
  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'paid':
        return '✅';
      case 'pending':
      case 'in_progress':
        return '⏳';
      case 'failed':
      case 'rejected':
        return '❌';
      default:
        return 'ℹ️';
    }
  };
  if (isLoading) {
    return _jsx('div', {
      className: 'container',
      children: _jsx('div', {
        className: 'flex items-center justify-center min-h-screen',
        children: _jsxs('div', {
          className: 'text-center',
          children: [
            _jsx('div', { className: 'spinner mx-auto mb-4' }),
            _jsx('p', { children: 'Loading your dashboard...' }),
          ],
        }),
      }),
    });
  }
  if (error) {
    return _jsxs('div', {
      className: 'container',
      children: [
        _jsxs('div', {
          className: 'alert alert-error',
          children: [_jsx('strong', { children: 'Error:' }), ' ', error],
        }),
        _jsx('button', {
          onClick: () => window.location.reload(),
          className: 'btn btn-primary',
          children: 'Retry',
        }),
      ],
    });
  }
  if (!candidate) {
    return _jsx('div', {
      className: 'container',
      children: _jsxs('div', {
        className: 'alert alert-error',
        children: [_jsx('strong', { children: 'Error:' }), ' No candidate data found'],
      }),
    });
  }
  return _jsxs('div', {
    className: 'container',
    children: [
      _jsx('div', {
        className: 'page-header',
        children: _jsxs('div', {
          className: 'flex justify-between items-start',
          children: [
            _jsxs('div', {
              children: [
                _jsxs('h1', {
                  children: ['Welcome, ', candidate.firstName, ' ', candidate.lastName, '!'],
                }),
                _jsx('p', {
                  children: 'Manage your FUEP Post-UTME application and track your progress',
                }),
              ],
            }),
            _jsx('button', {
              onClick: handleLogout,
              className: 'btn btn-outline',
              children: 'Logout',
            }),
          ],
        }),
      }),
      _jsxs('div', {
        className: 'grid grid-cols-1 md:grid-cols-4 gap-6 mb-8',
        children: [
          _jsxs('div', {
            className: 'card text-center',
            children: [
              _jsx('div', {
                className: 'text-3xl font-bold text-primary mb-2',
                children: candidate.jambRegNo,
              }),
              _jsx('div', { className: 'text-secondary', children: 'JAMB Number' }),
            ],
          }),
          _jsxs('div', {
            className: 'card text-center',
            children: [
              _jsx('div', {
                className: 'text-3xl font-bold text-primary mb-2',
                children: candidate.applicationStatus,
              }),
              _jsx('div', { className: 'text-secondary', children: 'Application Status' }),
            ],
          }),
          _jsxs('div', {
            className: 'card text-center',
            children: [
              _jsx('div', {
                className: 'text-3xl font-bold text-primary mb-2',
                children: candidate.paymentStatus,
              }),
              _jsx('div', { className: 'text-secondary', children: 'Payment Status' }),
            ],
          }),
          _jsxs('div', {
            className: 'card text-center',
            children: [
              _jsx('div', {
                className: 'text-3xl font-bold text-primary mb-2',
                children: candidate.admissionStatus || 'Pending',
              }),
              _jsx('div', { className: 'text-secondary', children: 'Admission Status' }),
            ],
          }),
        ],
      }),
      _jsxs('div', {
        className: 'card mb-8',
        children: [
          _jsxs('div', {
            className: 'card-header',
            children: [
              _jsx('h2', { className: 'card-title', children: 'Application Progress' }),
              _jsx('p', {
                className: 'card-subtitle',
                children: 'Track your application completion status',
              }),
            ],
          }),
          _jsxs('div', {
            className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
            children: [
              _jsxs('div', {
                className: `p-4 rounded-lg border ${candidate.biodataComplete ? 'border-success bg-success/10' : 'border-secondary bg-secondary/10'}`,
                children: [
                  _jsxs('div', {
                    className: 'flex items-center justify-between mb-2',
                    children: [
                      _jsx('h4', { className: 'font-semibold', children: 'Biodata' }),
                      _jsx('span', {
                        className: getStatusColor(
                          candidate.biodataComplete ? 'completed' : 'pending'
                        ),
                        children: getStatusIcon(
                          candidate.biodataComplete ? 'completed' : 'pending'
                        ),
                      }),
                    ],
                  }),
                  _jsx('p', {
                    className: 'text-sm text-secondary',
                    children: candidate.biodataComplete
                      ? 'Personal information completed'
                      : 'Personal information pending',
                  }),
                  _jsx(Link, {
                    to: '/profile',
                    className: 'btn btn-sm btn-primary mt-2 w-full',
                    children: candidate.biodataComplete ? 'View/Edit' : 'Complete',
                  }),
                ],
              }),
              _jsxs('div', {
                className: `p-4 rounded-lg border ${candidate.educationComplete ? 'border-success bg-success/10' : 'border-secondary bg-secondary/10'}`,
                children: [
                  _jsxs('div', {
                    className: 'flex items-center justify-between mb-2',
                    children: [
                      _jsx('h4', { className: 'font-semibold', children: 'Education' }),
                      _jsx('span', {
                        className: getStatusColor(
                          candidate.educationComplete ? 'completed' : 'pending'
                        ),
                        children: getStatusIcon(
                          candidate.educationComplete ? 'completed' : 'pending'
                        ),
                      }),
                    ],
                  }),
                  _jsx('p', {
                    className: 'text-sm text-secondary',
                    children: candidate.educationComplete
                      ? 'Educational records completed'
                      : 'Educational records pending',
                  }),
                  _jsx(Link, {
                    to: '/education',
                    className: 'btn btn-sm btn-primary mt-2 w-full',
                    children: candidate.educationComplete ? 'View/Edit' : 'Complete',
                  }),
                ],
              }),
              _jsxs('div', {
                className: `p-4 rounded-lg border ${candidate.nokComplete ? 'border-success bg-success/10' : 'border-secondary bg-secondary/10'}`,
                children: [
                  _jsxs('div', {
                    className: 'flex items-center justify-between mb-2',
                    children: [
                      _jsx('h4', { className: 'font-semibold', children: 'Next of Kin' }),
                      _jsx('span', {
                        className: getStatusColor(candidate.nokComplete ? 'completed' : 'pending'),
                        children: getStatusIcon(candidate.nokComplete ? 'completed' : 'pending'),
                      }),
                    ],
                  }),
                  _jsx('p', {
                    className: 'text-sm text-secondary',
                    children: candidate.nokComplete
                      ? 'Next of kin information completed'
                      : 'Next of kin information pending',
                  }),
                  _jsx(Link, {
                    to: '/nok',
                    className: 'btn btn-sm btn-primary mt-2 w-full',
                    children: candidate.nokComplete ? 'View/Edit' : 'Complete',
                  }),
                ],
              }),
              _jsxs('div', {
                className: `p-4 rounded-lg border ${candidate.sponsorComplete ? 'border-success bg-success/10' : 'border-secondary bg-secondary/10'}`,
                children: [
                  _jsxs('div', {
                    className: 'flex items-center justify-between mb-2',
                    children: [
                      _jsx('h4', { className: 'font-semibold', children: 'Sponsor' }),
                      _jsx('span', {
                        className: getStatusColor(
                          candidate.sponsorComplete ? 'completed' : 'pending'
                        ),
                        children: getStatusIcon(
                          candidate.sponsorComplete ? 'completed' : 'pending'
                        ),
                      }),
                    ],
                  }),
                  _jsx('p', {
                    className: 'text-sm text-secondary',
                    children: candidate.sponsorComplete
                      ? 'Sponsor information completed'
                      : 'Sponsor information pending',
                  }),
                  _jsx(Link, {
                    to: '/sponsor',
                    className: 'btn btn-sm btn-primary mt-2 w-full',
                    children: candidate.sponsorComplete ? 'View/Edit' : 'Complete',
                  }),
                ],
              }),
              _jsxs('div', {
                className: `p-4 rounded-lg border ${candidate.formPrinted ? 'border-success bg-success/10' : 'border-secondary bg-secondary/10'}`,
                children: [
                  _jsxs('div', {
                    className: 'flex items-center justify-between mb-2',
                    children: [
                      _jsx('h4', { className: 'font-semibold', children: 'Registration Form' }),
                      _jsx('span', {
                        className: getStatusColor(candidate.formPrinted ? 'completed' : 'pending'),
                        children: getStatusIcon(candidate.formPrinted ? 'completed' : 'pending'),
                      }),
                    ],
                  }),
                  _jsx('p', {
                    className: 'text-sm text-secondary',
                    children: candidate.formPrinted
                      ? 'Form printed successfully'
                      : 'Form printing pending',
                  }),
                  _jsx(Link, {
                    to: '/print-form',
                    className: 'btn btn-sm btn-primary mt-2 w-full',
                    children: candidate.formPrinted ? 'Re-print' : 'Print Form',
                  }),
                ],
              }),
              _jsxs('div', {
                className: `p-4 rounded-lg border ${candidate.screeningAttended ? 'border-success bg-success/10' : 'border-secondary bg-secondary/10'}`,
                children: [
                  _jsxs('div', {
                    className: 'flex items-center justify-between mb-2',
                    children: [
                      _jsx('h4', { className: 'font-semibold', children: 'Screening' }),
                      _jsx('span', {
                        className: getStatusColor(
                          candidate.screeningAttended ? 'completed' : 'pending'
                        ),
                        children: getStatusIcon(
                          candidate.screeningAttended ? 'completed' : 'pending'
                        ),
                      }),
                    ],
                  }),
                  _jsx('p', {
                    className: 'text-sm text-secondary',
                    children: candidate.screeningAttended
                      ? 'Screening attended'
                      : 'Screening pending',
                  }),
                  _jsx(Link, {
                    to: '/screening',
                    className: 'btn btn-sm btn-primary mt-2 w-full',
                    children: candidate.screeningAttended ? 'View Details' : 'Check Schedule',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      _jsxs('div', {
        className: 'card mb-8',
        children: [
          _jsxs('div', {
            className: 'card-header',
            children: [
              _jsx('h2', { className: 'card-title', children: 'Recent Payments' }),
              _jsx('p', {
                className: 'card-subtitle',
                children: 'Track your payment history and status',
              }),
            ],
          }),
          payments.length > 0
            ? _jsx('div', {
                className: 'overflow-x-auto',
                children: _jsxs('table', {
                  className: 'w-full',
                  children: [
                    _jsx('thead', {
                      children: _jsxs('tr', {
                        className: 'border-b',
                        children: [
                          _jsx('th', { className: 'text-left p-3', children: 'Purpose' }),
                          _jsx('th', { className: 'text-left p-3', children: 'Amount' }),
                          _jsx('th', { className: 'text-left p-3', children: 'Status' }),
                          _jsx('th', { className: 'text-left p-3', children: 'Provider' }),
                          _jsx('th', { className: 'text-left p-3', children: 'Date' }),
                          _jsx('th', { className: 'text-left p-3', children: 'Actions' }),
                        ],
                      }),
                    }),
                    _jsx('tbody', {
                      children: payments.map((payment) =>
                        _jsxs(
                          'tr',
                          {
                            className: 'border-b hover:bg-secondary/5',
                            children: [
                              _jsx('td', { className: 'p-3', children: payment.purpose }),
                              _jsxs('td', {
                                className: 'p-3',
                                children: ['\u20A6', payment.amount.toLocaleString()],
                              }),
                              _jsx('td', {
                                className: 'p-3',
                                children: _jsxs('span', {
                                  className: getStatusColor(payment.status),
                                  children: [getStatusIcon(payment.status), ' ', payment.status],
                                }),
                              }),
                              _jsx('td', { className: 'p-3', children: payment.provider }),
                              _jsx('td', {
                                className: 'p-3',
                                children: new Date(payment.createdAt).toLocaleDateString(),
                              }),
                              _jsx('td', {
                                className: 'p-3',
                                children: _jsx(Link, {
                                  to: `/payment/${payment.id}`,
                                  className: 'btn btn-sm btn-outline',
                                  children: 'View Details',
                                }),
                              }),
                            ],
                          },
                          payment.id
                        )
                      ),
                    }),
                  ],
                }),
              })
            : _jsxs('div', {
                className: 'text-center py-8',
                children: [
                  _jsx('p', { className: 'text-secondary mb-4', children: 'No payments found' }),
                  _jsx(Link, {
                    to: '/payment',
                    className: 'btn btn-primary',
                    children: 'Make a Payment',
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
            children: _jsx('h2', { className: 'card-title', children: 'Quick Actions' }),
          }),
          _jsxs('div', {
            className: 'grid grid-cols-1 md:grid-cols-3 gap-4',
            children: [
              _jsx(Link, {
                to: '/payment',
                className: 'btn btn-primary btn-full',
                children: 'Make Payment',
              }),
              _jsx(Link, {
                to: '/profile',
                className: 'btn btn-secondary btn-full',
                children: 'Update Profile',
              }),
              _jsx(Link, {
                to: '/status',
                className: 'btn btn-info btn-full',
                children: 'Check Status',
              }),
            ],
          }),
        ],
      }),
    ],
  });
};
export default Dashboard;
