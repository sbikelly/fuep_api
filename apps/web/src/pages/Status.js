import { useEffect, useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';

import ICTBadge from '../components/ICTBadge';
import { getApiBaseUrl, waitForConfig } from '../utils/config';
const Status = () => {
  const [apiStatus, setApiStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        // Wait for configuration to be loaded
        await waitForConfig();
        const apiUrl = getApiBaseUrl();
        console.log('Checking API status at:', apiUrl);
        const response = await fetch(`${apiUrl}/health`, {
          headers: { Accept: 'application/json, */*' },
        });
        const contentType = response.headers.get('content-type') || '';
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          console.error('API non-OK response:', response.status, response.statusText, text);
          setError(
            `API ${response.status} ${response.statusText}${text ? ` — ${text.slice(0, 200)}` : ''}`
          );
          return;
        }
        try {
          let parsed;
          if (contentType.includes('application/json')) {
            parsed = await response.json();
          } else {
            // Fallback: non-JSON response (e.g., HTML error page proxied back)
            const text = await response.text();
            console.error('Expected JSON but got:', contentType, 'Body:', text);
            setError('API returned non-JSON response');
            return;
          }
          // Normalize shape: accept either { status, ... } or { success, data: { status, ... } }
          const payload = parsed?.data ?? parsed;
          const normalized = {
            status: payload?.status ?? (parsed?.success ? 'ok' : 'unknown'),
            uptime: payload?.uptime,
            timestamp: payload?.timestamp,
          };
          setApiStatus(normalized);
        } catch (parseErr) {
          console.error('Failed to parse API response as JSON:', parseErr);
          setError('Failed to parse API response as JSON');
        }
      } catch (err) {
        console.error('API check failed:', err);
        setError('Failed to connect to API server');
      } finally {
        setIsLoading(false);
      }
    };
    checkApiStatus();
  }, []);
  const getStatusColor = (status) => {
    if (!status) return 'text-secondary';
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'ok':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
      case 'unhealthy':
        return 'text-error';
      default:
        return 'text-secondary';
    }
  };
  const getStatusIcon = (status) => {
    if (!status) return '❓';
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'ok':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
      case 'unhealthy':
        return '❌';
      default:
        return '❓';
    }
  };
  return _jsxs('div', {
    className: 'container',
    children: [
      _jsxs('div', {
        className: 'page-header',
        children: [
          _jsx('h1', { children: 'System Status' }),
          _jsx('p', {
            children: 'Check the current status of the FUEP Post-UTME Portal and related services',
          }),
        ],
      }),
      _jsxs('div', {
        className: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
        children: [
          _jsxs('div', {
            className: 'card',
            children: [
              _jsxs('div', {
                className: 'card-header',
                children: [
                  _jsx('h2', { className: 'card-title', children: 'API Server Status' }),
                  _jsx('p', {
                    className: 'card-subtitle',
                    children: 'Backend service connectivity and health',
                  }),
                ],
              }),
              isLoading
                ? _jsxs('div', {
                    className: 'text-center p-6',
                    children: [
                      _jsx('div', {
                        className: 'spinner',
                        style: { width: '32px', height: '32px', margin: '0 auto 16px auto' },
                      }),
                      _jsx('p', {
                        className: 'text-secondary',
                        children: 'Checking API status...',
                      }),
                    ],
                  })
                : error
                  ? _jsxs('div', {
                      className: 'alert alert-error',
                      children: [_jsx('strong', { children: 'Connection Error:' }), ' ', error],
                    })
                  : apiStatus
                    ? _jsxs('div', {
                        className: 'space-y-4',
                        children: [
                          _jsxs('div', {
                            className:
                              'flex items-center justify-between p-4 bg-secondary rounded-lg',
                            children: [
                              _jsxs('div', {
                                className: 'flex items-center gap-3',
                                children: [
                                  _jsx('span', {
                                    className: 'text-2xl',
                                    children: getStatusIcon(apiStatus.status),
                                  }),
                                  _jsxs('div', {
                                    children: [
                                      _jsx('h3', {
                                        className: 'font-semibold',
                                        children: 'API Health',
                                      }),
                                      _jsx('p', {
                                        className: 'text-secondary',
                                        children: 'Backend service',
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              _jsx('span', {
                                className: `text-lg font-semibold ${getStatusColor(apiStatus.status)}`,
                                children: apiStatus.status,
                              }),
                            ],
                          }),
                          apiStatus.uptime &&
                            _jsxs('div', {
                              className: 'p-4 bg-tertiary rounded-lg',
                              children: [
                                _jsx('h4', { className: 'font-semibold mb-2', children: 'Uptime' }),
                                _jsx('p', {
                                  className: 'text-secondary',
                                  children: apiStatus.uptime,
                                }),
                              ],
                            }),
                          apiStatus.timestamp &&
                            _jsxs('div', {
                              className: 'p-4 bg-tertiary rounded-lg',
                              children: [
                                _jsx('h4', {
                                  className: 'font-semibold mb-2',
                                  children: 'Last Check',
                                }),
                                _jsx('p', {
                                  className: 'text-secondary',
                                  children: new Date(apiStatus.timestamp).toLocaleString(),
                                }),
                              ],
                            }),
                        ],
                      })
                    : _jsxs('div', {
                        className: 'alert alert-warning',
                        children: [
                          _jsx('strong', { children: 'No Status Data:' }),
                          ' Unable to retrieve API status information',
                        ],
                      }),
            ],
          }),
          _jsxs('div', {
            className: 'card',
            children: [
              _jsxs('div', {
                className: 'card-header',
                children: [
                  _jsx('h2', { className: 'card-title', children: 'System Information' }),
                  _jsx('p', {
                    className: 'card-subtitle',
                    children: 'Portal details and version information',
                  }),
                ],
              }),
              _jsxs('div', {
                className: 'space-y-4',
                children: [
                  _jsxs('div', {
                    className: 'p-4 bg-secondary rounded-lg',
                    children: [
                      _jsx('h4', { className: 'font-semibold mb-2', children: 'Portal Version' }),
                      _jsx('p', { className: 'text-secondary', children: 'v1.0.0' }),
                    ],
                  }),
                  _jsxs('div', {
                    className: 'p-4 bg-secondary rounded-lg',
                    children: [
                      _jsx('h4', { className: 'font-semibold mb-2', children: 'Environment' }),
                      _jsx('p', { className: 'text-secondary', children: 'Development' }),
                    ],
                  }),
                  _jsxs('div', {
                    className: 'p-4 bg-secondary rounded-lg',
                    children: [
                      _jsx('h4', { className: 'font-semibold mb-2', children: 'Last Updated' }),
                      _jsx('p', {
                        className: 'text-secondary',
                        children: new Date().toLocaleDateString(),
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
        className: 'card mt-6',
        children: [
          _jsxs('div', {
            className: 'card-header',
            children: [
              _jsx('h2', { className: 'card-title', children: 'Service Status Overview' }),
              _jsx('p', {
                className: 'card-subtitle',
                children: 'Current status of all portal services',
              }),
            ],
          }),
          _jsxs('div', {
            className: 'grid grid-cols-1 md:grid-cols-3 gap-4',
            children: [
              _jsx('div', {
                className: 'p-4 bg-success-light rounded-lg border-l-4 border-success',
                children: _jsxs('div', {
                  className: 'flex items-center gap-3',
                  children: [
                    _jsx('span', { className: 'text-2xl', children: '\u2705' }),
                    _jsxs('div', {
                      children: [
                        _jsx('h4', {
                          className: 'font-semibold text-success',
                          children: 'Web Frontend',
                        }),
                        _jsx('p', { className: 'text-secondary text-sm', children: 'Operational' }),
                      ],
                    }),
                  ],
                }),
              }),
              _jsx('div', {
                className: `p-4 rounded-lg border-l-4 ${
                  apiStatus?.status === 'healthy' || apiStatus?.status === 'ok'
                    ? 'bg-success-light border-success'
                    : 'bg-error-light border-error'
                }`,
                children: _jsxs('div', {
                  className: 'flex items-center gap-3',
                  children: [
                    _jsx('span', {
                      className: 'text-2xl',
                      children:
                        apiStatus?.status === 'healthy' || apiStatus?.status === 'ok' ? '✅' : '❌',
                    }),
                    _jsxs('div', {
                      children: [
                        _jsx('h4', {
                          className: `font-semibold ${
                            apiStatus?.status === 'healthy' || apiStatus?.status === 'ok'
                              ? 'text-success'
                              : 'text-error'
                          }`,
                          children: 'API Backend',
                        }),
                        _jsx('p', {
                          className: 'text-secondary text-sm',
                          children:
                            apiStatus?.status === 'healthy' || apiStatus?.status === 'ok'
                              ? 'Operational'
                              : 'Issues Detected',
                        }),
                      ],
                    }),
                  ],
                }),
              }),
              _jsx('div', {
                className: 'p-4 bg-warning-light rounded-lg border-l-4 border-warning',
                children: _jsxs('div', {
                  className: 'flex items-center gap-3',
                  children: [
                    _jsx('span', { className: 'text-2xl', children: '\u26A0\uFE0F' }),
                    _jsxs('div', {
                      children: [
                        _jsx('h4', {
                          className: 'font-semibold text-warning',
                          children: 'Database',
                        }),
                        _jsx('p', {
                          className: 'text-secondary text-sm',
                          children: 'Limited Access',
                        }),
                      ],
                    }),
                  ],
                }),
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
            children: _jsx('h3', { className: 'card-title', children: 'Quick Actions' }),
          }),
          _jsxs('div', {
            className: 'grid grid-cols-1 md:grid-cols-2 gap-6',
            children: [
              _jsxs('div', {
                children: [
                  _jsx('h4', {
                    className: 'text-primary mb-2',
                    children: 'Check Application Status',
                  }),
                  _jsx('p', {
                    className: 'text-secondary mb-3',
                    children: 'Track your post-UTME application progress and status',
                  }),
                  _jsx('a', {
                    href: '/application-status',
                    className: 'btn btn-primary',
                    children: 'Check Application',
                  }),
                ],
              }),
              _jsxs('div', {
                children: [
                  _jsx('h4', { className: 'text-primary mb-2', children: 'Payment Status' }),
                  _jsx('p', {
                    className: 'text-secondary mb-3',
                    children: 'Verify payment confirmations and download receipts',
                  }),
                  _jsx('a', {
                    href: '/payment-status',
                    className: 'btn btn-info',
                    children: 'Check Payments',
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
            children: _jsx('h3', { className: 'card-title', children: 'Need Technical Support?' }),
          }),
          _jsxs('div', {
            className: 'text-center',
            children: [
              _jsx('p', {
                className: 'text-secondary mb-4',
                children:
                  "If you're experiencing technical issues or need assistance, our support team is available to help.",
              }),
              _jsxs('div', {
                className: 'flex gap-4 justify-center flex-wrap',
                children: [
                  _jsx('a', {
                    href: '/support',
                    className: 'btn btn-secondary',
                    children: 'Contact Support',
                  }),
                  _jsx('a', { href: '/faq', className: 'btn btn-info', children: 'Technical FAQ' }),
                  _jsx('a', {
                    href: 'mailto:ict@fuep.edu.ng',
                    className: 'btn btn-primary',
                    children: 'Email ICT Team',
                  }),
                ],
              }),
            ],
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
export default Status;
