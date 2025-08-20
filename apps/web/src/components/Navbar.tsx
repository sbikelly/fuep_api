import './../index.css';

import { Status, StatusSchema } from '@fuep/types';
import { BookOpen, LogIn,User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import Logo from './Logo';
const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="shadow-md border-b border-secondary-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="brand-logo">
              <Logo size={40} aria-label="FUEP Logo" />
            </div>
            <span className="text-xl font-bold text-primary-800">FUEP Admissions</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Home
            </Link>
            <Link
              to="/registration"
              className="text-secondary-700 hover:text-primary-600 transition-colors"
            >
              Apply Now
            </Link>
            <Link
              to="/login"
              className="text-secondary-700 hover:text-primary-600 transition-colors"
            >
              Login
            </Link>
            <Link to="/status" className={`nav-link ${isActive('/status') ? 'active' : ''}`}>
              Status
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="btn-primary flex items-center space-x-2">
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </Link>
            <Link to="/registration" className="btn-secondary flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Apply</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
