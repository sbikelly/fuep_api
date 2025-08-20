import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  GraduationCap,
  LogIn,
  Shield,
  Star,
  Users,
} from 'lucide-react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Link } from 'react-router-dom';
export default function Home() {
  return _jsxs('div', {
    className: 'space-y-0',
    children: [
      _jsxs('section', {
        className:
          'relative bg-gradient-to-br from-primary-50 via-white to-primary-50 py-20 lg:py-32 overflow-hidden',
        children: [
          _jsx('div', { className: 'absolute inset-0 bg-grid-pattern opacity-5' }),
          _jsx('div', {
            className: 'relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
            children: _jsxs('div', {
              className: 'text-center',
              children: [
                _jsxs('div', {
                  className:
                    'inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6',
                  children: [
                    _jsx(Star, { className: 'h-4 w-4' }),
                    _jsx('span', { children: 'Official FUEP Post-UTME Portal' }),
                  ],
                }),
                _jsxs('h1', {
                  className:
                    'text-4xl md:text-6xl lg:text-7xl font-bold text-primary-900 mb-6 leading-tight',
                  children: [
                    'Your Gateway to',
                    _jsx('span', {
                      className: 'block text-primary-600',
                      children: 'Academic Excellence',
                    }),
                  ],
                }),
                _jsx('p', {
                  className:
                    'text-xl lg:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed',
                  children:
                    'Streamline your university admission process with our comprehensive Post-UTME portal. Apply, pay fees, upload documents, and track your admission status all in one place.',
                }),
                _jsxs('div', {
                  className: 'flex flex-col sm:flex-row gap-4 justify-center items-center mb-12',
                  children: [
                    _jsxs(Link, {
                      to: '/apply',
                      className:
                        'group inline-flex items-center space-x-3 bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:bg-primary-700 transform hover:-translate-y-1 transition-all duration-200',
                      children: [
                        _jsx('span', { children: 'Start Your Application' }),
                        _jsx(ArrowRight, {
                          className:
                            'h-5 w-5 group-hover:translate-x-1 transition-transform duration-200',
                        }),
                      ],
                    }),
                    _jsxs(Link, {
                      to: '/status',
                      className:
                        'inline-flex items-center space-x-3 bg-white text-primary-700 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-primary-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200',
                      children: [
                        _jsx(Clock, { className: 'h-5 w-5' }),
                        _jsx('span', { children: 'Check Status' }),
                      ],
                    }),
                  ],
                }),
                _jsxs('div', {
                  className:
                    'flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500',
                  children: [
                    _jsxs('div', {
                      className: 'flex items-center space-x-2',
                      children: [
                        _jsx(Shield, { className: 'h-4 w-4 text-green-500' }),
                        _jsx('span', { children: 'Secure & Confidential' }),
                      ],
                    }),
                    _jsxs('div', {
                      className: 'flex items-center space-x-2',
                      children: [
                        _jsx(Clock, { className: 'h-4 w-4 text-blue-500' }),
                        _jsx('span', { children: '24/7 Access' }),
                      ],
                    }),
                    _jsxs('div', {
                      className: 'flex items-center space-x-2',
                      children: [
                        _jsx(Users, { className: 'h-4 w-4 text-purple-500' }),
                        _jsx('span', { children: 'Thousands of Students' }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
      _jsx('section', {
        className: 'py-20 bg-white',
        children: _jsxs('div', {
          className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
          children: [
            _jsxs('div', {
              className: 'text-center mb-16',
              children: [
                _jsx('h2', {
                  className: 'text-3xl lg:text-4xl font-bold text-primary-900 mb-4',
                  children: 'Why Choose Our Portal?',
                }),
                _jsx('p', {
                  className: 'text-xl text-gray-600 max-w-3xl mx-auto',
                  children:
                    'Experience a seamless, professional, and efficient application process designed with students in mind.',
                }),
              ],
            }),
            _jsxs('div', {
              className: 'grid md:grid-cols-2 lg:grid-cols-3 gap-8',
              children: [
                _jsxs('div', {
                  className:
                    'group p-8 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300 bg-white',
                  children: [
                    _jsx('div', {
                      className: 'flex justify-center mb-6',
                      children: _jsx('div', {
                        className:
                          'p-4 bg-primary-100 rounded-2xl group-hover:bg-primary-200 transition-colors duration-200',
                        children: _jsx(BookOpen, { className: 'h-8 w-8 text-primary-600' }),
                      }),
                    }),
                    _jsx('h3', {
                      className: 'text-xl font-semibold text-primary-900 mb-4 text-center',
                      children: 'Easy Application Process',
                    }),
                    _jsx('p', {
                      className: 'text-gray-600 text-center leading-relaxed',
                      children:
                        'Simple step-by-step application process with real-time validation, progress tracking, and helpful guidance at every step.',
                    }),
                  ],
                }),
                _jsxs('div', {
                  className:
                    'group p-8 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300 bg-white',
                  children: [
                    _jsx('div', {
                      className: 'flex justify-center mb-6',
                      children: _jsx('div', {
                        className:
                          'p-4 bg-primary-100 rounded-2xl group-hover:bg-primary-200 transition-colors duration-200',
                        children: _jsx(FileText, { className: 'h-8 w-8 text-primary-600' }),
                      }),
                    }),
                    _jsx('h3', {
                      className: 'text-xl font-semibold text-primary-900 mb-4 text-center',
                      children: 'Document Management',
                    }),
                    _jsx('p', {
                      className: 'text-gray-600 text-center leading-relaxed',
                      children:
                        'Secure upload and management of all required documents, academic records, and supporting materials in one organized location.',
                    }),
                  ],
                }),
                _jsxs('div', {
                  className:
                    'group p-8 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300 bg-white',
                  children: [
                    _jsx('div', {
                      className: 'flex justify-center mb-6',
                      children: _jsx('div', {
                        className:
                          'p-4 bg-primary-100 rounded-2xl group-hover:bg-primary-200 transition-colors duration-200',
                        children: _jsx(CheckCircle, { className: 'h-8 w-8 text-primary-600' }),
                      }),
                    }),
                    _jsx('h3', {
                      className: 'text-xl font-semibold text-primary-900 mb-4 text-center',
                      children: 'Real-time Updates',
                    }),
                    _jsx('p', {
                      className: 'text-gray-600 text-center leading-relaxed',
                      children:
                        'Track your application status, payment confirmations, document reviews, and admission decisions with instant notifications.',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      _jsx('section', {
        className: 'py-20 bg-primary-600 text-white',
        children: _jsxs('div', {
          className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
          children: [
            _jsxs('div', {
              className: 'text-center mb-16',
              children: [
                _jsx('h2', {
                  className: 'text-3xl lg:text-4xl font-bold mb-4',
                  children: 'Trusted by Thousands of Students',
                }),
                _jsx('p', {
                  className: 'text-xl opacity-90 max-w-3xl mx-auto',
                  children:
                    'Join the growing community of successful applicants who have transformed their academic journey through our portal.',
                }),
              ],
            }),
            _jsxs('div', {
              className: 'grid md:grid-cols-4 gap-8 text-center',
              children: [
                _jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    _jsx('div', { className: 'text-4xl font-bold', children: '10,000+' }),
                    _jsx('div', {
                      className: 'text-primary-200',
                      children: 'Successful Applications',
                    }),
                  ],
                }),
                _jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    _jsx('div', { className: 'text-4xl font-bold', children: '99.9%' }),
                    _jsx('div', { className: 'text-primary-200', children: 'Uptime' }),
                  ],
                }),
                _jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    _jsx('div', { className: 'text-4xl font-bold', children: '24/7' }),
                    _jsx('div', { className: 'text-primary-200', children: 'Support Available' }),
                  ],
                }),
                _jsxs('div', {
                  className: 'space-y-2',
                  children: [
                    _jsx('div', { className: 'text-4xl font-bold', children: '5.0' }),
                    _jsx('div', { className: 'text-primary-200', children: 'Student Rating' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      _jsx('section', {
        className: 'py-20 bg-gradient-to-r from-primary-600 to-primary-700 text-white',
        children: _jsxs('div', {
          className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center',
          children: [
            _jsx('h2', {
              className: 'text-3xl lg:text-4xl font-bold mb-6',
              children: 'Ready to Begin Your Academic Journey?',
            }),
            _jsx('p', {
              className: 'text-xl mb-10 opacity-90 max-w-3xl mx-auto',
              children:
                'Take the first step towards your future. Our streamlined application process makes it easy to get started.',
            }),
            _jsxs('div', {
              className: 'flex flex-col sm:flex-row gap-4 justify-center items-center',
              children: [
                _jsxs(Link, {
                  to: '/apply',
                  className:
                    'group inline-flex items-center space-x-3 bg-white text-primary-600 hover:bg-gray-50 font-semibold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1',
                  children: [
                    _jsx('span', { children: 'Start Application Now' }),
                    _jsx(ArrowRight, {
                      className:
                        'h-5 w-5 group-hover:translate-x-1 transition-transform duration-200',
                    }),
                  ],
                }),
                _jsxs(Link, {
                  to: '/login',
                  className:
                    'inline-flex items-center space-x-3 border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-4 px-8 rounded-xl transition-all duration-200',
                  children: [
                    _jsx(LogIn, { className: 'h-5 w-5' }),
                    _jsx('span', { children: 'Login to Portal' }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      _jsx('section', {
        className: 'py-20 bg-gray-50',
        children: _jsxs('div', {
          className: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
          children: [
            _jsxs('div', {
              className: 'text-center mb-16',
              children: [
                _jsx('h2', {
                  className: 'text-3xl font-bold text-primary-900 mb-4',
                  children: 'Quick Access',
                }),
                _jsx('p', {
                  className: 'text-xl text-gray-600 max-w-3xl mx-auto',
                  children:
                    'Everything you need to know about the application process and university resources.',
                }),
              ],
            }),
            _jsxs('div', {
              className: 'grid md:grid-cols-3 gap-6',
              children: [
                _jsxs('a', {
                  href: 'https://fuep.edu.ng',
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  className:
                    'group p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200 text-center',
                  children: [
                    _jsx('div', {
                      className:
                        'p-3 bg-primary-100 rounded-lg inline-block mb-4 group-hover:bg-primary-200 transition-colors duration-200',
                      children: _jsx(GraduationCap, { className: 'h-6 w-6 text-primary-600' }),
                    }),
                    _jsx('h3', {
                      className: 'text-lg font-semibold text-primary-900 mb-2',
                      children: 'University Website',
                    }),
                    _jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children: 'Visit the official FUEP website for more information',
                    }),
                  ],
                }),
                _jsxs(Link, {
                  to: '/faq',
                  className:
                    'group p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200 text-center',
                  children: [
                    _jsx('div', {
                      className:
                        'p-3 bg-primary-100 rounded-lg inline-block mb-4 group-hover:bg-primary-200 transition-colors duration-200',
                      children: _jsx(FileText, { className: 'h-6 w-6 text-primary-600' }),
                    }),
                    _jsx('h3', {
                      className: 'text-lg font-semibold text-primary-900 mb-2',
                      children: 'Frequently Asked Questions',
                    }),
                    _jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children: 'Find answers to common questions about the application process',
                    }),
                  ],
                }),
                _jsxs(Link, {
                  to: '/downloads',
                  className:
                    'group p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200 text-center',
                  children: [
                    _jsx('div', {
                      className:
                        'p-3 bg-primary-100 rounded-lg inline-block mb-4 group-hover:bg-primary-200 transition-colors duration-200',
                      children: _jsx(Award, { className: 'h-6 w-6 text-primary-600' }),
                    }),
                    _jsx('h3', {
                      className: 'text-lg font-semibold text-primary-900 mb-2',
                      children: 'Downloads & Resources',
                    }),
                    _jsx('p', {
                      className: 'text-gray-600 text-sm',
                      children: 'Access important documents, forms, and guidelines',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
