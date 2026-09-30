import React, { useEffect, useRef, useState } from 'react';
import type * as Leaflet from 'leaflet';

const HYDERABAD: L.LatLngExpression = [17.4123, 78.408];

const MapEmbed: React.FC = () => {
  const mapElement = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [mapLoadFailed, setMapLoadFailed] = useState(false);

  useEffect(() => {
    const element = mapElement.current;
    if (!element) return;

    if (!('IntersectionObserver' in window)) {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = mapElement.current;
    if (!isNearViewport || !element) return;

    let cancelled = false;
    let map: Leaflet.Map | null = null;

    const loadMap = async () => {
      try {
        const [leaflet] = await Promise.all([
          import('leaflet'),
          import('leaflet/dist/leaflet.css'),
        ]);
        if (cancelled) return;

        map = leaflet.map(element, {
          scrollWheelZoom: false,
          zoomControl: true,
        }).setView(HYDERABAD, 12);

        leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        leaflet.circleMarker(HYDERABAD, {
          radius: 8,
          color: '#ffffff',
          weight: 3,
          fillColor: '#2563eb',
          fillOpacity: 1,
        })
          .addTo(map)
          .bindPopup('HomeCareX · Hyderabad');
      } catch (error) {
        if (!cancelled) {
          console.error('Unable to load the Hyderabad map.', error);
          setMapLoadFailed(true);
        }
      }
    };

    void loadMap();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [isNearViewport]);

  return (
    <div
      role="region"
      aria-label="Interactive map centered on Hyderabad, Telangana"
      className="relative h-[280px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm sm:h-[350px] lg:h-[400px]"
    >
      <div ref={mapElement} className="h-full w-full" />
      {!isNearViewport && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
          Map loads as you scroll into view.
        </div>
      )}
      {mapLoadFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 px-5 text-center text-sm text-slate-600">
          Map is temporarily unavailable. Please contact our team for location details.
        </div>
      )}
    </div>
  );
};

export default MapEmbed;
