import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Link } from 'react-router-dom';
export default function Home() {
  return _jsxs('div', {
    className: 'container',
    children: [
      _jsxs('div', {
        className: 'page-header',
        children: [
          _jsx('h1', { children: 'Welcome to FUEP Post-UTME Portal' }),
          _jsx('p', {
            children:
              'Streamline your post-UTME application process with our comprehensive digital platform. Complete your application, manage payments, and track your admission status all in one place.',
          }),
        ],
      }),
      _jsxs('div', {
        className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8',
        children: [
          _jsxs('div', {
            className: 'card',
            children: [
              _jsxs('div', {
                className: 'card-header',
                children: [
                  _jsx('h3', { className: 'card-title', children: 'New Application' }),
                  _jsx('p', {
                    className: 'card-subtitle',
                    children: 'Start your post-UTME application process',
                  }),
                ],
              }),
              _jsx('p', {
                className: 'mb-4',
                children:
                  "Begin your journey to FUEP by creating a new application. You'll need your JAMB registration number and supporting documents.",
              }),
              _jsx(Link, {
                to: '/login',
                className: 'btn btn-primary btn-full',
                children: 'Start Application',
              }),
            ],
          }),
          _jsxs('div', {
            className: 'card',
            children: [
              _jsxs('div', {
                className: 'card-header',
                children: [
                  _jsx('h3', { className: 'card-title', children: 'Returning Candidate' }),
                  _jsx('p', {
                    className: 'card-subtitle',
                    children: 'Access your existing application',
                  }),
                ],
              }),
              _jsx('p', {
                className: 'mb-4',
                children:
                  'Already have an account? Log in to continue your application, update your profile, or check your admission status.',
              }),
              _jsx(Link, {
                to: '/login',
                className: 'btn btn-secondary btn-full',
                children: 'Login',
              }),
            ],
          }),
          _jsxs('div', {
            className: 'card',
            children: [
              _jsxs('div', {
                className: 'card-header',
                children: [
                  _jsx('h3', { className: 'card-title', children: 'Application Status' }),
                  _jsx('p', {
                    className: 'card-subtitle',
                    children: 'Check your application progress',
                  }),
                ],
              }),
              _jsx('p', {
                className: 'mb-4',
                children:
                  'Track the status of your application, payment confirmations, and admission decisions in real-time.',
              }),
              _jsx(Link, {
                to: '/status',
                className: 'btn btn-info btn-full',
                children: 'Check Status',
              }),
            ],
          }),
        ],
      }),
      _jsxs('div', {
        className: 'card mb-8',
        children: [
          _jsx('div', {
            className: 'card-header',
            children: _jsx('h2', { children: 'Important Information' }),
          }),
          _jsxs('div', {
            className: 'grid grid-cols-1 md:grid-cols-2 gap-6',
            children: [
              _jsxs('div', {
                children: [
                  _jsx('h4', {
                    className: 'text-primary mb-3',
                    children: 'Application Requirements',
                  }),
                  _jsxs('ul', {
                    style: { paddingLeft: '20px', lineHeight: '1.8' },
                    children: [
                      _jsx('li', { children: 'Valid JAMB registration number' }),
                      _jsx('li', { children: 'Recent passport photograph' }),
                      _jsx('li', { children: "O'Level results (WAEC/NECO)" }),
                      _jsx('li', { children: 'Valid email address and phone number' }),
                      _jsx('li', { children: 'Payment for post-UTME screening' }),
                    ],
                  }),
                ],
              }),
              _jsxs('div', {
                children: [
                  _jsx('h4', { className: 'text-primary mb-3', children: 'Application Process' }),
                  _jsxs('ol', {
                    style: { paddingLeft: '20px', lineHeight: '1.8' },
                    children: [
                      _jsx('li', { children: 'Verify JAMB registration number' }),
                      _jsx('li', { children: 'Complete personal information' }),
                      _jsx('li', { children: 'Upload required documents' }),
                      _jsx('li', { children: 'Make payment for screening' }),
                      _jsx('li', { children: 'Print registration form' }),
                      _jsx('li', { children: 'Attend screening exercise' }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      _jsxs('div', {
        className: 'card',
        children: [
          _jsx('div', {
            className: 'card-header',
            children: _jsx('h2', { children: 'Need Help?' }),
          }),
          _jsxs('div', {
            className: 'grid grid-cols-1 md:grid-cols-3 gap-6',
            children: [
              _jsxs('div', {
                className: 'text-center',
                children: [
                  _jsx('div', {
                    style: {
                      width: '60px',
                      height: '60px',
                      background: 'var(--brand-accent)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto',
                      color: 'white',
                      fontSize: '24px',
                    },
                    children: '\uD83D\uDCE7',
                  }),
                  _jsx('h4', { children: 'Email Support' }),
                  _jsx('p', { className: 'text-secondary', children: 'admissions@fuep.edu.ng' }),
                ],
              }),
              _jsxs('div', {
                className: 'text-center',
                children: [
                  _jsx('div', {
                    style: {
                      width: '60px',
                      height: '60px',
                      background: 'var(--brand-secondary)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto',
                      color: 'white',
                      fontSize: '24px',
                    },
                    children: '\uD83D\uDCDE',
                  }),
                  _jsx('h4', { children: 'Phone Support' }),
                  _jsx('p', { className: 'text-secondary', children: '+234 XXX XXX XXXX' }),
                ],
              }),
              _jsxs('div', {
                className: 'text-center',
                children: [
                  _jsx('div', {
                    style: {
                      width: '60px',
                      height: '60px',
                      background: 'var(--success)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto',
                      color: 'white',
                      fontSize: '24px',
                    },
                    children: '\uD83D\uDCAC',
                  }),
                  _jsx('h4', { children: 'Live Chat' }),
                  _jsx('p', {
                    className: 'text-secondary',
                    children: 'Available during business hours',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      _jsxs('div', {
        className: 'text-center mt-8',
        children: [
          _jsx('h3', { className: 'mb-4', children: 'Quick Links' }),
          _jsxs('div', {
            style: { display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' },
            children: [
              _jsx('a', {
                href: 'https://fuep.edu.ng',
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'btn btn-outline',
                style: {
                  border: '1px solid var(--border-medium)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                },
                children: 'University Website',
              }),
              _jsx('a', {
                href: '/faq',
                className: 'btn btn-outline',
                style: {
                  border: '1px solid var(--border-medium)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                },
                children: 'FAQ',
              }),
              _jsx('a', {
                href: '/downloads',
                className: 'btn btn-outline',
                style: {
                  border: '1px solid var(--border-medium)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                },
                children: 'Downloads',
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
