import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getApiBaseUrl } from '../utils/config';

interface Candidate {
  id: string;
  jambRegNo: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone: string;
  applicationStatus: string;
  paymentStatus: string;
  biodataComplete: boolean;
  educationComplete: boolean;
  nokComplete: boolean;
  sponsorComplete: boolean;
  formPrinted: boolean;
  screeningAttended: boolean;
  admissionStatus: string;
  matricNo?: string;
}

interface Payment {
  id: string;
  purpose: string;
  amount: number;
  status: string;
  provider: string;
  providerRef: string;
  createdAt: string;
  updatedAt: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchCandidateData(token);
  }, [navigate]);

  const fetchCandidateData = async (token: string) => {
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

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
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
    return (
      <div className="container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <strong>Error:</strong> No candidate data found
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="page-header">
        <div className="flex justify-between items-start">
          <div>
            <h1>
              Welcome, {candidate.firstName} {candidate.lastName}!
            </h1>
            <p>Manage your FUEP Post-UTME application and track your progress</p>
          </div>
          <button onClick={handleLogout} className="btn btn-outline">
            Logout
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary mb-2">{candidate.jambRegNo}</div>
          <div className="text-secondary">JAMB Number</div>
        </div>

        <div className="card text-center">
          <div className="text-3xl font-bold text-primary mb-2">{candidate.applicationStatus}</div>
          <div className="text-secondary">Application Status</div>
        </div>

        <div className="card text-center">
          <div className="text-3xl font-bold text-primary mb-2">{candidate.paymentStatus}</div>
          <div className="text-secondary">Payment Status</div>
        </div>

        <div className="card text-center">
          <div className="text-3xl font-bold text-primary mb-2">
            {candidate.admissionStatus || 'Pending'}
          </div>
          <div className="text-secondary">Admission Status</div>
        </div>
      </div>

      {/* Application Progress */}
      <div className="card mb-8">
        <div className="card-header">
          <h2 className="card-title">Application Progress</h2>
          <p className="card-subtitle">Track your application completion status</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            className={`p-4 rounded-lg border ${candidate.biodataComplete ? 'border-success bg-success/10' : 'border-secondary bg-secondary/10'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Biodata</h4>
              <span className={getStatusColor(candidate.biodataComplete ? 'completed' : 'pending')}>
                {getStatusIcon(candidate.biodataComplete ? 'completed' : 'pending')}
              </span>
            </div>
            <p className="text-sm text-secondary">
              {candidate.biodataComplete
                ? 'Personal information completed'
                : 'Personal information pending'}
            </p>
            <Link to="/profile" className="btn btn-sm btn-primary mt-2 w-full">
              {candidate.biodataComplete ? 'View/Edit' : 'Complete'}
            </Link>
          </div>

          <div
            className={`p-4 rounded-lg border ${candidate.educationComplete ? 'border-success bg-success/10' : 'border-secondary bg-secondary/10'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Education</h4>
              <span
                className={getStatusColor(candidate.educationComplete ? 'completed' : 'pending')}
              >
                {getStatusIcon(candidate.educationComplete ? 'completed' : 'pending')}
              </span>
            </div>
            <p className="text-sm text-secondary">
              {candidate.educationComplete
                ? 'Educational records completed'
                : 'Educational records pending'}
            </p>
            <Link to="/education" className="btn btn-sm btn-primary mt-2 w-full">
              {candidate.educationComplete ? 'View/Edit' : 'Complete'}
            </Link>
          </div>

          <div
            className={`p-4 rounded-lg border ${candidate.nokComplete ? 'border-success bg-success/10' : 'border-secondary bg-secondary/10'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Next of Kin</h4>
              <span className={getStatusColor(candidate.nokComplete ? 'completed' : 'pending')}>
                {getStatusIcon(candidate.nokComplete ? 'completed' : 'pending')}
              </span>
            </div>
            <p className="text-sm text-secondary">
              {candidate.nokComplete
                ? 'Next of kin information completed'
                : 'Next of kin information pending'}
            </p>
            <Link to="/nok" className="btn btn-sm btn-primary mt-2 w-full">
              {candidate.nokComplete ? 'View/Edit' : 'Complete'}
            </Link>
          </div>

          <div
            className={`p-4 rounded-lg border ${candidate.sponsorComplete ? 'border-success bg-success/10' : 'border-secondary bg-secondary/10'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Sponsor</h4>
              <span className={getStatusColor(candidate.sponsorComplete ? 'completed' : 'pending')}>
                {getStatusIcon(candidate.sponsorComplete ? 'completed' : 'pending')}
              </span>
            </div>
            <p className="text-sm text-secondary">
              {candidate.sponsorComplete
                ? 'Sponsor information completed'
                : 'Sponsor information pending'}
            </p>
            <Link to="/sponsor" className="btn btn-sm btn-primary mt-2 w-full">
              {candidate.sponsorComplete ? 'View/Edit' : 'Complete'}
            </Link>
          </div>

          <div
            className={`p-4 rounded-lg border ${candidate.formPrinted ? 'border-success bg-success/10' : 'border-secondary bg-secondary/10'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Registration Form</h4>
              <span className={getStatusColor(candidate.formPrinted ? 'completed' : 'pending')}>
                {getStatusIcon(candidate.formPrinted ? 'completed' : 'pending')}
              </span>
            </div>
            <p className="text-sm text-secondary">
              {candidate.formPrinted ? 'Form printed successfully' : 'Form printing pending'}
            </p>
            <Link to="/print-form" className="btn btn-sm btn-primary mt-2 w-full">
              {candidate.formPrinted ? 'Re-print' : 'Print Form'}
            </Link>
          </div>

          <div
            className={`p-4 rounded-lg border ${candidate.screeningAttended ? 'border-success bg-success/10' : 'border-secondary bg-secondary/10'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Screening</h4>
              <span
                className={getStatusColor(candidate.screeningAttended ? 'completed' : 'pending')}
              >
                {getStatusIcon(candidate.screeningAttended ? 'completed' : 'pending')}
              </span>
            </div>
            <p className="text-sm text-secondary">
              {candidate.screeningAttended ? 'Screening attended' : 'Screening pending'}
            </p>
            <Link to="/screening" className="btn btn-sm btn-primary mt-2 w-full">
              {candidate.screeningAttended ? 'View Details' : 'Check Schedule'}
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="card mb-8">
        <div className="card-header">
          <h2 className="card-title">Recent Payments</h2>
          <p className="card-subtitle">Track your payment history and status</p>
        </div>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Purpose</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Provider</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-secondary/5">
                    <td className="p-3">{payment.purpose}</td>
                    <td className="p-3">₦{payment.amount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={getStatusColor(payment.status)}>
                        {getStatusIcon(payment.status)} {payment.status}
                      </span>
                    </td>
                    <td className="p-3">{payment.provider}</td>
                    <td className="p-3">{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Link to={`/payment/${payment.id}`} className="btn btn-sm btn-outline">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-secondary mb-4">No payments found</p>
            <Link to="/payment" className="btn btn-primary">
              Make a Payment
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/payment" className="btn btn-primary btn-full">
            Make Payment
          </Link>
          <Link to="/profile" className="btn btn-secondary btn-full">
            Update Profile
          </Link>
          <Link to="/status" className="btn btn-info btn-full">
            Check Status
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
