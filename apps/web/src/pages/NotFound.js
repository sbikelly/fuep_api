import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
export default function NotFound() {
  return _jsxs('section', {
    children: [
      _jsx('h2', { children: '404 \u2014 Not Found' }),
      _jsx('p', { children: 'The page you are looking for was not found.' }),
      _jsxs('p', { children: ['Return to ', _jsx('a', { href: '/', children: 'Home' })] }),
    ],
  });
}
