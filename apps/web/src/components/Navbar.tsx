import './../index.css';

import { BarChart3,BookOpen, FileText, GraduationCap, LogIn, Menu, User, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import Logo from './Logo';

const Navbar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
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

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-3 group" onClick={closeMobileMenu}>
            <div className="brand-logo group-hover:scale-105 transition-transform duration-200">
              <Logo size={48} aria-label="FUEP Logo" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-primary-800 leading-tight">FUEP</span>
              <span className="text-sm font-medium text-primary-600 leading-tight">
                Post-UTME Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-primary-100 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:text-primary-700 hover:bg-gray-50'
                  }`}
                  onClick={closeMobileMenu}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 px-4 py-2 border border-primary-600 text-primary-700 bg-white hover:bg-primary-50 rounded-lg font-medium transition-all duration-200"
            >
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </Link>
            <Link
              to="/apply"
              className="inline-flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <User className="h-4 w-4" />
              <span>Apply Now</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-primary-700 hover:bg-gray-100 transition-colors duration-200"
              aria-expanded="false"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-100 shadow-lg">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                      isActive(item.path)
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'text-gray-600 hover:text-primary-700 hover:bg-gray-50'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Mobile CTA Buttons */}
              <div className="pt-4 space-y-2">
                <Link
                  to="/login"
                  className="flex items-center justify-center space-x-2 px-4 py-3 border border-primary-600 text-primary-700 bg-white hover:bg-primary-50 rounded-lg font-medium transition-colors duration-200"
                  onClick={closeMobileMenu}
                >
                  <LogIn className="h-4 w-4" />
                  <span>Login to Portal</span>
                </Link>
                <Link
                  to="/apply"
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium transition-colors duration-200 shadow-md"
                  onClick={closeMobileMenu}
                >
                  <User className="h-4 w-4" />
                  <span>Start Application</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
