import './index.css';

import React from 'react';
import { jsx as _jsx } from 'react/jsx-runtime';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import App from './App';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Payment from './pages/Payment';
import Profile from './pages/Profile';
import Status from './pages/Status';
// Initialize brand color from Vite env with safe fallback (#134F47)
const brand = (import.meta.env.VITE_BRAND_PRIMARY_COLOR || '#134F47').trim();
document.documentElement.style.setProperty('--brand-primary', brand);
const router = createBrowserRouter([
  {
    path: '/',
    element: _jsx(App, {}),
    children: [
      { index: true, element: _jsx(Home, {}) },
      { path: 'login', element: _jsx(Login, {}) },
      { path: 'profile', element: _jsx(Profile, {}) },
      { path: 'payment', element: _jsx(Payment, {}) },
      { path: 'status', element: _jsx(Status, {}) },
      { path: '*', element: _jsx(NotFound, {}) },
    ],
  },
]);
ReactDOM.createRoot(document.getElementById('root')).render(
  _jsx(React.StrictMode, { children: _jsx(RouterProvider, { router: router }) })
);
