import React, { useEffect, useState } from 'react';

import ICTBadge from '../components/ICTBadge';
import { getApiBaseUrl, waitForConfig } from '../utils/config';

// Define the health status interface based on what the API actually returns
interface HealthStatus {
  status: string;
  uptime?: string;
  timestamp?: string;
}

const Status: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        // Wait for configuration to be loaded
        await waitForConfig();

        const apiUrl = getApiBaseUrl();
        console.log('Checking API status at:', apiUrl);

        const response = await fetch(`${apiUrl}/health`);
        if (response.ok) {
          const data = await response.json();
          setApiStatus(data);
        } else {
          setError(`API returned ${response.status}: ${response.statusText}`);
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

  const getStatusColor = (status: string | undefined) => {
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

  const getStatusIcon = (status: string | undefined) => {
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

  return (
    <div className="container">
      <div className="page-header">
        <h1>System Status</h1>
        <p>Check the current status of the FUEP Post-UTME Portal and related services</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Status */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">API Server Status</h2>
            <p className="card-subtitle">Backend service connectivity and health</p>
          </div>

          {isLoading ? (
            <div className="text-center p-6">
              <div
                className="spinner"
                style={{ width: '32px', height: '32px', margin: '0 auto 16px auto' }}
              ></div>
              <p className="text-secondary">Checking API status...</p>
            </div>
          ) : error ? (
            <div className="alert alert-error">
              <strong>Connection Error:</strong> {error}
            </div>
          ) : apiStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusIcon(apiStatus.status)}</span>
                  <div>
                    <h3 className="font-semibold">API Health</h3>
                    <p className="text-secondary">Backend service</p>
                  </div>
                </div>
                <span className={`text-lg font-semibold ${getStatusColor(apiStatus.status)}`}>
                  {apiStatus.status}
                </span>
              </div>

              {apiStatus.uptime && (
                <div className="p-4 bg-tertiary rounded-lg">
                  <h4 className="font-semibold mb-2">Uptime</h4>
                  <p className="text-secondary">{apiStatus.uptime}</p>
                </div>
              )}

              {apiStatus.timestamp && (
                <div className="p-4 bg-tertiary rounded-lg">
                  <h4 className="font-semibold mb-2">Last Check</h4>
                  <p className="text-secondary">{new Date(apiStatus.timestamp).toLocaleString()}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="alert alert-warning">
              <strong>No Status Data:</strong> Unable to retrieve API status information
            </div>
          )}
        </div>

        {/* System Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">System Information</h2>
            <p className="card-subtitle">Portal details and version information</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg">
              <h4 className="font-semibold mb-2">Portal Version</h4>
              <p className="text-secondary">v1.0.0</p>
            </div>

            <div className="p-4 bg-secondary rounded-lg">
              <h4 className="font-semibold mb-2">Environment</h4>
              <p className="text-secondary">Development</p>
            </div>

            <div className="p-4 bg-secondary rounded-lg">
              <h4 className="font-semibold mb-2">Last Updated</h4>
              <p className="text-secondary">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Service Status Overview */}
      <div className="card mt-6">
        <div className="card-header">
          <h2 className="card-title">Service Status Overview</h2>
          <p className="card-subtitle">Current status of all portal services</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-success-light rounded-lg border-l-4 border-success">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <h4 className="font-semibold text-success">Web Frontend</h4>
                <p className="text-secondary text-sm">Operational</p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border-l-4 ${
              apiStatus?.status === 'healthy' || apiStatus?.status === 'ok'
                ? 'bg-success-light border-success'
                : 'bg-error-light border-error'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {apiStatus?.status === 'healthy' || apiStatus?.status === 'ok' ? '✅' : '❌'}
              </span>
              <div>
                <h4
                  className={`font-semibold ${
                    apiStatus?.status === 'healthy' || apiStatus?.status === 'ok'
                      ? 'text-success'
                      : 'text-error'
                  }`}
                >
                  API Backend
                </h4>
                <p className="text-secondary text-sm">
                  {apiStatus?.status === 'healthy' || apiStatus?.status === 'ok'
                    ? 'Operational'
                    : 'Issues Detected'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-warning-light rounded-lg border-l-4 border-warning">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="font-semibold text-warning">Database</h4>
                <p className="text-secondary text-sm">Limited Access</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mt-6">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-primary mb-2">Check Application Status</h4>
            <p className="text-secondary mb-3">
              Track your post-UTME application progress and status
            </p>
            <a href="/application-status" className="btn btn-primary">
              Check Application
            </a>
          </div>
          <div>
            <h4 className="text-primary mb-2">Payment Status</h4>
            <p className="text-secondary mb-3">
              Verify payment confirmations and download receipts
            </p>
            <a href="/payment-status" className="btn btn-info">
              Check Payments
            </a>
          </div>
        </div>
      </div>

      {/* Support Information */}
      <div className="card mt-6">
        <div className="card-header">
          <h3 className="card-title">Need Technical Support?</h3>
        </div>
        <div className="text-center">
          <p className="text-secondary mb-4">
            If you're experiencing technical issues or need assistance, our support team is
            available to help.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="/support" className="btn btn-secondary">
              Contact Support
            </a>
            <a href="/faq" className="btn btn-info">
              Technical FAQ
            </a>
            <a href="mailto:ict@fuep.edu.ng" className="btn btn-primary">
              Email ICT Team
            </a>
          </div>
        </div>
      </div>

      {/* ICT Badge Attribution */}
      <div className="text-center mt-8 p-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <span>Powered by</span>
          <ICTBadge size={20} />
          <span>ICT Division</span>
        </div>
      </div>
    </div>
  );
};

export default Status;
