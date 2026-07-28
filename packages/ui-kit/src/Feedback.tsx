import * as React from 'react';
import { cn } from './cn';

/* ---------------- Skeleton ---------------- */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-md bg-surface-2', className)}
      style={{ animationDuration: '1.4s' }}
    />
  );
}

/** Esqueleto em forma de "linha pautada" — carregamento com a cara do produto. */
export function SkeletonLines({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2.5', className)} role="status" aria-label="Carregando">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i % 3 === 2 ? 'w-2/5' : i % 2 ? 'w-4/5' : 'w-full')} />
      ))}
    </div>
  );
}

/* ---------------- Empty state ---------------- */

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  /** Cor do marcador da ilustração. */
  color?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, color, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-hair px-6 py-12 text-center',
        className,
      )}
    >
      <div className="relative mb-4 grid size-14 place-items-center rounded-xl bg-surface-2 text-ink-2">
        <span
          aria-hidden
          className="absolute -top-1 left-1/2 h-2.5 w-10 -translate-x-1/2 -rotate-2 rounded-sm"
          style={{ background: color ?? 'var(--color-marca)' }}
        />
        {icon ?? <span className="font-display text-xl">∅</span>}
      </div>
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-[13px] leading-5 text-ink-2">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------------- Erro inline ---------------- */

export function ErrorState({
  title = 'Não consegui carregar isso',
  description,
  onRetry,
  className,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-2 rounded-card border border-caneta/35 bg-caneta/8 p-4',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="grid size-6 place-items-center rounded-md bg-caneta/15 text-caneta">
          !
        </span>
        <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
      </div>
      <p className="text-[13px] text-ink-2">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-[13px] font-semibold text-caneta underline underline-offset-2"
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}
