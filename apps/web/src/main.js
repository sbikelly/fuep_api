import './index.css';

import React from 'react';
import { jsx as _jsx } from 'react/jsx-runtime';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from './App';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import Application from './pages/Application';
import CandidateDashboard from './pages/CandidateDashboard';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Payment from './pages/Payment';
import Profile from './pages/Profile';
import Status from './pages/Status';
import { getBrandPrimaryColor, logAppConfig } from './utils/config';
// Initialize brand color from config utility
const brand = getBrandPrimaryColor().trim();
document.documentElement.style.setProperty('--brand-primary', brand);
// Log configuration for debugging
logAppConfig();
// Update theme-color meta tag to match brand color
const updateThemeColor = () => {
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', brand);
  } else {
    // Create theme-color meta tag if it doesn't exist
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = brand;
    document.head.appendChild(meta);
  }
};
// Update theme color on mount
updateThemeColor();
const router = createBrowserRouter([
  {
    path: '/',
    element: _jsx(App, {}),
    children: [
      { index: true, element: _jsx(Home, {}) },
      { path: 'login', element: _jsx(Login, {}) },
      { path: 'apply', element: _jsx(Application, {}) },
      { path: 'status', element: _jsx(Status, {}) },
      {
        path: 'dashboard',
        element: _jsx(ProtectedRoute, { children: _jsx(Dashboard, {}) }),
      },
      {
        path: 'candidate/:candidateId',
        element: _jsx(ProtectedRoute, { children: _jsx(CandidateDashboard, {}) }),
      },
      { path: '*', element: _jsx(NotFound, {}) },
    ],
  },
]);
ReactDOM.createRoot(document.getElementById('root')).render(
  _jsx(React.StrictMode, {
    children: _jsx(AuthProvider, { children: _jsx(RouterProvider, { router: router }) }),
  })
);
