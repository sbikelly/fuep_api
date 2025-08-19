import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container">
      {/* Hero Section */}
      <div className="page-header">
        <h1>Welcome to FUEP Post-UTME Portal</h1>
        <p>
          Streamline your post-UTME application process with our comprehensive digital platform.
          Complete your application, manage payments, and track your admission status all in one
          place.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">New Application</h3>
            <p className="card-subtitle">Start your post-UTME application process</p>
          </div>
          <p className="mb-4">
            Begin your journey to FUEP by creating a new application. You'll need your JAMB
            registration number and supporting documents.
          </p>
          <Link to="/login" className="btn btn-primary btn-full">
            Start Application
          </Link>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Returning Candidate</h3>
            <p className="card-subtitle">Access your existing application</p>
          </div>
          <p className="mb-4">
            Already have an account? Log in to continue your application, update your profile, or
            check your admission status.
          </p>
          <Link to="/login" className="btn btn-secondary btn-full">
            Login
          </Link>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Application Status</h3>
            <p className="card-subtitle">Check your application progress</p>
          </div>
          <p className="mb-4">
            Track the status of your application, payment confirmations, and admission decisions in
            real-time.
          </p>
          <Link to="/status" className="btn btn-info btn-full">
            Check Status
          </Link>
        </div>
      </div>

      {/* Information Section */}
      <div className="card mb-8">
        <div className="card-header">
          <h2>Important Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-primary mb-3">Application Requirements</h4>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Valid JAMB registration number</li>
              <li>Recent passport photograph</li>
              <li>O'Level results (WAEC/NECO)</li>
              <li>Valid email address and phone number</li>
              <li>Payment for post-UTME screening</li>
            </ul>
          </div>
          <div>
            <h4 className="text-primary mb-3">Application Process</h4>
            <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Verify JAMB registration number</li>
              <li>Complete personal information</li>
              <li>Upload required documents</li>
              <li>Make payment for screening</li>
              <li>Print registration form</li>
              <li>Attend screening exercise</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Contact & Support */}
      <div className="card">
        <div className="card-header">
          <h2>Need Help?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div
              style={{
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
              }}
            >
              📧
            </div>
            <h4>Email Support</h4>
            <p className="text-secondary">admissions@fuep.edu.ng</p>
          </div>

          <div className="text-center">
            <div
              style={{
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
              }}
            >
              📞
            </div>
            <h4>Phone Support</h4>
            <p className="text-secondary">+234 XXX XXX XXXX</p>
          </div>

          <div className="text-center">
            <div
              style={{
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
              }}
            >
              💬
            </div>
            <h4>Live Chat</h4>
            <p className="text-secondary">Available during business hours</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="text-center mt-8">
        <h3 className="mb-4">Quick Links</h3>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="https://fuep.edu.ng"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
            style={{
              border: '1px solid var(--border-medium)',
              background: 'transparent',
              color: 'var(--text-primary)',
            }}
          >
            University Website
          </a>
          <a
            href="/faq"
            className="btn btn-outline"
            style={{
              border: '1px solid var(--border-medium)',
              background: 'transparent',
              color: 'var(--text-primary)',
            }}
          >
            FAQ
          </a>
          <a
            href="/downloads"
            className="btn btn-outline"
            style={{
              border: '1px solid var(--border-medium)',
              background: 'transparent',
              color: 'var(--text-primary)',
            }}
          >
            Downloads
          </a>
        </div>
      </div>
    </div>
  );
}
