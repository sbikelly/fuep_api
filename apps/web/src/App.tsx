import './index.css';

import { Status, StatusSchema } from '@fuep/types';
import { Link, Outlet, useLocation } from 'react-router-dom';

import ICTBadge from './components/ICTBadge';
import Logo from './components/Logo';

export default function App() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="app-root">
      <header className="app-header">
        {/*
        <div className="container">
          <div className="brand">
            <div className="brand-logo">
              <Logo size={40} aria-label="FUEP Logo" />
            </div>
            <div>
              <h1>FUEP Post-UTME Portal</h1>
              <small style={{ opacity: 0.8, fontWeight: 'normal' }}>
                Federal University of Education, Pankshin
              </small>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <ICTBadge size={20} />
            <span>ICT Division</span>
          </div>
        </div>
          */}
        <nav
          className="nav"
          style={{
            background: 'rgba(0,0,0,0.1)',
            padding: '12px 0',
            justifyContent: 'center',
          }}
        >
          <div className="container">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Home
            </Link>
            <Link to="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`}>
              Login
            </Link>
            <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
              Profile
            </Link>
            <Link to="/payment" className={`nav-link ${isActive('/payment') ? 'active' : ''}`}>
              Payment
            </Link>
            <Link to="/status" className={`nav-link ${isActive('/status') ? 'active' : ''}`}>
              Status
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="app-footer">
        <div className="container">
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              © 2024 Federal University of Education, Pankshin. All rights reserved.
              <ICTBadge size={16} />
            </p>
          </div>
          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/contact">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
