import React, { useEffect, useRef } from 'react';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
  className?: string;
}

const OTP_LENGTH = 6;

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  onComplete,
  disabled = false,
  hasError = false,
  autoFocus = true,
  className = '',
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into array of 6 characters
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const setDigit = (index: number, char: string) => {
    const chars = value.split('').slice(0, OTP_LENGTH);
    while (chars.length < OTP_LENGTH) chars.push('');
    chars[index] = char;
    const nextValue = chars.join('').trimEnd();
    onChange(nextValue);

    if (nextValue.length === OTP_LENGTH && onComplete) {
      onComplete(nextValue);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        // Clear current digit
        setDigit(index, '');
      } else if (index > 0) {
        // Move to previous digit and clear it
        inputRefs.current[index - 1]?.focus();
        setDigit(index - 1, '');
      }
      return;
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      return;
    }

    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      return;
    }
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Extract only digits
    const numeric = raw.replace(/\D/g, '');

    if (!numeric) {
      setDigit(index, '');
      return;
    }

    // Take the last entered character if single digit entry
    const char = numeric.slice(-1);
    setDigit(index, char);

    // Auto-advance to next box if not on the last box
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    const pasted = e.clipboardData.getData('text/plain');
    const numeric = pasted.replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!numeric) return;

    onChange(numeric);

    // Focus the box after the pasted digits, or the last box
    const focusIndex = Math.min(numeric.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();

    if (numeric.length === OTP_LENGTH && onComplete) {
      onComplete(numeric);
    }
  };

  return (
    <div
      className={`flex items-center justify-between gap-1.5 sm:gap-2.5 w-full ${className}`}
      role="group"
      aria-label="6-digit verification code"
    >
      {Array.from({ length: OTP_LENGTH }).map((_, index) => {
        const digit = digits[index];
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete="one-time-code"
            value={digit}
            disabled={disabled}
            aria-label={`Verification code digit ${index + 1} of ${OTP_LENGTH}`}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={`w-11 h-12 sm:w-12 sm:h-14 text-center font-bold text-lg sm:text-xl rounded-xl border bg-white
                        transition-all duration-200 outline-none
                        ${
                          hasError
                            ? 'border-red-400 text-red-600 focus:border-red-500 focus:ring-2 focus:ring-red-400/30'
                            : 'border-gray-300 text-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 hover:border-gray-400'
                        }
                        disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed`}
          />
        );
      })}
    </div>
  );
};

export default OtpInput;
