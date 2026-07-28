import * as React from 'react';
import { cn } from './cn';

type Tone = 'neutral' | 'accent' | 'success' | 'danger' | 'warning' | 'subject';

const tones: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-2 border-hair',
  accent: 'bg-accent-soft text-accent border-transparent',
  success: 'bg-quadro/12 text-quadro border-transparent',
  danger: 'bg-caneta/12 text-caneta border-transparent',
  warning: 'bg-marca/25 text-ink border-transparent',
  subject: 'border-transparent text-ink',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  color?: string;
  mono?: boolean;
}

export function Badge({ className, tone = 'neutral', color, mono, style, ...props }: BadgeProps) {
  return (
    <span
      style={
        tone === 'subject' && color
          ? { ...style, background: `color-mix(in srgb, ${color} 30%, transparent)` }
          : style
      }
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] leading-5 font-medium whitespace-nowrap',
        mono && 'font-mono tabular-nums',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
