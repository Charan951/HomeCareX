import { useId } from "react";

interface IconProps {
  className?: string;
}

/** Soft "clay" 3D map pin (indigo) for the delivery-address chip. Decorative: the text beside it carries the meaning. */
export function Pin3D({ className }: IconProps) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id={`${id}b`} x1="8" y1="2" x2="25" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9D90FF" />
          <stop offset="1" stopColor="#3B30C4" />
        </linearGradient>
        <radialGradient id={`${id}d`} cx="0.35" cy="0.3" r="0.9">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DAD5FF" />
        </radialGradient>
      </defs>
      <ellipse cx="16" cy="29.4" rx="6.5" ry="1.7" fill="#4338CA" opacity=".22" />
      <path
        d="M16 2C9.9 2 5 6.8 5 12.8c0 7.4 9.2 14.4 10.4 15.3a1 1 0 0 0 1.2 0C17.8 27.2 27 20.2 27 12.8 27 6.8 22.1 2 16 2Z"
        fill={`url(#${id}b)`}
      />
      <path d="M9 9.2C10.4 6.2 13.2 4.4 16 4.4" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="12.6" r="4.7" fill={`url(#${id}d)`} />
      <circle cx="16" cy="12.6" r="2" fill="#4338CA" opacity=".18" />
    </svg>
  );
}

/** Soft "clay" 3D bell (brand orange) for the notifications button. */
export function Bell3D({ className }: IconProps) {
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id={`${id}b`} x1="7" y1="3" x2="25" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFC27A" />
          <stop offset="1" stopColor="#F26A0C" />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="16" y1="23" x2="16" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF9A3D" />
          <stop offset="1" stopColor="#D95A06" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="3.6" r="1.7" fill="#F26A0C" />
      <path
        d="M16 4.6c-4.7 0-8 3.6-8 8.3v3.8c0 2-1.2 3.4-2.3 4.6-.6.7-.2 1.7.7 1.7h19.2c.9 0 1.3-1 .7-1.7-1.1-1.2-2.3-2.6-2.3-4.6v-3.8c0-4.7-3.3-8.3-8-8.3Z"
        fill={`url(#${id}b)`}
      />
      <path d="M10.4 12.2c.4-2.6 2.2-4.4 4.4-4.9" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12.6 24.6a3.5 3.5 0 0 0 6.8 0Z" fill={`url(#${id}c)`} />
    </svg>
  );
}
