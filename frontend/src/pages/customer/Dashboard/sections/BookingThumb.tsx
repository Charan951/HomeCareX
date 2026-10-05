import { useState } from "react";
import clsx from "clsx";
import { Icon3D, tintAt } from "@/components/customer";
import { bookingPhoto } from "./dashboardImages";

/**
 * Square thumbnail for a booking row: the service photo when we have one,
 * otherwise (or if the image fails to load) the 3D icon on a tinted tile.
 * Pass the size and radius through `className`, e.g. "h-12 w-12 rounded-2xl".
 */
export default function BookingThumb({ serviceName, index = 0, className }: { serviceName: string; index?: number; className?: string }) {
  const photo = bookingPhoto(serviceName);
  const [failed, setFailed] = useState(false);

  return (
    <span aria-hidden="true" className={clsx("relative flex shrink-0 items-center justify-center overflow-hidden", tintAt(index), className)}>
      {photo && !failed ? (
        <img
          src={photo.src}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
          style={{ objectPosition: photo.position }}
          className="h-full w-full object-cover"
        />
      ) : (
        <Icon3D hints={[serviceName]} size={40} delay={index * -1.1} />
      )}
    </span>
  );
}
