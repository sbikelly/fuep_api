import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  GraduationCap,
  LogIn,
  Play,
  Shield,
  Star,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50 py-16 lg:py-24 xl:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4" />
              <span>Official FUEP Post-UTME Portal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary-900 mb-6 leading-tight">
              Your Gateway to
              <span className="block text-primary-600">Academic Excellence</span>
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 lg:mb-10 max-w-4xl mx-auto leading-relaxed">
              Streamline your university admission process with our comprehensive Post-UTME portal.
              Apply, pay fees, upload documents, and track your admission status all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10 lg:mb-12">
              <Link
                to="/apply"
                className="group inline-flex items-center space-x-3 bg-primary-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl hover:bg-primary-700 transform hover:-translate-y-1 transition-all duration-200"
              >
                <span>Start Your Application</span>
                <ArrowRight className="h-4 w-5 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>

              <Link
                to="/status"
                className="inline-flex items-center space-x-3 bg-white text-primary-700 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg border-2 border-primary-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
              >
                <Clock className="h-4 w-5 sm:h-5 sm:w-5" />
                <span>Check Status</span>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Secure & Confidential</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>24/7 Access</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span>Thousands of Students</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-900 mb-4">
              Why Choose Our Portal?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Experience a seamless, professional, and efficient application process designed with
              students in mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="group p-6 lg:p-8 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300 bg-white">
              <div className="flex justify-center mb-6">
                <div className="p-3 lg:p-4 bg-primary-100 rounded-2xl group-hover:bg-primary-200 transition-colors duration-200">
                  <BookOpen className="h-6 w-6 lg:h-8 lg:w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-primary-900 mb-3 lg:mb-4 text-center">
                Easy Application Process
              </h3>
              <p className="text-gray-600 text-center leading-relaxed text-sm lg:text-base">
                Simple step-by-step application process with real-time validation, progress
                tracking, and helpful guidance at every step.
              </p>
            </div>

            <div className="group p-6 lg:p-8 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300 bg-white">
              <div className="flex justify-center mb-6">
                <div className="p-3 lg:p-4 bg-primary-100 rounded-2xl group-hover:bg-primary-200 transition-colors duration-200">
                  <FileText className="h-6 w-6 lg:h-8 lg:w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-primary-900 mb-3 lg:mb-4 text-center">
                Document Management
              </h3>
              <p className="text-gray-600 text-center leading-relaxed text-sm lg:text-base">
                Secure upload and management of all required documents, academic records, and
                supporting materials in one organized location.
              </p>
            </div>

            <div className="group p-6 lg:p-8 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300 bg-white">
              <div className="flex justify-center mb-6">
                <div className="p-3 lg:p-4 bg-primary-100 rounded-2xl group-hover:bg-primary-200 transition-colors duration-200">
                  <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-primary-600" />
                </div>
              </div>
              <h3 className="text-lg lg:text-xl font-semibold text-primary-900 mb-3 lg:mb-4 text-center">
                Real-time Updates
              </h3>
              <p className="text-gray-600 text-center leading-relaxed text-sm lg:text-base">
                Track your application status, payment confirmations, document reviews, and
                admission decisions with instant notifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 lg:py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              Trusted by Thousands of Students
            </h2>
            <p className="text-lg sm:text-xl opacity-90 max-w-3xl mx-auto">
              Join the growing community of successful applicants who have transformed their
              academic journey through our portal.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 text-center">
            <div className="space-y-2">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">10,000+</div>
              <div className="text-primary-200 text-sm lg:text-base">Successful Applications</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">99.9%</div>
              <div className="text-primary-200 text-sm lg:text-base">Uptime</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">24/7</div>
              <div className="text-primary-200 text-sm lg:text-base">Support Available</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">5.0</div>
              <div className="text-primary-200 text-sm lg:text-base">Student Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6">
            Ready to Begin Your Academic Journey?
          </h2>
          <p className="text-lg sm:text-xl mb-8 lg:mb-10 opacity-90 max-w-3xl mx-auto">
            Take the first step towards your future. Our streamlined application process makes it
            easy to get started.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/apply"
              className="group inline-flex items-center space-x-3 bg-white text-primary-600 hover:bg-gray-50 font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span>Start Application Now</span>
              <ArrowRight className="h-4 w-5 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center space-x-3 border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-200"
            >
              <LogIn className="h-4 w-5 sm:h-5 sm:w-5" />
              <span>Login to Portal</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-4">Quick Access</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to know about the application process and university resources.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a
              href="https://fuep.edu.ng"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200 text-center"
            >
              <div className="p-3 bg-primary-100 rounded-lg inline-block mb-4 group-hover:bg-primary-200 transition-colors duration-200">
                <GraduationCap className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-primary-900 mb-2">University Website</h3>
              <p className="text-gray-600 text-sm">
                Visit the official FUEP website for more information
              </p>
            </a>

            <Link
              to="/faq"
              className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200 text-center"
            >
              <div className="p-3 bg-primary-100 rounded-lg inline-block mb-4 group-hover:bg-primary-200 transition-colors duration-200">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-primary-900 mb-2">
                Frequently Asked Questions
              </h3>
              <p className="text-gray-600 text-sm">
                Find answers to common questions about the application process
              </p>
            </Link>

            <Link
              to="/downloads"
              className="group p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200 text-center"
            >
              <div className="p-3 bg-primary-100 rounded-lg inline-block mb-4 group-hover:bg-primary-200 transition-colors duration-200">
                <Award className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-primary-900 mb-2">Downloads & Resources</h3>
              <p className="text-gray-600 text-sm">
                Access important documents, forms, and guidelines
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
