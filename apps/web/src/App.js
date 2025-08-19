import './index.css';

import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Link, Outlet, useLocation } from 'react-router-dom';
export default function App() {
  const location = useLocation();
  const isActive = (path) => {
    return location.pathname === path;
  };
  return _jsxs('div', {
    className: 'app-root',
    children: [
      _jsxs('header', {
        className: 'app-header',
        children: [
          _jsxs('div', {
            className: 'container',
            children: [
              _jsxs('div', {
                className: 'brand',
                children: [
                  _jsx('div', {
                    className: 'brand-logo',
                    children: _jsx('span', { children: 'FUEP' }),
                  }),
                  _jsxs('div', {
                    children: [
                      _jsx('h1', { children: 'FUEP Post-UTME Portal' }),
                      _jsx('small', {
                        style: { opacity: 0.8, fontWeight: 'normal' },
                        children: 'Federal University of Education, Pankshin',
                      }),
                    ],
                  }),
                ],
              }),
              _jsx('div', {
                style: {
                  background: 'rgba(255,255,255,0.1)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                },
                children: 'ICT Division',
              }),
            ],
          }),
          _jsx('nav', {
            className: 'nav',
            style: {
              background: 'rgba(0,0,0,0.1)',
              padding: '12px 0',
              justifyContent: 'center',
            },
            children: _jsxs('div', {
              className: 'container',
              children: [
                _jsx(Link, {
                  to: '/',
                  className: `nav-link ${isActive('/') ? 'active' : ''}`,
                  children: 'Home',
                }),
                _jsx(Link, {
                  to: '/login',
                  className: `nav-link ${isActive('/login') ? 'active' : ''}`,
                  children: 'Login',
                }),
                _jsx(Link, {
                  to: '/profile',
                  className: `nav-link ${isActive('/profile') ? 'active' : ''}`,
                  children: 'Profile',
                }),
                _jsx(Link, {
                  to: '/payment',
                  className: `nav-link ${isActive('/payment') ? 'active' : ''}`,
                  children: 'Payment',
                }),
                _jsx(Link, {
                  to: '/status',
                  className: `nav-link ${isActive('/status') ? 'active' : ''}`,
                  children: 'Status',
                }),
              ],
            }),
          }),
        ],
      }),
      _jsx('main', { children: _jsx(Outlet, {}) }),
      _jsx('footer', {
        className: 'app-footer',
        children: _jsxs('div', {
          className: 'container',
          children: [
            _jsx('div', {
              children: _jsx('p', {
                style: { margin: 0, fontSize: '14px' },
                children:
                  '\u00A9 2024 Federal University of Education, Pankshin. All rights reserved.',
              }),
            }),
            _jsxs('div', {
              className: 'footer-links',
              children: [
                _jsx('a', { href: '/privacy', children: 'Privacy Policy' }),
                _jsx('a', { href: '/terms', children: 'Terms of Service' }),
                _jsx('a', { href: '/contact', children: 'Contact Support' }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
