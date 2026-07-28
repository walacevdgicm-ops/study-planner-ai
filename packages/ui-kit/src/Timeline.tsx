import * as React from 'react';
import { cn } from './cn';

export interface TimelineItem {
  id: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  detail?: React.ReactNode;
  color?: string;
  done?: boolean;
}

export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn('relative space-y-4 pl-6', className)}>
      <span aria-hidden className="absolute top-1.5 bottom-1.5 left-[7px] w-px bg-hair" />
      {items.map((it) => (
        <li key={it.id} className="relative">
          <span
            aria-hidden
            className={cn(
              'absolute top-1 -left-6 size-3.5 rounded-full border-2 border-surface',
              it.done && 'opacity-40',
            )}
            style={{ background: it.color ?? 'var(--accent)' }}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <span className={cn('text-sm font-medium text-ink', it.done && 'text-ink-3 line-through')}>
              {it.title}
            </span>
            {it.meta && <span className="font-mono text-[12px] text-ink-3">{it.meta}</span>}
          </div>
          {it.detail && <div className="mt-0.5 text-[13px] text-ink-2">{it.detail}</div>}
        </li>
      ))}
    </ol>
  );
}
