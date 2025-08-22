import './../index.css';

import { BarChart3, FileText, GraduationCap, LogIn, Menu, User, X } from 'lucide-react';
import { useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Link, useLocation } from 'react-router-dom';

import Logo from './Logo';
const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isActive = (path) => {
    return location.pathname === path;
  };
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  const navItems = [
    { path: '/', label: 'Home', icon: GraduationCap },
    { path: '/apply', label: 'Apply Now', icon: FileText },
    { path: '/status', label: 'Check Status', icon: BarChart3 },
    { path: '/login', label: 'Login', icon: LogIn },
  ];
  return _jsx('nav', {
    className: 'bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50',
    children: _jsxs('div', {
      className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
      children: [
        _jsxs('div', {
          className: 'flex items-center justify-between h-20',
          children: [
            _jsxs(Link, {
              to: '/',
              className: 'flex items-center space-x-3 group',
              onClick: closeMobileMenu,
              children: [
                _jsx('div', {
                  className: 'brand-logo group-hover:scale-105 transition-transform duration-200',
                  children: _jsx(Logo, { size: 48, 'aria-label': 'FUEP Logo' }),
                }),
                _jsxs('div', {
                  className: 'flex flex-col',
                  children: [
                    _jsx('span', {
                      className: 'text-2xl font-bold text-primary-800 leading-tight',
                      children: 'FUEP',
                    }),
                    _jsx('span', {
                      className: 'text-sm font-medium text-primary-600 leading-tight',
                      children: 'Post-UTME Portal',
                    }),
                  ],
                }),
              ],
            }),
            _jsxs('div', {
              className: 'hidden lg:flex items-center space-x-6',
              children: [
                _jsx('div', {
                  className: 'flex items-center space-x-1',
                  children: navItems.map((item) => {
                    const Icon = item.icon;
                    return _jsxs(
                      Link,
                      {
                        to: item.path,
                        className: `flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          isActive(item.path)
                            ? 'bg-primary-100 text-primary-700 border border-primary-200'
                            : 'text-gray-600 hover:text-primary-700 hover:bg-gray-50'
                        }`,
                        onClick: closeMobileMenu,
                        children: [
                          _jsx(Icon, { className: 'h-4 w-4' }),
                          _jsx('span', { children: item.label }),
                        ],
                      },
                      item.path
                    );
                  }),
                }),
                _jsxs('div', {
                  className: 'flex items-center space-x-3 ml-4',
                  children: [
                    _jsxs(Link, {
                      to: '/login',
                      className:
                        'inline-flex items-center space-x-2 px-4 py-2 border border-primary-600 text-primary-700 bg-white hover:bg-primary-50 rounded-lg font-medium transition-all duration-200',
                      children: [
                        _jsx(LogIn, { className: 'h-4 w-4' }),
                        _jsx('span', { children: 'Login' }),
                      ],
                    }),
                    _jsxs(Link, {
                      to: '/apply',
                      className:
                        'inline-flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5',
                      children: [
                        _jsx(User, { className: 'h-4 w-4' }),
                        _jsx('span', { children: 'Apply Now' }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            _jsx('div', {
              className: 'lg:hidden',
              children: _jsx('button', {
                onClick: toggleMobileMenu,
                className:
                  'inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-primary-700 hover:bg-gray-100 transition-colors duration-200',
                'aria-expanded': 'false',
                'aria-label': 'Toggle navigation menu',
                children: isMobileMenuOpen
                  ? _jsx(X, { className: 'h-6 w-6' })
                  : _jsx(Menu, { className: 'h-6 w-6' }),
              }),
            }),
          ],
        }),
        isMobileMenuOpen &&
          _jsx('div', {
            className:
              'lg:hidden absolute left-0 right-0 top-20 bg-white border-t border-gray-100 shadow-lg',
            children: _jsxs('div', {
              className: 'px-4 py-6 space-y-4',
              children: [
                _jsx('div', {
                  className: 'grid grid-cols-2 gap-3',
                  children: navItems.map((item) => {
                    const Icon = item.icon;
                    return _jsxs(
                      Link,
                      {
                        to: item.path,
                        className: `flex items-center space-x-3 p-4 rounded-lg font-medium transition-colors duration-200 ${
                          isActive(item.path)
                            ? 'bg-primary-100 text-primary-700 border border-primary-200'
                            : 'text-gray-600 hover:text-primary-700 hover:bg-gray-50'
                        }`,
                        onClick: closeMobileMenu,
                        children: [
                          _jsx(Icon, { className: 'h-5 w-5' }),
                          _jsx('span', { children: item.label }),
                        ],
                      },
                      item.path
                    );
                  }),
                }),
                _jsxs('div', {
                  className: 'pt-4 space-y-3',
                  children: [
                    _jsxs(Link, {
                      to: '/login',
                      className:
                        'flex items-center justify-center space-x-2 px-4 py-3 border border-primary-600 text-primary-700 bg-white hover:bg-primary-50 rounded-lg font-medium transition-colors duration-200',
                      onClick: closeMobileMenu,
                      children: [
                        _jsx(LogIn, { className: 'h-4 w-4' }),
                        _jsx('span', { children: 'Login to Portal' }),
                      ],
                    }),
                    _jsxs(Link, {
                      to: '/apply',
                      className:
                        'flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium transition-colors duration-200 shadow-md',
                      onClick: closeMobileMenu,
                      children: [
                        _jsx(User, { className: 'h-4 w-4' }),
                        _jsx('span', { children: 'Start Application' }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
      ],
    }),
  });
};
export default Navbar;
