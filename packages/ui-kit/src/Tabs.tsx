import * as React from 'react';
import { cn } from './cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  /** 'tab' = abas de fichário (assinatura) | 'pill' = segmentado compacto */
  look?: 'tab' | 'pill';
}

export function Tabs({ items, value, onChange, className, look = 'tab' }: TabsProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = items.findIndex((t) => t.id === value);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = e.key === 'ArrowRight' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
      onChange(items[next].id);
      ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
    }
  };

  if (look === 'pill') {
    return (
      <div
        ref={ref}
        role="tablist"
        onKeyDown={onKeyDown}
        className={cn('inline-flex gap-0.5 rounded-lg border border-hair bg-surface-2 p-0.5', className)}
      >
        {items.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={value === t.id}
            tabIndex={value === t.id ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
              value === t.id ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink',
            )}
          >
            {t.label}
            {t.count !== undefined && <span className="ml-1.5 font-mono text-[11px] text-ink-3">{t.count}</span>}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn('-mb-px flex items-end gap-1 overflow-x-auto no-scrollbar', className)}
    >
      {items.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={cn(
              'relative shrink-0 rounded-t-lg border border-b-0 px-3.5 py-2 text-[13px] font-medium transition-colors',
              active
                ? 'border-hair bg-surface text-ink'
                : 'border-transparent bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink',
            )}
          >
            {active && (
              <span aria-hidden className="absolute inset-x-3 top-0 h-[3px] rounded-b-sm bg-accent" />
            )}
            {t.label}
            {t.count !== undefined && <span className="ml-1.5 font-mono text-[11px] text-ink-3">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
