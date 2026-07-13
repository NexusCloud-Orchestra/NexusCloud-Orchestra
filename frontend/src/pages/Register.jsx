import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import PasswordInput from '../components/PasswordInput';
import NeuralBackground from '../components/NeuralBackground';
import '../css/Register.css';

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!form.firstName.trim()) nextErrors.firstName = 'First name is required.';
    if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required.';
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!form.password) {
      nextErrors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }
    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/login');
    }, 800);
  };

  return (
    <div className="auth-split-layout fade-in">
      {/* LEFT PANEL: Clean Dark Sidebar */}
      <aside className="auth-left-sidebar">
        <NeuralBackground />
        <div>
          <Logo textColor="#FFFFFF" />
          <div className="sidebar-content">
            <h2 className="sidebar-tagline">Secure Multi-Cloud Storage Orchestration</h2>
            <p className="sidebar-desc">
              Aggregate AWS, GCP, Azure, and Cloudflare storage tiers into a single smart-routed endpoint.
            </p>
          </div>
        </div>

        {/* Minimal Corporate SVG Cloud Diagram */}
        <div className="cloud-mockup-wrapper">
          <svg className="cloud-svg-diagram" width="280" height="180" viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Orchestrator node */}
            <rect x="110" y="70" width="60" height="40" rx="6" fill="#2563EB" />
            <text x="140" y="94" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="Inter">NEXUS</text>
            
            {/* Storage node AWS */}
            <rect x="20" y="20" width="50" height="30" rx="4" fill="#1E293B" stroke="#334155" strokeWidth="1" />
            <text x="45" y="38" fill="#94A3B8" fontSize="9" textAnchor="middle" fontFamily="Inter">AWS</text>
            
            {/* Storage node GCP */}
            <rect x="210" y="20" width="50" height="30" rx="4" fill="#1E293B" stroke="#334155" strokeWidth="1" />
            <text x="235" y="38" fill="#94A3B8" fontSize="9" textAnchor="middle" fontFamily="Inter">GCP</text>
            
            {/* Storage node Azure */}
            <rect x="20" y="130" width="50" height="30" rx="4" fill="#1E293B" stroke="#334155" strokeWidth="1" />
            <text x="45" y="148" fill="#94A3B8" fontSize="9" textAnchor="middle" fontFamily="Inter">AZURE</text>

            {/* Storage node R2 */}
            <rect x="210" y="130" width="50" height="30" rx="4" fill="#1E293B" stroke="#334155" strokeWidth="1" />
            <text x="235" y="148" fill="#94A3B8" fontSize="9" textAnchor="middle" fontFamily="Inter">CF R2</text>

            {/* Connecting lines */}
            <path d="M70 35 L110 75" stroke="#334155" strokeWidth="1.5" className="connection-line" />
            <path d="M210 35 L170 75" stroke="#334155" strokeWidth="1.5" className="connection-line" />
            <path d="M70 145 L110 105" stroke="#334155" strokeWidth="1.5" className="connection-line" />
            <path d="M210 145 L170 105" stroke="#334155" strokeWidth="1.5" className="connection-line" />

            {/* Pulsing signal nodes (neurons) moving along the pathways */}
            <circle r="3" fill="#38BDF8">
              <animateMotion dur="2.5s" repeatCount="indefinite" path="M 70 35 L 110 75" />
            </circle>
            <circle r="3" fill="#0EA5E9">
              <animateMotion dur="3.2s" repeatCount="indefinite" path="M 210 35 L 170 75" />
            </circle>
            <circle r="3" fill="#2563EB">
              <animateMotion dur="2.8s" repeatCount="indefinite" path="M 70 145 L 110 105" />
            </circle>
            <circle r="3" fill="#38BDF8">
              <animateMotion dur="3.5s" repeatCount="indefinite" path="M 210 145 L 170 105" />
            </circle>
          </svg>
        </div>
      </aside>

      {/* RIGHT PANEL: Clean Light Corporate Form */}
      <section className="auth-form-panel">
        <div className="corporate-auth-card">
          <div className="form-header">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Get started with your multi-cloud drive.</p>
          </div>

          <form onSubmit={handleRegister} noValidate className="form-layout">
            <div className="form-grid-columns">
              <div className="input-container">
                <label htmlFor="reg-firstname" className="input-label">First Name</label>
                <input
                  type="text"
                  id="reg-firstname"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Jane"
                  className={`corp-input ${errors.firstName ? 'is-invalid' : ''}`}
                />
                {errors.firstName && <div className="error-message">{errors.firstName}</div>}
              </div>

              <div className="input-container">
                <label htmlFor="reg-lastname" className="input-label">Last Name</label>
                <input
                  type="text"
                  id="reg-lastname"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className={`corp-input ${errors.lastName ? 'is-invalid' : ''}`}
                />
                {errors.lastName && <div className="error-message">{errors.lastName}</div>}
              </div>
            </div>

            <div className="input-container">
              <label htmlFor="reg-email" className="input-label">Email Address</label>
              <input
                type="email"
                id="reg-email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name123@gmail.com"
                className={`corp-input ${errors.email ? 'is-invalid' : ''}`}
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>

            <div className="input-container">
              <label htmlFor="reg-password" className="input-label">Password</label>
              <PasswordInput
                value={form.password}
                onChange={handleChange}
                name="password"
                placeholder="At least 8 characters"
                id="reg-password"
                className={`corp-input ${errors.password ? 'is-invalid' : ''}`}
              />
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>

            <div className="input-container">
              <label htmlFor="reg-confirmPassword" className="input-label">Confirm Password</label>
              <PasswordInput
                value={form.confirmPassword}
                onChange={handleChange}
                name="confirmPassword"
                placeholder="••••••••"
                id="reg-confirmPassword"
                className={`corp-input ${errors.confirmPassword ? 'is-invalid' : ''}`}
              />
              {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
            </div>

            <button type="submit" className="btn-corp-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>

            <div className="auth-switch-text">
              Already have an account?
              <Link to="/login">Sign In</Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Register;
