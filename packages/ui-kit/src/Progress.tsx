import * as React from 'react';
import { cn } from './cn';

export interface ProgressProps {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  label?: string;
  size?: 'sm' | 'md';
  /** Marca o alvo/limite esperado na barra (ex: ritmo ideal da meta). */
  marker?: number;
}

export function Progress({ value, max = 100, color, className, label, size = 'md', marker }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-surface-2',
        size === 'sm' ? 'h-1.5' : 'h-2.5',
        className,
      )}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${pct}%`, background: color ?? 'var(--accent)' }}
      />
      {marker !== undefined && (
        <span
          aria-hidden
          className="absolute top-0 h-full w-px bg-ink/35"
          style={{ left: `${Math.min(100, marker)}%` }}
        />
      )}
    </div>
  );
}

export interface RingProps {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
  label?: string;
}

export function Ring({ value, size = 92, stroke = 9, color, children, label }: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={label}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color ?? 'var(--accent)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
