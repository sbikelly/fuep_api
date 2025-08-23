import {
  Clock,
  ExternalLink,
  Facebook,
  GraduationCap,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Shield,
  Twitter,
  Youtube,
} from 'lucide-react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Link } from 'react-router-dom';

import Logo from './Logo';
const Footer = () => {
  const currentYear = new Date().getFullYear();
  return _jsxs('footer', {
    className: 'bg-gray-900 text-white',
    children: [
      _jsx('div', {
        className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16',
        children: _jsxs('div', {
          className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8',
          children: [
            _jsxs('div', {
              className: 'lg:col-span-1',
              children: [
                _jsxs(Link, {
                  to: '/',
                  className: 'inline-flex items-center space-x-3 mb-6',
                  children: [
                    _jsx('div', {
                      className: 'brand-logo',
                      children: _jsx(Logo, { size: 48, 'aria-label': 'FUEP Logo' }),
                    }),
                    _jsxs('div', {
                      className: 'flex flex-col',
                      children: [
                        _jsx('span', {
                          className: 'text-2xl font-bold text-white leading-tight',
                          children: 'FUEP',
                        }),
                        _jsx('span', {
                          className: 'text-sm font-medium text-gray-300 leading-tight',
                          children: 'Post-UTME Portal',
                        }),
                      ],
                    }),
                  ],
                }),
                _jsx('p', {
                  className: 'text-gray-300 mb-6 leading-relaxed',
                  children:
                    'Empowering students with a seamless and professional university admission experience. Your gateway to academic excellence starts here.',
                }),
                _jsxs('div', {
                  className: 'flex space-x-4',
                  children: [
                    _jsx('a', {
                      href: '#',
                      className:
                        'p-2 bg-gray-800 text-gray-300 hover:bg-primary-600 hover:text-white rounded-lg transition-colors duration-200',
                      'aria-label': 'Facebook',
                      children: _jsx(Facebook, { className: 'h-5 w-5' }),
                    }),
                    _jsx('a', {
                      href: '#',
                      className:
                        'p-2 bg-gray-800 text-gray-300 hover:bg-primary-600 hover:text-white rounded-lg transition-colors duration-200',
                      'aria-label': 'Twitter',
                      children: _jsx(Twitter, { className: 'h-5 w-5' }),
                    }),
                    _jsx('a', {
                      href: '#',
                      className:
                        'p-2 bg-gray-800 text-gray-300 hover:bg-primary-600 hover:text-white rounded-lg transition-colors duration-200',
                      'aria-label': 'Instagram',
                      children: _jsx(Instagram, { className: 'h-5 w-5' }),
                    }),
                    _jsx('a', {
                      href: '#',
                      className:
                        'p-2 bg-gray-800 text-gray-300 hover:bg-primary-600 hover:text-white rounded-lg transition-colors duration-200',
                      'aria-label': 'LinkedIn',
                      children: _jsx(Linkedin, { className: 'h-5 w-5' }),
                    }),
                    _jsx('a', {
                      href: '#',
                      className:
                        'p-2 bg-gray-800 text-gray-300 hover:bg-primary-600 hover:text-white rounded-lg transition-colors duration-200',
                      'aria-label': 'YouTube',
                      children: _jsx(Youtube, { className: 'h-5 w-5' }),
                    }),
                  ],
                }),
              ],
            }),
            _jsxs('div', {
              children: [
                _jsx('h3', {
                  className: 'text-lg font-semibold text-white mb-6',
                  children: 'Quick Links',
                }),
                _jsxs('ul', {
                  className: 'space-y-3',
                  children: [
                    _jsx('li', {
                      children: _jsx(Link, {
                        to: '/',
                        className: 'text-gray-300 hover:text-white transition-colors duration-200',
                        children: 'Home',
                      }),
                    }),
                    _jsx('li', {
                      children: _jsx(Link, {
                        to: '/apply',
                        className: 'text-gray-300 hover:text-white transition-colors duration-200',
                        children: 'Apply Now',
                      }),
                    }),
                    _jsx('li', {
                      children: _jsx(Link, {
                        to: '/status',
                        className: 'text-gray-300 hover:text-white transition-colors duration-200',
                        children: 'Check Status',
                      }),
                    }),
                    _jsx('li', {
                      children: _jsx(Link, {
                        to: '/login',
                        className: 'text-gray-300 hover:text-white transition-colors duration-200',
                        children: 'Login',
                      }),
                    }),
                    _jsx('li', {
                      children: _jsx(Link, {
                        to: '/faq',
                        className: 'text-gray-300 hover:text-white transition-colors duration-200',
                        children: 'FAQ',
                      }),
                    }),
                    _jsx('li', {
                      children: _jsx(Link, {
                        to: '/downloads',
                        className: 'text-gray-300 hover:text-white transition-colors duration-200',
                        children: 'Downloads',
                      }),
                    }),
                  ],
                }),
              ],
            }),
            _jsxs('div', {
              children: [
                _jsx('h3', {
                  className: 'text-lg font-semibold text-white mb-6',
                  children: 'Resources',
                }),
                _jsxs('ul', {
                  className: 'space-y-3',
                  children: [
                    _jsx('li', {
                      children: _jsxs('a', {
                        href: 'https://fuep.edu.ng',
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className:
                          'text-gray-300 hover:text-white transition-colors duration-200 inline-flex items-center space-x-2',
                        children: [
                          _jsx('span', { children: 'University Website' }),
                          _jsx(ExternalLink, { className: 'h-4 w-4' }),
                        ],
                      }),
                    }),
                    _jsx('li', {
                      children: _jsxs('a', {
                        href: 'https://fuep.edu.ng/admissions',
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className:
                          'text-gray-300 hover:text-white transition-colors duration-200 inline-flex items-center space-x-2',
                        children: [
                          _jsx('span', { children: 'Admissions Guide' }),
                          _jsx(ExternalLink, { className: 'h-4 w-4' }),
                        ],
                      }),
                    }),
                    _jsx('li', {
                      children: _jsxs('a', {
                        href: 'https://fuep.edu.ng/programs',
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className:
                          'text-gray-300 hover:text-white transition-colors duration-200 inline-flex items-center space-x-2',
                        children: [
                          _jsx('span', { children: 'Academic Programs' }),
                          _jsx(ExternalLink, { className: 'h-4 w-4' }),
                        ],
                      }),
                    }),
                    _jsx('li', {
                      children: _jsxs('a', {
                        href: 'https://fuep.edu.ng/contact',
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className:
                          'text-gray-300 hover:text-white transition-colors duration-200 inline-flex items-center space-x-2',
                        children: [
                          _jsx('span', { children: 'Contact Information' }),
                          _jsx(ExternalLink, { className: 'h-4 w-4' }),
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
            _jsxs('div', {
              children: [
                _jsx('h3', {
                  className: 'text-lg font-semibold text-white mb-6',
                  children: 'Contact Us',
                }),
                _jsxs('div', {
                  className: 'space-y-4',
                  children: [
                    _jsxs('div', {
                      className: 'flex items-start space-x-3',
                      children: [
                        _jsx(MapPin, {
                          className: 'h-5 w-5 text-primary-400 mt-0.5 flex-shrink-0',
                        }),
                        _jsx('div', {
                          children: _jsxs('p', {
                            className: 'text-gray-300 text-sm leading-relaxed',
                            children: [
                              'Federal University of Education, Pankshin',
                              _jsx('br', {}),
                              'Pankshin, Plateau State',
                              _jsx('br', {}),
                              'Nigeria',
                            ],
                          }),
                        }),
                      ],
                    }),
                    _jsxs('div', {
                      className: 'flex items-center space-x-3',
                      children: [
                        _jsx(Phone, { className: 'h-5 w-5 text-primary-400 flex-shrink-0' }),
                        _jsx('a', {
                          href: 'tel:+2348031234567',
                          className:
                            'text-gray-300 hover:text-white transition-colors duration-200',
                          children: '+234 803 123 4567',
                        }),
                      ],
                    }),
                    _jsxs('div', {
                      className: 'flex items-center space-x-3',
                      children: [
                        _jsx(Mail, { className: 'h-5 w-5 text-primary-400 flex-shrink-0' }),
                        _jsx('a', {
                          href: 'mailto:admissions@fuep.edu.ng',
                          className:
                            'text-gray-300 hover:text-white transition-colors duration-200',
                          children: 'admissions@fuep.edu.ng',
                        }),
                      ],
                    }),
                    _jsxs('div', {
                      className: 'flex items-center space-x-3',
                      children: [
                        _jsx(Clock, { className: 'h-5 w-5 text-primary-400 flex-shrink-0' }),
                        _jsxs('span', {
                          className: 'text-gray-300 text-sm',
                          children: [
                            'Mon - Fri: 8:00 AM - 5:00 PM',
                            _jsx('br', {}),
                            'Sat: 9:00 AM - 1:00 PM',
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      _jsx('div', {
        className: 'border-t border-gray-800 py-8',
        children: _jsx('div', {
          className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
          children: _jsxs('div', {
            className: 'grid grid-cols-1 md:grid-cols-3 gap-6 text-center',
            children: [
              _jsxs('div', {
                className: 'flex items-center justify-center space-x-3',
                children: [
                  _jsx(Shield, { className: 'h-6 w-6 text-primary-400' }),
                  _jsx('span', { className: 'text-gray-300', children: 'Secure & Confidential' }),
                ],
              }),
              _jsxs('div', {
                className: 'flex items-center justify-center space-x-3',
                children: [
                  _jsx(GraduationCap, { className: 'h-6 w-6 text-primary-400' }),
                  _jsx('span', { className: 'text-gray-300', children: 'Accredited Institution' }),
                ],
              }),
              _jsxs('div', {
                className: 'flex items-center justify-center space-x-3',
                children: [
                  _jsx(Clock, { className: 'h-6 w-6 text-primary-400' }),
                  _jsx('span', { className: 'text-gray-300', children: '24/7 Portal Access' }),
                ],
              }),
            ],
          }),
        }),
      }),
      _jsx('div', {
        className: 'border-t border-gray-800 py-6',
        children: _jsx('div', {
          className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
          children: _jsxs('div', {
            className:
              'flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0',
            children: [
              _jsxs('div', {
                className: 'text-gray-400 text-sm',
                children: ['\u00A9 ', currentYear, ' FUEP_ICT. All rights reserved.'],
              }),
              _jsxs('div', {
                className: 'flex space-x-6 text-sm',
                children: [
                  _jsx(Link, {
                    to: '/privacy',
                    className: 'text-gray-400 hover:text-white transition-colors duration-200',
                    children: 'Privacy Policy',
                  }),
                  _jsx(Link, {
                    to: '/terms',
                    className: 'text-gray-400 hover:text-white transition-colors duration-200',
                    children: 'Terms of Service',
                  }),
                  _jsx(Link, {
                    to: '/accessibility',
                    className: 'text-gray-400 hover:text-white transition-colors duration-200',
                    children: 'Accessibility',
                  }),
                ],
              }),
            ],
          }),
        }),
      }),
    ],
  });
};
export default Footer;
