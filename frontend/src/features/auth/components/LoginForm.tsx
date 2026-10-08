import React, { useState } from 'react';
import { PasswordField } from './PasswordField';
import { useAuth } from '../../../hooks/useAuth';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

interface LoginFormProps {
  onSuccess?: () => void;
  onNavigateToSignUp?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onNavigateToSignUp }) => {
  const { login, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const validate = (): boolean => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validate()) return;

    const success = await login(email.trim(), password);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
          Sign in to NexusCloud
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Multi-cloud orchestration control plane
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="mb-5 p-3 rounded-lg border flex items-start gap-2.5 text-xs bg-rose-50 border-rose-200 text-rose-700"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1">
            <p className="font-medium">{error}</p>
            <button
              type="button"
              onClick={handleSubmit as unknown as React.MouseEventHandler}
              className="mt-1 inline-flex items-center gap-1 font-semibold underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1.5">
            Email address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
              if (error) clearError();
            }}
            placeholder="name@company.com"
            disabled={isLoading}
            aria-invalid={!!fieldErrors.email}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-rose-600 font-medium" role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-medium text-slate-700">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowForgotPassword((p) => !p)}
              className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <PasswordField
            id="password"
            name="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
              if (error) clearError();
            }}
            disabled={isLoading}
            error={fieldErrors.password}
          />
        </div>

        {/* Forgot password info */}
        {showForgotPassword && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <p className="font-medium text-slate-900 mb-0.5">Password Recovery</p>
            <p>
              Use <span className="font-medium">POST /api/v1/auth/forgot-password</span> with your
              email, or contact your administrator.
            </p>
          </div>
        )}

        {/* Submit */}
        <div className="pt-2">
          <Button type="submit" disabled={isLoading} className="w-full h-10">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span>Signing in…</span>
              </>
            ) : (
              <span>Sign in</span>
            )}
          </Button>
        </div>

        {/* Register link */}
        <div className="pt-1 text-center text-xs text-slate-500">
          <span>Don't have an account? </span>
          <button
            type="button"
            onClick={onNavigateToSignUp}
            className="text-blue-600 hover:underline font-medium cursor-pointer"
          >
            Create account
          </button>
        </div>
      </form>
    </div>
  );
};
