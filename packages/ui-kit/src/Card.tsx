import * as React from 'react';
import { cn } from './cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Cor da disciplina: liga a aba de fichário na borda esquerda. */
  tabColor?: string;
  tabFull?: boolean;
  interactive?: boolean;
  as?: 'div' | 'article' | 'li' | 'section';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, tabColor, tabFull, interactive, as = 'div', style, children, ...props },
  ref,
) {
  // Polimórfico: o mesmo card serve de <div>, <article>, <li> ou <section>.
  const Tag = as as React.ElementType;

  return (
    <Tag
      ref={ref}
      style={tabColor ? ({ ...style, '--subject': tabColor } as React.CSSProperties) : style}
      className={cn(
        'rounded-card border border-hair bg-surface',
        tabColor && 'tab-card',
        tabColor && tabFull && 'tab-full',
        interactive &&
          'cursor-pointer transition-shadow duration-150 hover:shadow-lifted focus-within:shadow-lifted',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
});

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-start justify-between gap-3 p-4 pb-2', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-display text-[15px] font-semibold text-ink', className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 pt-2', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center gap-2 border-t border-hair px-4 py-3', className)} {...props} />
  );
}
