import { Star } from "lucide-react";

interface StarsProps {
  /** 0 to 5, decimals allowed (4.6 fills 92% of the row). */
  value: number;
  size?: number;
  className?: string;
}

function Row({ filled, size }: { filled: boolean; size: number }) {
  return (
    <span className="flex w-max shrink-0" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={filled ? "fill-accent text-accent" : "fill-line text-line"} />
      ))}
    </span>
  );
}

/** Five stars with a partial fill, announced as one image ("4.6 out of 5 stars"). */
export default function Stars({ value, size = 16, className }: StarsProps) {
  const clamped = Math.max(0, Math.min(5, value));
  return (
    <span role="img" aria-label={`${clamped.toFixed(1)} out of 5 stars`} className={`relative inline-flex ${className ?? ""}`}>
      <Row filled={false} size={size} />
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${(clamped / 5) * 100}%` }}>
        <Row filled size={size} />
      </span>
    </span>
  );
}
