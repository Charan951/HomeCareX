import React from 'react';

// The HomeCareX icon mark: an indigo house roofline (with a 2x2 window and a
// chimney notch) sitting on an orange leaf/hand shape, matching the brand kit
// colors (#4338CA indigo, #FF8A3D orange).
export const HomeCarexMark: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="HomeCareX"
    role="img"
  >
    <defs>
      <linearGradient id="hcx-orange" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFB25E" />
        <stop offset="100%" stopColor="#FF8A3D" />
      </linearGradient>
    </defs>

    {/* Orange leaf / cupped-hand base */}
    <path
      d="M18 58
         C 16 72, 28 86, 46 87
         C 63 88, 78 78, 81 62
         C 82.5 54, 76 49, 70 52
         C 66 54, 65 58, 60 58
         C 55 58, 53 51, 46 52
         C 40 53, 39 58, 33 57
         C 28 56, 25 51, 20 54
         C 18.5 55, 18 56.5, 18 58 Z"
      fill="url(#hcx-orange)"
    />

    {/* Indigo house roofline with chimney notch */}
    <path
      d="M13 54 L48 18 L64 31 L64 18 L76 18 L76 42 L87 51"
      fill="none"
      stroke="#4338CA"
      strokeWidth="7.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* 2x2 window */}
    <g fill="#4338CA">
      <rect x="41" y="36" width="9" height="9" rx="1.5" />
      <rect x="52" y="36" width="9" height="9" rx="1.5" />
      <rect x="41" y="47" width="9" height="9" rx="1.5" />
      <rect x="52" y="47" width="9" height="9" rx="1.5" />
    </g>
  </svg>
);

export default HomeCarexMark;