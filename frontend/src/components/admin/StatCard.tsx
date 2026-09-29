import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import type { Tone } from './StatusBadge';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  /** Percent change vs previous period. Positive = up. */
  delta?: number;
  /** Text after the delta, e.g. "vs last month". */
  deltaLabel?: string;
  /** Set when a decrease is good news (e.g. refund rate). */
  invertDelta?: boolean;
  hint?: string;
  tone?: Tone;
  loading?: boolean;
  /** Makes the whole card a link. */
  to?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label, value, icon: Icon, delta, deltaLabel = 'vs last period', invertDelta, hint, tone = 'brand', loading, to,
}) => {
  const isUp = (delta ?? 0) >= 0;
  const isGood = invertDelta ? !isUp : isUp;

  const body = (
    <>
      {Icon && (
        <span className={clsx('hcx-stat__icon', `hcx-stat__icon--${tone}`)}>
          <Icon size={20} />
        </span>
      )}
      <div className="hcx-stat__body">
        <p className="hcx-stat__label">{label}</p>
        {loading ? (
          <span className="hcx-skeleton hcx-skeleton--stat" aria-label="Loading" />
        ) : (
          <p className="hcx-stat__value">{value}</p>
        )}
        {!loading && delta !== undefined && (
          <p className={clsx('hcx-stat__delta', isGood ? 'is-good' : 'is-bad')}>
            {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(delta).toFixed(1)}%<span> {deltaLabel}</span>
          </p>
        )}
        {!loading && hint && <p className="hcx-stat__hint">{hint}</p>}
      </div>
    </>
  );

  return to ? (
    <Link to={to} className="hcx-stat hcx-stat--link">
      {body}
    </Link>
  ) : (
    <div className="hcx-stat">{body}</div>
  );
};

export default StatCard;
