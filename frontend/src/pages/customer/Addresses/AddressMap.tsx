/** Decorative map thumbnail (no tiles, no network). The pin is fixed; streets vary per address so cards look distinct. */
function hash(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export default function AddressMap({ seed, className }: { seed: string; className?: string }) {
  const h = hash(seed);
  const angle = (h % 50) - 25;
  const shift = ((h >> 4) % 50) - 25;
  const parkX = 190 + ((h >> 8) % 60);
  return (
    <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className={className}>
      <rect width="200" height="200" fill="#ECEEF7" />
      <rect x={parkX - 150} y="20" width="60" height="46" rx="8" fill="#D9EEDF" />
      <path d="M-10 168 C 50 140, 120 190, 210 150 L210 210 L-10 210 Z" fill="#D2E2F6" />
      <g transform={`rotate(${angle} 100 100) translate(${shift} 0)`} stroke="#fff" strokeLinecap="round">
        <path d="M-40 100 H240" strokeWidth="12" />
        <path d="M100 -40 V240" strokeWidth="12" />
        <path d="M-40 40 H240 M-40 160 H240 M40 -40 V240 M160 -40 V240" strokeWidth="5" />
      </g>
      <ellipse cx="100" cy="122" rx="12" ry="4" fill="#1E1B2E" opacity=".18" />
      <path d="M100 118 C 84 98, 80 88, 80 80 a20 20 0 1 1 40 0 c0 8 -4 18 -20 38 Z" fill="#4338CA" />
      <circle cx="100" cy="80" r="7.5" fill="#fff" />
    </svg>
  );
}
