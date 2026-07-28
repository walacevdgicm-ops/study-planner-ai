import * as React from 'react';
import { cn } from './cn';

export interface Column<T> {
  key: string;
  header: string;
  /** Alinhamento numérico usa fonte mono tabular. */
  numeric?: boolean;
  width?: string;
  render: (row: T) => React.ReactNode;
}

export interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  caption?: string;
  className?: string;
  empty?: React.ReactNode;
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  caption,
  className,
  empty,
}: TableProps<T>) {
  if (!rows.length && empty) return <>{empty}</>;

  return (
    <div className={cn('w-full overflow-x-auto rounded-card border border-hair bg-surface', className)}>
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-hair bg-surface-2/60">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                style={{ width: c.width }}
                className={cn(
                  'px-4 py-2.5 text-[12px] font-semibold tracking-wide text-ink-2 uppercase',
                  c.numeric && 'text-right',
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter') onRowClick(row);
                    }
                  : undefined
              }
              className={cn(
                'border-b border-hair last:border-0',
                onRowClick && 'cursor-pointer hover:bg-surface-2/70',
              )}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn('px-4 py-2.5 align-middle text-ink', c.numeric && 'text-right font-mono tabular-nums')}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
