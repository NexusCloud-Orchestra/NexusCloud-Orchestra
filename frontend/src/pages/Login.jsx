import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import PasswordInput from '../components/PasswordInput';
import NeuralBackground from '../components/NeuralBackground';
import '../css/Login.css';

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    if (!form.email) {
      setErrors({ email: 'Please enter your email address.' });
      return;
    }
    if (!form.password) {
      setErrors({ password: 'Please enter your password.' });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/');
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
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to continue.</p>
          </div>

          <form onSubmit={handleSignIn} noValidate className="form-layout">
            <div className="input-container">
              <label htmlFor="login-email" className="input-label">Email Address</label>
              <input
                type="email"
                id="login-email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name123@gmail.com"
                className={`corp-input ${errors.email ? 'is-invalid' : ''}`}
              />
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>

            <div className="input-container">
              <label htmlFor="login-password" className="input-label">Password</label>
              <PasswordInput
                value={form.password}
                onChange={handleChange}
                name="password"
                placeholder="••••••••"
                id="login-password"
                className={`corp-input ${errors.password ? 'is-invalid' : ''}`}
              />
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>

            <div className="options-row">
              <label className="checkbox-wrap">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember this device</span>
              </label>
              <Link to="#" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="btn-corp-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="auth-switch-text">
              Don't have an account?
              <Link to="/register">Create Account</Link>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Login;
