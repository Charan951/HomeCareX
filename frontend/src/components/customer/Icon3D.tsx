import clsx from "clsx";
import { resolveIcon3D } from "./icons3d";

interface Icon3DProps {
  /** Emoji, name, slug or category text — see resolveIcon3D. */
  hints: (string | null | undefined)[];
  /** Pixel size (width = height). */
  size?: number;
  /** Gentle idle float. Stops automatically for prefers-reduced-motion. */
  float?: boolean;
  /** Offset so a row of icons doesn't bob in sync. */
  delay?: number;
  className?: string;
}

/**
 * A decorative 3D icon. The wrapper floats; the image tilts on hover of any ancestor
 * with the `group` class (see .icon3d in index.css). Always aria-hidden — the text next to it carries the meaning.
 */
export default function Icon3D({ hints, size = 56, float = true, delay = 0, className }: Icon3DProps) {
  const name = resolveIcon3D(...hints);
  return (
    <span
      aria-hidden="true"
      className={clsx("icon3d-wrap inline-flex shrink-0", float && "icon3d--float", className)}
      style={{ width: size, height: size, animationDelay: `${delay}s` }}
    >
      <img
        src={`${import.meta.env.BASE_URL}icons/3d/${name}.png`}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="icon3d h-full w-full object-contain"
      />
    </span>
  );
}
