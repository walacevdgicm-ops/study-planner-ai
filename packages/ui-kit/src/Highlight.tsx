import * as React from 'react';
import { cn } from './cn';

export interface HighlightProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Cor do marcador. Padrão: amarelo do sistema. */
  color?: string;
  size?: 'sm' | 'md';
}

/**
 * Assinatura visual do produto: a passada de marca-texto.
 * Traço irregular em `multiply` (claro) / `screen` (escuro) atrás do texto.
 */
export function Highlight({ color, size = 'md', className, style, children, ...props }: HighlightProps) {
  return (
    <span
      style={color ? ({ ...style, '--subject': color } as React.CSSProperties) : style}
      className={cn('hl', size === 'sm' && 'hl-sm', className)}
      {...props}
    >
      <span>{children}</span>
    </span>
  );
}

/** Marcador de disciplina compacto, para listas densas. */
export function SubjectDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-2.5 shrink-0 rounded-[3px]', className)}
      style={{ background: color }}
    />
  );
}
