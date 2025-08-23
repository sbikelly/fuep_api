import './index.css';

import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Outlet } from 'react-router-dom';

import Footer from './components/Footer';
import Navbar from './components/Navbar';
export default function App() {
  return _jsxs('div', {
    className: 'app-root',
    children: [
      _jsx('header', { className: 'app-header', children: _jsx(Navbar, {}) }),
      _jsx('main', { children: _jsx(Outlet, {}) }),
      _jsx(Footer, {}),
    ],
  });
}
