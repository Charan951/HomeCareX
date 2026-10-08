import React from 'react';
import { Link } from 'react-router-dom';

interface AuthFormHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}

export const AuthFormHeader: React.FC<AuthFormHeaderProps> = ({
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div className={`text-center mb-6 ${className}`}>
      {/* Centered Brand Logo */}
      <Link
        to="/"
        className="inline-block transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#4338ca] rounded-xl"
        aria-label="HomeCareX Home"
      >
        <img
          src="/logo.png"
          alt="HomeCareX"
          className="h-10 sm:h-12 w-auto mx-auto object-contain mix-blend-multiply"
        />
      </Link>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-4 tracking-tight">
        {title}
      </h1>

      {subtitle && (
        <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default AuthFormHeader;
