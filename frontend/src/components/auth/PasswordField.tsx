import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

export interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  name: string;
  label: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  error,
  helperText,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  required = false,
  disabled = false,
  containerClassName = '',
  className = '',
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  return (
    <div className={`group ${containerClassName}`}>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="block text-xs sm:text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338ca] transition-colors pointer-events-none">
          <Lock size={17} aria-hidden="true" />
        </div>

        <input
          {...rest}
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full rounded-lg border bg-white pl-9 sm:pl-10 pr-10 py-2 sm:py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4338ca]/30 focus:border-[#4338ca] hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
            error ? 'border-red-400 focus:ring-red-400/30 focus:border-red-500' : 'border-gray-300'
          } ${className}`}
        />

        <button
          type="button"
          tabIndex={0}
          disabled={disabled}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 focus:text-[#4338ca] focus:outline-none focus:ring-1 focus:ring-[#4338ca] rounded transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
        </button>
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600 flex items-center gap-1">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="mt-1 text-xs text-gray-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default PasswordField;
