import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordChecks = useMemo(() => {
    const password = form.password;
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
  }, [form.password]);

  const passwordValid = Object.values(passwordChecks).every(Boolean);
  const confirmMatches = form.confirmPassword && form.password === form.confirmPassword;

  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
        if (!value.trim()) return 'First name is required.';
        return '';
      case 'lastName':
        if (!value.trim()) return 'Last name is required.';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address.';
        return '';
      case 'password':
        if (!value) return 'Password is required.';
        if (!passwordValid) return 'Password does not meet the requirements.';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password.';
        if (!confirmMatches) return 'Passwords do not match.';
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
      firstName: validateField('firstName', form.firstName),
      lastName: validateField('lastName', form.lastName),
      email: validateField('email', form.email),
      password: validateField('password', form.password),
      confirmPassword: validateField('confirmPassword', form.confirmPassword),
    };
    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    }, 1200);
  };

  return (
    <div className="auth-page register-page">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-orb orb-three" />

      <div className={`auth-card register-card ${success ? 'success-state' : ''}`}>
        <div className="auth-header">
          <h2>Create Your Account</h2>
          <p>Join Nexus and start your journey.</p>
        </div>

        {success ? (
          <div className="success-box">
            <div className="success-icon">✓</div>
            <h3>Registration Successful!</h3>
            <p>Redirecting you to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="split-fields">
              <label className="field">
                <span>First Name</span>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="First name"
                />
                {errors.firstName && <small className="field-error">{errors.firstName}</small>}
              </label>

              <label className="field">
                <span>Last Name</span>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Last name"
                />
                {errors.lastName && <small className="field-error">{errors.lastName}</small>}
              </label>
            </div>

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
                  placeholder="Create a password"
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
              <div className="requirements-list">
                <span className={passwordChecks.length ? 'valid' : ''}>✓ Min 8 chars</span>
                <span className={passwordChecks.uppercase ? 'valid' : ''}>✓ Uppercase</span>
                <span className={passwordChecks.lowercase ? 'valid' : ''}>✓ Lowercase</span>
                <span className={passwordChecks.number ? 'valid' : ''}>✓ Number</span>
                <span className={passwordChecks.special ? 'valid' : ''}>✓ Special char</span>
              </div>
              {errors.password && <small className="field-error">{errors.password}</small>}
            </label>

            <label className="field">
              <span>Confirm Password</span>
              <div className="password-wrapper">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {form.confirmPassword && confirmMatches && <small className="success-text">Passwords match.</small>}
              {errors.confirmPassword && <small className="field-error">{errors.confirmPassword}</small>}
            </label>

            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <span className="spinner" /> : 'Create Account'}
            </button>
          </form>
        )}

        <p className="bottom-link">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
