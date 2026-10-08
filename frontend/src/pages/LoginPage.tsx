import React, { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../features/auth/components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { register as apiRegister } from '../api/auth';
import { ApiError } from '../api/client';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isInitialChecking } = useAuth();
  const [viewMode, setViewMode] = useState<'login' | 'signup'>('login');

  // Where to redirect after login — from router state or default
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  // Still checking initial session
  if (isInitialChecking) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // Already authenticated — go to the intended destination
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return (
    <main
      className="relative w-screen h-screen min-h-screen overflow-hidden grid place-items-center bg-slate-900 font-sans p-4"
      role="main"
    >
      {/* Clean card — zero glass / glow */}
      <div className="relative z-10 w-full max-w-[420px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8">
        {viewMode === 'login' ? (
          <LoginForm
            onSuccess={() => navigate(from, { replace: true })}
            onNavigateToSignUp={() => setViewMode('signup')}
          />
        ) : (
          <SignupPanel onBack={() => setViewMode('login')} />
        )}
      </div>
    </main>
  );
};

/* -------------------------------------------------------------------------- */
/*  Signup sub-panel                                                            */
/* -------------------------------------------------------------------------- */

interface SignupPanelProps {
  onBack: () => void;
}

const SignupPanel: React.FC<SignupPanelProps> = ({ onBack }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError('All fields are required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      // POST /api/v1/auth/register — {first_name, last_name, email, password}
      await apiRegister({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
      });
      setSuccess(true);
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
          Create account
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Get started with NexusCloud multi-cloud orchestration.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {success ? (
        <div className="py-8 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-900">Account created!</p>
          <p className="text-xs text-slate-500">Redirecting to sign in…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">First name</label>
              <Input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alex"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Last name</label>
              <Input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Chen"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Email address</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              disabled={loading}
            />
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={loading} className="w-full h-10">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Creating account…</span>
                </>
              ) : (
                <span>Create account</span>
              )}
            </Button>
          </div>

          <div className="pt-1 text-center text-xs text-slate-500">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={onBack}
              className="text-blue-600 hover:underline font-medium cursor-pointer"
            >
              Sign in
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
