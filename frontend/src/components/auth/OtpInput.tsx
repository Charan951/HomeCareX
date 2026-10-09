import React, { useEffect, useRef, useState } from 'react';

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

  // Maintain separate state for each of the 6 individual boxes
  const [digits, setDigits] = useState<string[]>(() => {
    const initial = Array(OTP_LENGTH).fill('');
    if (value) {
      for (let i = 0; i < Math.min(value.length, OTP_LENGTH); i++) {
        initial[i] = value[i];
      }
    }
    return initial;
  });

  // Sync when parent clears value (e.g. on resend code) or updates value externally
  useEffect(() => {
    if (!value) {
      setDigits(Array(OTP_LENGTH).fill(''));
    } else if (value !== digits.join('')) {
      const updated = Array(OTP_LENGTH).fill('');
      for (let i = 0; i < Math.min(value.length, OTP_LENGTH); i++) {
        updated[i] = value[i] || '';
      }
      setDigits(updated);
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();

      if (digits[index]) {
        // Case 1: Current box contains a digit
        // Clear only current box's digit; focus remains on the current box
        const next = [...digits];
        next[index] = '';
        setDigits(next);
        onChange(next.join(''));
        inputRefs.current[index]?.focus();
        return;
      }

      // Case 2 & 3: Current box is already empty
      if (index > 0) {
        // Case 2: Clear previous box and move focus to previous box
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        onChange(next.join(''));
        inputRefs.current[index - 1]?.focus();
      }
      // Case 3: index === 0 and empty -> no-op, stay on box 0, no crash
      return;
    }

    if (e.key === 'Delete') {
      e.preventDefault();
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
        onChange(next.join(''));
        inputRefs.current[index]?.focus();
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

    // Reject non-numeric keys except functional/navigation keys
    if (
      !/^[0-9]$/.test(e.key) &&
      !['Tab', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Delete'].includes(e.key) &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault();
    }
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const numeric = raw.replace(/\D/g, '');

    if (!numeric) {
      // If cleared
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      onChange(next.join(''));
      return;
    }

    // Take the last entered character for this box
    const char = numeric.slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    const combined = next.join('');
    onChange(combined);

    // Auto-advance to next box if not on the last box
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== '') && onComplete) {
      onComplete(combined);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    const pasted = e.clipboardData.getData('text/plain');
    const numeric = pasted.replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!numeric) return;

    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < numeric.length; i++) {
      next[i] = numeric[i];
    }
    setDigits(next);

    const focusIndex = Math.min(numeric.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();

    const otpValue = next.join('');
    onChange(otpValue);
    if (numeric.length === OTP_LENGTH && onComplete) {
      onComplete(otpValue);
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
            aria-label={`OTP digit ${index + 1}`}
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
