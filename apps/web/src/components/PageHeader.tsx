import type { ReactNode } from 'react';
import { Highlight } from '@spa/ui-kit';

export interface PageHeaderProps {
  title: string;
  /** Trecho do título que recebe a passada de marca-texto. */
  highlight?: string;
  description?: string;
  actions?: ReactNode;
  color?: string;
}

export function PageHeader({ title, highlight, description, actions, color }: PageHeaderProps) {
  const [before, after] = highlight ? title.split(highlight) : [title, ''];

  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-[26px] leading-tight font-extrabold text-ink sm:text-[30px]">
          {before}
          {highlight && <Highlight color={color}>{highlight}</Highlight>}
          {after}
        </h1>
        {description && <p className="mt-1.5 max-w-2xl text-[13.5px] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
