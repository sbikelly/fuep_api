import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import ICTBadge from '../components/ICTBadge';

interface ProfileCompletionStatus {
  candidate: boolean;
  nextOfKin: boolean;
  sponsor: boolean;
  education: boolean;
  documents: boolean;
  overall: number;
}

interface CandidateDashboard {
  profile: any;
  nextOfKin: any;
  sponsor: any;
  educationRecords: any[];
  uploads: any[];
  application: any;
  payments: any[];
  completionStatus: ProfileCompletionStatus;
}

const CandidateDashboard: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [dashboard, setDashboard] = useState<CandidateDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

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
      } catch (err) {
        setError('Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    };

    if (candidateId) {
      fetchDashboard();
    }
  }, [candidateId]);

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-error';
  };

  const getCompletionIcon = (percentage: number) => {
    if (percentage >= 80) return '✅';
    if (percentage >= 60) return '⚠️';
    return '❌';
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="text-center p-8">
          <div
            className="spinner"
            style={{ width: '48px', height: '48px', margin: '0 auto 16px auto' }}
          ></div>
          <p className="text-secondary">Loading candidate dashboard...</p>
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
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container">
        <div className="alert alert-warning">
          <strong>No Data:</strong> Dashboard information not available
        </div>
      </div>
    );
  }

  const { completionStatus } = dashboard;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Candidate Dashboard</h1>
        <p>Complete your post-UTME application profile</p>
      </div>

      {/* Profile Completion Overview */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="card-title">Profile Completion Status</h2>
          <p className="card-subtitle">Track your application progress</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{getCompletionIcon(completionStatus.overall)}</span>
              <div>
                <h3 className="text-2xl font-bold">Overall Progress</h3>
                <p className="text-secondary">Complete your profile to proceed</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getCompletionColor(completionStatus.overall)}`}>
                {completionStatus.overall}%
              </div>
              <div className="text-secondary">Complete</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
            <div
              className="bg-primary h-4 rounded-full transition-all duration-500"
              style={{ width: `${completionStatus.overall}%` }}
            ></div>
          </div>

          {/* Section Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div
              className={`p-4 rounded-lg border-2 ${completionStatus.candidate ? 'border-success bg-success-light' : 'border-gray-300 bg-gray-50'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{completionStatus.candidate ? '✅' : '⭕'}</span>
                <span className="font-semibold">Biodata</span>
              </div>
              <p className="text-sm text-secondary">Personal information</p>
            </div>

            <div
              className={`p-4 rounded-lg border-2 ${completionStatus.nextOfKin ? 'border-success bg-success-light' : 'border-gray-300 bg-gray-50'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{completionStatus.nextOfKin ? '✅' : '⭕'}</span>
                <span className="font-semibold">Next of Kin</span>
              </div>
              <p className="text-sm text-secondary">Emergency contact</p>
            </div>

            <div
              className={`p-4 rounded-lg border-2 ${completionStatus.sponsor ? 'border-success bg-success-light' : 'border-gray-300 bg-gray-50'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{completionStatus.sponsor ? '✅' : '⭕'}</span>
                <span className="font-semibold">Sponsor</span>
              </div>
              <p className="text-sm text-secondary">Financial sponsor</p>
            </div>

            <div
              className={`p-4 rounded-lg border-2 ${completionStatus.education ? 'border-success bg-success-light' : 'border-gray-300 bg-gray-50'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{completionStatus.education ? '✅' : '⭕'}</span>
                <span className="font-semibold">Education</span>
              </div>
              <p className="text-sm text-secondary">Academic records</p>
            </div>

            <div
              className={`p-4 rounded-lg border-2 ${completionStatus.documents ? 'border-success bg-success-light' : 'border-gray-300 bg-gray-50'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{completionStatus.documents ? '✅' : '⭕'}</span>
                <span className="font-semibold">Documents</span>
              </div>
              <p className="text-sm text-secondary">Required uploads</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Complete Biodata</h3>
          </div>
          <div className="p-4">
            <p className="text-secondary mb-4">
              Fill in your personal information and contact details
            </p>
            <Link to={`/candidate/${candidateId}/profile`} className="btn btn-primary w-full">
              {completionStatus.candidate ? 'Update Profile' : 'Start Profile'}
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Next of Kin</h3>
          </div>
          <div className="p-4">
            <p className="text-secondary mb-4">Add emergency contact and next of kin information</p>
            <Link to={`/candidate/${candidateId}/next-of-kin`} className="btn btn-primary w-full">
              {completionStatus.nextOfKin ? 'Update NOK' : 'Add NOK'}
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Sponsor Information</h3>
          </div>
          <div className="p-4">
            <p className="text-secondary mb-4">Provide sponsor details for financial support</p>
            <Link to={`/candidate/${candidateId}/sponsor`} className="btn btn-primary w-full">
              {completionStatus.sponsor ? 'Update Sponsor' : 'Add Sponsor'}
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Education Records</h3>
          </div>
          <div className="p-4">
            <p className="text-secondary mb-4">
              Add your educational background and qualifications
            </p>
            <Link to={`/candidate/${candidateId}/education`} className="btn btn-primary w-full">
              {completionStatus.education ? 'Manage Records' : 'Add Education'}
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Document Uploads</h3>
          </div>
          <div className="p-4">
            <p className="text-secondary mb-4">Upload required documents and certificates</p>
            <Link to={`/candidate/${candidateId}/documents`} className="btn btn-primary w-full">
              {completionStatus.documents ? 'Manage Documents' : 'Upload Documents'}
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Application Status</h3>
          </div>
          <div className="p-4">
            <p className="text-secondary mb-4">Check your application progress and status</p>
            <Link to={`/candidate/${candidateId}/application`} className="btn btn-info w-full">
              View Status
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Activity</h3>
        </div>
        <div className="p-4">
          {dashboard.payments && dashboard.payments.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-semibold mb-3">Recent Payments</h4>
              {dashboard.payments.slice(0, 3).map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div>
                    <p className="font-medium">{payment.purpose}</p>
                    <p className="text-sm text-secondary">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₦{payment.amount}</p>
                    <span
                      className={`text-sm px-2 py-1 rounded-full ${
                        payment.status === 'success'
                          ? 'bg-success-light text-success'
                          : payment.status === 'pending'
                            ? 'bg-warning-light text-warning'
                            : 'bg-error-light text-error'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-secondary">No recent activity to display</p>
            </div>
          )}
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

export default CandidateDashboard;
