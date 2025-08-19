import { useState } from 'react';
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useNavigate } from 'react-router-dom';
const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };
  const validateForm = () => {
    // Temporary validation for development
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
  const handleSubmit = async (e) => {
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
                    children: _jsx('a', {
                      href: '/forgot-password',
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
                      _jsx('a', {
                        href: '/apply',
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
                      _jsx('a', {
                        href: '/support',
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
                      _jsx('a', {
                        href: '/status',
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
