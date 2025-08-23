import { useEffect, useState } from 'react';
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, changePassword } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordChangeData, setPasswordChangeData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordChangeErrors, setPasswordChangeErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  // Check if user needs to change password
  useEffect(() => {
    if (user?.tempPasswordFlag) {
      setShowPasswordChange(true);
    }
  }, [user]);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };
  const handlePasswordChangeInput = (e) => {
    const { name, value } = e.target;
    setPasswordChangeData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (passwordChangeErrors[name]) {
      setPasswordChangeErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };
  const validateForm = () => {
    const newErrors = {};
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
  const validatePasswordChange = () => {
    const newErrors = {};
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
  const handleSubmit = async (e) => {
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
  const handlePasswordChange = async (e) => {
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
    return _jsxs('div', {
      className: 'container',
      children: [
        _jsxs('div', {
          className: 'page-header',
          children: [
            _jsx('h1', { children: 'Change Your Password' }),
            _jsx('p', {
              children: 'For security reasons, you must change your temporary password',
            }),
          ],
        }),
        _jsx('div', {
          className: 'form-container',
          children: _jsxs('div', {
            className: 'card',
            children: [
              _jsxs('div', {
                className: 'card-header',
                children: [
                  _jsx('h2', { className: 'card-title', children: 'Set New Password' }),
                  _jsx('p', {
                    className: 'card-subtitle',
                    children: 'Choose a strong password for your account',
                  }),
                ],
              }),
              _jsxs('div', {
                className: 'alert alert-warning mb-4',
                children: [
                  _jsx('strong', { children: 'Security Notice:' }),
                  ' You are using a temporary password. Please change it to a secure password of your choice.',
                ],
              }),
              _jsxs('form', {
                onSubmit: handlePasswordChange,
                children: [
                  _jsxs('div', {
                    className: 'form-group',
                    children: [
                      _jsx('label', {
                        htmlFor: 'oldPassword',
                        className: 'form-label',
                        children: 'Current Password *',
                      }),
                      _jsx('input', {
                        type: 'password',
                        id: 'oldPassword',
                        name: 'oldPassword',
                        value: passwordChangeData.oldPassword,
                        onChange: handlePasswordChangeInput,
                        className: `form-input ${passwordChangeErrors.oldPassword ? 'error' : ''}`,
                        placeholder: 'Enter your current password',
                        disabled: isChangingPassword,
                        required: true,
                      }),
                      passwordChangeErrors.oldPassword &&
                        _jsx('div', {
                          className: 'form-error',
                          children: passwordChangeErrors.oldPassword,
                        }),
                    ],
                  }),
                  _jsxs('div', {
                    className: 'form-group',
                    children: [
                      _jsx('label', {
                        htmlFor: 'newPassword',
                        className: 'form-label',
                        children: 'New Password *',
                      }),
                      _jsx('input', {
                        type: 'password',
                        id: 'newPassword',
                        name: 'newPassword',
                        value: passwordChangeData.newPassword,
                        onChange: handlePasswordChangeInput,
                        className: `form-input ${passwordChangeErrors.newPassword ? 'error' : ''}`,
                        placeholder: 'Enter your new password',
                        disabled: isChangingPassword,
                        required: true,
                      }),
                      passwordChangeErrors.newPassword &&
                        _jsx('div', {
                          className: 'form-error',
                          children: passwordChangeErrors.newPassword,
                        }),
                      _jsx('div', {
                        className: 'form-help',
                        children: 'Password must be at least 8 characters long',
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    className: 'form-group',
                    children: [
                      _jsx('label', {
                        htmlFor: 'confirmPassword',
                        className: 'form-label',
                        children: 'Confirm New Password *',
                      }),
                      _jsx('input', {
                        type: 'password',
                        id: 'confirmPassword',
                        name: 'confirmPassword',
                        value: passwordChangeData.confirmPassword,
                        onChange: handlePasswordChangeInput,
                        className: `form-input ${passwordChangeErrors.confirmPassword ? 'error' : ''}`,
                        placeholder: 'Confirm your new password',
                        disabled: isChangingPassword,
                        required: true,
                      }),
                      passwordChangeErrors.confirmPassword &&
                        _jsx('div', {
                          className: 'form-error',
                          children: passwordChangeErrors.confirmPassword,
                        }),
                    ],
                  }),
                  _jsx('div', {
                    className: 'form-group',
                    children: _jsx('button', {
                      type: 'submit',
                      className: 'btn btn-primary btn-full btn-lg',
                      disabled: isChangingPassword,
                      children: isChangingPassword
                        ? _jsxs(_Fragment, {
                            children: [
                              _jsx('span', { className: 'spinner' }),
                              'Changing Password...',
                            ],
                          })
                        : 'Change Password',
                    }),
                  }),
                ],
              }),
            ],
          }),
        }),
      ],
    });
  }
  return _jsxs('div', {
    className: 'container',
    children: [
      _jsxs('div', {
        className: 'page-header',
        children: [
          _jsx('h1', { children: 'Login to FUEP Post-UTME Portal' }),
          _jsx('p', {
            children: 'Access your account using your JAMB registration number and password',
          }),
        ],
      }),
      _jsxs('div', {
        className: 'form-container',
        children: [
          _jsxs('div', {
            className: 'card',
            children: [
              _jsxs('div', {
                className: 'card-header',
                children: [
                  _jsx('h2', { className: 'card-title', children: 'Sign In' }),
                  _jsx('p', {
                    className: 'card-subtitle',
                    children: 'Enter your credentials to access your application',
                  }),
                ],
              }),
              loginError &&
                _jsxs('div', {
                  className: 'alert alert-error',
                  children: [_jsx('strong', { children: 'Login Error:' }), ' ', loginError],
                }),
              _jsxs('form', {
                onSubmit: handleSubmit,
                children: [
                  _jsxs('div', {
                    className: 'form-group',
                    children: [
                      _jsx('label', {
                        htmlFor: 'username',
                        className: 'form-label',
                        children: 'JAMB Registration Number',
                      }),
                      _jsx('input', {
                        type: 'text',
                        id: 'username',
                        name: 'username',
                        value: formData.username,
                        onChange: handleInputChange,
                        className: `form-input ${errors.username ? 'error' : ''}`,
                        placeholder: 'Enter your JAMB registration number',
                        disabled: isLoading,
                        required: true,
                      }),
                      errors.username &&
                        _jsx('div', { className: 'form-error', children: errors.username }),
                      _jsx('div', {
                        className: 'form-help',
                        children: 'This is the same number you used for JAMB registration',
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    className: 'form-group',
                    children: [
                      _jsx('label', {
                        htmlFor: 'password',
                        className: 'form-label',
                        children: 'Password',
                      }),
                      _jsx('input', {
                        type: 'password',
                        id: 'password',
                        name: 'password',
                        value: formData.password,
                        onChange: handleInputChange,
                        className: `form-input ${errors.password ? 'error' : ''}`,
                        placeholder: 'Enter your password',
                        disabled: isLoading,
                        required: true,
                      }),
                      errors.password &&
                        _jsx('div', { className: 'form-error', children: errors.password }),
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
                            children: [_jsx('span', { className: 'spinner' }), 'Logging in...'],
                          })
                        : 'Sign In',
                    }),
                  }),
                ],
              }),
              _jsxs('div', {
                className: 'text-center mt-6',
                children: [
                  _jsx('div', {
                    className: 'mb-4',
                    children: _jsx(Link, {
                      to: '/forgot-password',
                      className: 'text-info',
                      children: 'Forgot your password?',
                    }),
                  }),
                  _jsxs('div', {
                    className: 'p-4 bg-secondary rounded-lg',
                    children: [
                      _jsx('h4', { className: 'mb-2', children: 'New to FUEP Post-UTME?' }),
                      _jsx('p', {
                        className: 'text-secondary mb-3',
                        children:
                          "If you haven't started your application yet, you'll need to begin the process first.",
                      }),
                      _jsx(Link, {
                        to: '/apply',
                        className: 'btn btn-secondary',
                        children: 'Start New Application',
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
                children: _jsx('h3', { className: 'card-title', children: 'Need Help?' }),
              }),
              _jsxs('div', {
                className: 'grid grid-cols-1 md:grid-cols-2 gap-6',
                children: [
                  _jsxs('div', {
                    children: [
                      _jsx('h4', { className: 'text-primary mb-2', children: 'Technical Support' }),
                      _jsx('p', {
                        className: 'text-secondary mb-2',
                        children: 'Having trouble logging in or accessing the portal?',
                      }),
                      _jsx(Link, {
                        to: '/support',
                        className: 'btn btn-sm btn-secondary',
                        children: 'Contact Support',
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    children: [
                      _jsx('h4', {
                        className: 'text-primary mb-2',
                        children: 'Application Status',
                      }),
                      _jsx('p', {
                        className: 'text-secondary mb-2',
                        children: 'Check your application progress without logging in',
                      }),
                      _jsx(Link, {
                        to: '/status',
                        className: 'btn btn-sm btn-info',
                        children: 'Check Status',
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
export default Login;
