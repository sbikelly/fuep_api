import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
const ProtectedRoute = ({ children, requireAuth = true, redirectTo = '/login' }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) {
    return _jsx('div', {
      className: 'container',
      children: _jsx('div', {
        className: 'flex items-center justify-center min-h-screen',
        children: _jsxs('div', {
          className: 'text-center',
          children: [
            _jsx('div', { className: 'spinner mx-auto mb-4' }),
            _jsx('p', { children: 'Loading...' }),
          ],
        }),
      }),
    });
  }
  if (requireAuth && !isAuthenticated) {
    // Redirect to login page, but save the attempted location
    return _jsx(Navigate, { to: redirectTo, state: { from: location }, replace: true });
  }
  if (!requireAuth && isAuthenticated) {
    // If user is already authenticated and trying to access public routes like login
    // redirect to dashboard
    return _jsx(Navigate, { to: '/dashboard', replace: true });
  }
  return _jsx(_Fragment, { children: children });
};
export default ProtectedRoute;
