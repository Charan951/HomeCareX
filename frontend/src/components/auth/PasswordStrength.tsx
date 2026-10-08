import React, { useMemo } from 'react';

export interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export type StrengthLevel = 'Weak' | 'Fair' | 'Good' | 'Strong';

interface StrengthInfo {
  score: number; // 0 to 4
  level: StrengthLevel | '';
  barColor: string;
  textColor: string;
}

export function evaluatePasswordStrength(password: string): StrengthInfo {
  if (!password) {
    return { score: 0, level: '', barColor: 'bg-gray-200', textColor: 'text-gray-400' };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (password.length < 6) {
    score = Math.min(score, 1);
  }

  const normalizedScore = Math.max(1, Math.min(4, score));

  switch (normalizedScore) {
    case 1:
      return { score: 1, level: 'Weak', barColor: 'bg-red-500', textColor: 'text-red-600' };
    case 2:
      return { score: 2, level: 'Fair', barColor: 'bg-amber-500', textColor: 'text-amber-600' };
    case 3:
      return { score: 3, level: 'Good', barColor: 'bg-[#4338ca]', textColor: 'text-[#4338ca]' };
    case 4:
    default:
      return { score: 4, level: 'Strong', barColor: 'bg-emerald-600', textColor: 'text-emerald-600' };
  }
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password, className = '' }) => {
  const { level, textColor } = useMemo(
    () => evaluatePasswordStrength(password),
    [password]
  );

  if (!password) {
    return null;
  }

  return (
    <div className={`mt-1 flex items-center justify-between text-xs ${className}`} role="status" aria-live="polite">
      <span className="text-gray-500">Password strength:</span>
      <span className={`font-semibold ${textColor}`}>{level}</span>
    </div>
  );
};

export default PasswordStrength;
