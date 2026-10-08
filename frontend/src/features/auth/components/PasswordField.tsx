import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  error?: string;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  name,
  value,
  onChange,
  disabled = false,
  placeholder = '••••••••••••',
  autoComplete = 'current-password',
  required = true,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      <div className="relative flex items-center">
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={`w-full h-[52px] px-4 pr-12 text-[15px] text-[#102A43] placeholder-[#7890A0] rounded-[12px] transition-all duration-150 outline-none ${
            error
              ? 'border border-red-400 focus:border-red-500 focus:ring-3 focus:ring-red-200/50'
              : 'border border-[rgba(16,42,67,0.12)] focus:border-[#397DB7] focus:ring-3 focus:ring-[#397DB7]/12'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.78)',
          }}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-[#7890A0] hover:text-[#102A43] transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-[#397DB7]/30 disabled:opacity-50 cursor-pointer"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 text-[#7890A0]" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4 text-[#7890A0]" aria-hidden="true" />
          )}
        </button>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
