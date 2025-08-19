import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { LoginRequestSchema, LoginRequest } from '@fuep/types';

// Temporary type definition for development
interface LoginRequest {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    // Temporary validation for development
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Store tokens (in a real app, use secure storage)
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);

        // Redirect to dashboard or profile
        navigate('/dashboard');
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Login to FUEP Post-UTME Portal</h1>
        <p>Access your account using your JAMB registration number and password</p>
      </div>

      <div className="form-container">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Sign In</h2>
            <p className="card-subtitle">Enter your credentials to access your application</p>
          </div>

          {loginError && (
            <div className="alert alert-error">
              <strong>Login Error:</strong> {loginError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                JAMB Registration Number
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`form-input ${errors.username ? 'error' : ''}`}
                placeholder="Enter your JAMB registration number"
                disabled={isLoading}
              />
              {errors.username && <div className="form-error">{errors.username}</div>}
              <div className="form-help">
                This is the same number you used for JAMB registration
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>

            <div className="form-group">
              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Logging in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="text-center mt-6">
            <div className="mb-4">
              <a href="/forgot-password" className="text-info">
                Forgot your password?
              </a>
            </div>

            <div className="p-4 bg-secondary rounded-lg">
              <h4 className="mb-2">New to FUEP Post-UTME?</h4>
              <p className="text-secondary mb-3">
                If you haven't started your application yet, you'll need to begin the process first.
              </p>
              <a href="/apply" className="btn btn-secondary">
                Start New Application
              </a>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="card mt-6">
          <div className="card-header">
            <h3 className="card-title">Need Help?</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-primary mb-2">Technical Support</h4>
              <p className="text-secondary mb-2">
                Having trouble logging in or accessing the portal?
              </p>
              <a href="/support" className="btn btn-sm btn-secondary">
                Contact Support
              </a>
            </div>
            <div>
              <h4 className="text-primary mb-2">Application Status</h4>
              <p className="text-secondary mb-2">
                Check your application progress without logging in
              </p>
              <a href="/status" className="btn btn-sm btn-info">
                Check Status
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
