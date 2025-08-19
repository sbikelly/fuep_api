import React, { useEffect,useState } from 'react';
import { Link,useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, changePassword } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string>('');

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordChangeData, setPasswordChangeData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordChangeErrors, setPasswordChangeErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Check if user needs to change password
  useEffect(() => {
    if (user?.tempPasswordFlag) {
      setShowPasswordChange(true);
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordChangeData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (passwordChangeErrors[name]) {
      setPasswordChangeErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
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

  const validatePasswordChange = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordChangeData.oldPassword.trim()) {
      newErrors.oldPassword = 'Current password is required';
    }

    if (!passwordChangeData.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordChangeData.newPassword.length < 8) {
      newErrors.newPassword = 'New password must be at least 8 characters long';
    }

    if (!passwordChangeData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordChangeErrors(newErrors);
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
      const success = await login(formData.username, formData.password);

      if (success) {
        // If user has temporary password, show password change form
        if (user?.tempPasswordFlag) {
          setShowPasswordChange(true);
        } else {
          // Redirect to intended page or dashboard
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        }
      } else {
        setLoginError('Invalid username or password');
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordChange()) {
      return;
    }

    setIsChangingPassword(true);
    try {
      const success = await changePassword(
        passwordChangeData.oldPassword,
        passwordChangeData.newPassword
      );

      if (success) {
        // Redirect to dashboard after successful password change
        navigate('/dashboard', { replace: true });
      } else {
        setPasswordChangeErrors({ oldPassword: 'Current password is incorrect' });
      }
    } catch (error) {
      setPasswordChangeErrors({ oldPassword: 'Failed to change password. Please try again.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // If user needs to change password, show password change form
  if (showPasswordChange) {
    return (
      <div className="container">
        <div className="page-header">
          <h1>Change Your Password</h1>
          <p>For security reasons, you must change your temporary password</p>
        </div>

        <div className="form-container">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Set New Password</h2>
              <p className="card-subtitle">Choose a strong password for your account</p>
            </div>

            <div className="alert alert-warning mb-4">
              <strong>Security Notice:</strong> You are using a temporary password. Please change it
              to a secure password of your choice.
            </div>

            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label htmlFor="oldPassword" className="form-label">
                  Current Password *
                </label>
                <input
                  type="password"
                  id="oldPassword"
                  name="oldPassword"
                  value={passwordChangeData.oldPassword}
                  onChange={handlePasswordChangeInput}
                  className={`form-input ${passwordChangeErrors.oldPassword ? 'error' : ''}`}
                  placeholder="Enter your current password"
                  disabled={isChangingPassword}
                  required
                />
                {passwordChangeErrors.oldPassword && (
                  <div className="form-error">{passwordChangeErrors.oldPassword}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="newPassword" className="form-label">
                  New Password *
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordChangeData.newPassword}
                  onChange={handlePasswordChangeInput}
                  className={`form-input ${passwordChangeErrors.newPassword ? 'error' : ''}`}
                  placeholder="Enter your new password"
                  disabled={isChangingPassword}
                  required
                />
                {passwordChangeErrors.newPassword && (
                  <div className="form-error">{passwordChangeErrors.newPassword}</div>
                )}
                <div className="form-help">Password must be at least 8 characters long</div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordChangeData.confirmPassword}
                  onChange={handlePasswordChangeInput}
                  className={`form-input ${passwordChangeErrors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm your new password"
                  disabled={isChangingPassword}
                  required
                />
                {passwordChangeErrors.confirmPassword && (
                  <div className="form-error">{passwordChangeErrors.confirmPassword}</div>
                )}
              </div>

              <div className="form-group">
                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <span className="spinner"></span>
                      Changing Password...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
                required
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
                required
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
              <Link to="/forgot-password" className="text-info">
                Forgot your password?
              </Link>
            </div>

            <div className="p-4 bg-secondary rounded-lg">
              <h4 className="mb-2">New to FUEP Post-UTME?</h4>
              <p className="text-secondary mb-3">
                If you haven't started your application yet, you'll need to begin the process first.
              </p>
              <Link to="/apply" className="btn btn-secondary">
                Start New Application
              </Link>
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
              <Link to="/support" className="btn btn-sm btn-secondary">
                Contact Support
              </Link>
            </div>
            <div>
              <h4 className="text-primary mb-2">Application Status</h4>
              <p className="text-secondary mb-2">
                Check your application progress without logging in
              </p>
              <Link to="/status" className="btn btn-sm btn-info">
                Check Status
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
