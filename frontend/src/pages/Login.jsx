import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/Login.css';

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Validate email and password on change.
  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value.trim()) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address.';
        return '';
      case 'password':
        if (!value) return 'Password is required.';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateForm = () => {
    const nextErrors = {
      email: validateField('email', form.email),
      password: validateField('password', form.password),
    };
    setErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/dashboard');
    }, 1200);
  };

  return (
    <div className="auth-page login-page">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-orb orb-three" />

      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">N</div>
          <div>
            <h1>Nexus</h1>
            <p>Secure access</p>
          </div>
        </div>

        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to continue to Nexus.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <label className="field">
            <span>Email Address</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
            {errors.email && <small className="field-error">{errors.email}</small>}
          </label>

          <label className="field">
            <span>Password</span>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.password && <small className="field-error">{errors.password}</small>}
          </label>

          <div className="options-row">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe((prev) => !prev)}
              />
              <span>Remember Me</span>
            </label>
            <button type="button" className="link-button">
              Forgot Password?
            </button>
          </div>

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner" /> : 'Sign In'}
          </button>

          <div className="divider">
            <span />
            <p>OR</p>
            <span />
          </div>
        </form>

        <p className="bottom-link">
          Don&apos;t have an account?{' '}
          <Link to="/register">Register Now</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
