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
import { Link } from 'react-router-dom';

import Logo from './Logo';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center space-x-3 mb-6">
              <div className="brand-logo">
                <Logo size={48} aria-label="FUEP Logo" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white leading-tight">FUEP</span>
                <span className="text-sm font-medium text-gray-300 leading-tight">
                  Post-UTME Portal
                </span>
              </div>
            </Link>

            <p className="text-gray-300 mb-6 leading-relaxed">
              Empowering students with a seamless and professional university admission experience.
              Your gateway to academic excellence starts here.
            </p>

            {/* Social Media Links */}
            <div className="flex space-x-4">
              <a
                href="#"
                className="p-2 bg-gray-800 text-gray-300 hover:bg-primary-600 hover:text-white rounded-lg transition-colors duration-200"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-800 text-gray-300 hover:bg-primary-600 hover:text-white rounded-lg transition-colors duration-200"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-800 text-gray-300 hover:bg-primary-600 hover:text-white rounded-lg transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-800 text-gray-300 hover:bg-primary-600 hover:text-white rounded-lg transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-800 text-gray-300 hover:bg-primary-600 hover:text-white rounded-lg transition-colors duration-200"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/apply"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Apply Now
                </Link>
              </li>
              <li>
                <Link
                  to="/status"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Check Status
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/downloads"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Downloads
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://fuep.edu.ng"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200 inline-flex items-center space-x-2"
                >
                  <span>University Website</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </li>
              <li>
                <a
                  href="https://fuep.edu.ng/admissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200 inline-flex items-center space-x-2"
                >
                  <span>Admissions Guide</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </li>
              <li>
                <a
                  href="https://fuep.edu.ng/programs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200 inline-flex items-center space-x-2"
                >
                  <span>Academic Programs</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </li>
              <li>
                <a
                  href="https://fuep.edu.ng/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition-colors duration-200 inline-flex items-center space-x-2"
                >
                  <span>Contact Information</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-6">Contact Us</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-primary-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Federal University of Education, Pankshin
                    <br />
                    Pankshin, Plateau State
                    <br />
                    Nigeria
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-primary-400 flex-shrink-0" />
                <a
                  href="tel:+2348031234567"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  +234 803 123 4567
                </a>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-primary-400 flex-shrink-0" />
                <a
                  href="mailto:admissions@fuep.edu.ng"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  admissions@fuep.edu.ng
                </a>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-primary-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  Mon - Fri: 8:00 AM - 5:00 PM
                  <br />
                  Sat: 9:00 AM - 1:00 PM
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex items-center justify-center space-x-3">
              <Shield className="h-6 w-6 text-primary-400" />
              <span className="text-gray-300">Secure & Confidential</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <GraduationCap className="h-6 w-6 text-primary-400" />
              <span className="text-gray-300">Accredited Institution</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Clock className="h-6 w-6 text-primary-400" />
              <span className="text-gray-300">24/7 Portal Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              &copy; {currentYear} FUEP_ICT. All rights reserved.
            </div>

            <div className="flex space-x-6 text-sm">
              <Link
                to="/privacy"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                Terms of Service
              </Link>
              <Link
                to="/accessibility"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
