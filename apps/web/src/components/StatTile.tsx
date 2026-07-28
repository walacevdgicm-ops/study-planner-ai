import type { ReactNode } from 'react';
import { cn } from '@spa/ui-kit';

export interface StatTileProps {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: 'neutral' | 'danger' | 'success' | 'marker';
  className?: string;
}

const tones = {
  neutral: 'border-hair',
  danger: 'border-caneta/40',
  success: 'border-quadro/40',
  marker: 'border-marca',
} as const;

export function StatTile({ label, value, unit, hint, icon, tone = 'neutral', className }: StatTileProps) {
  return (
    <div className={cn('rounded-card border bg-surface p-4', tones[tone], className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10.5px] tracking-widest text-ink-3 uppercase">{label}</p>
        {icon}
      </div>
      <p className="mt-2 flex items-baseline gap-1 font-display text-[28px] leading-none font-extrabold text-ink">
        <span className="tabular-nums">{value}</span>
        {unit && <span className="font-mono text-[13px] font-medium text-ink-3">{unit}</span>}
      </p>
      {hint && <div className="mt-1.5 text-[12px] text-ink-2">{hint}</div>}
    </div>
  );
}
