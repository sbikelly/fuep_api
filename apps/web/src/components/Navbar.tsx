import './../index.css';

import { BarChart3, BookOpen, FileText, GraduationCap, LogIn, Menu, User, X } from 'lucide-react';
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
        {/* Main Navbar Row */}
        <div className="flex items-center justify-between h-20">
          {/* Left Side - Logo and Brand */}
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

          {/* Right Side - Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {/* Navigation Links */}
            <div className="flex items-center space-x-1">
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

            {/* CTA Buttons */}
            <div className="flex items-center space-x-3 ml-4">
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

        {/* Mobile Navigation Menu - Full Width Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute left-0 right-0 top-20 bg-white border-t border-gray-100 shadow-lg">
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Navigation Links */}
              <div className="grid grid-cols-2 gap-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 p-4 rounded-lg font-medium transition-colors duration-200 ${
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
              </div>

              {/* Mobile CTA Buttons */}
              <div className="pt-4 space-y-3">
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
