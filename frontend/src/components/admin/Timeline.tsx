import React from 'react';
import clsx from 'clsx';
import type { Tone } from "./StatusBadge";

export interface TimelineItem {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Already formatted, e.g. "12 Mar, 10:42". */
  time?: string;
  actor?: string;
  tone?: Tone;
  icon?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  emptyMessage?: string;
}

/** Vertical event list for booking status history, ticket activity and KYC steps. Newest first is up to the caller. */
export const Timeline: React.FC<TimelineProps> = ({ items, emptyMessage = 'No activity yet' }) => {
  if (items.length === 0) return <p className="hcx-timeline__empty">{emptyMessage}</p>;
  return (
    <ol className="hcx-timeline">
      {items.map((item) => (
        <li key={item.id} className="hcx-timeline__item">
          <span className={clsx('hcx-timeline__dot', `hcx-timeline__dot--${item.tone ?? 'neutral'}`)} aria-hidden>
            {item.icon}
          </span>
          <div className="hcx-timeline__content">
            <p className="hcx-timeline__title">{item.title}</p>
            {item.description && <p className="hcx-timeline__desc">{item.description}</p>}
            {(item.time || item.actor) && (
              <p className="hcx-timeline__meta">
                {item.actor}
                {item.actor && item.time ? ', ' : ''}
                {item.time}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
};

export default Timeline;
