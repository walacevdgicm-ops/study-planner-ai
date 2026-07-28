import * as React from 'react';
import { cn } from './cn';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone?: 'neutral' | 'success' | 'danger' | 'xp';
}

interface ToastContextValue {
  push: (t: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>');
  return ctx;
}

const tones = {
  neutral: 'border-hair bg-surface',
  success: 'border-quadro/40 bg-quadro/10',
  danger: 'border-caneta/40 bg-caneta/10',
  xp: 'border-marca bg-marca/25',
} as const;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastMessage[]>([]);

  const push = React.useCallback((t: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setItems((s) => [...s, { ...t, id }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:items-end"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto w-full max-w-sm rounded-card border px-4 py-3 shadow-lifted',
              tones[t.tone ?? 'neutral'],
            )}
          >
            <p className="font-display text-sm font-semibold text-ink">{t.title}</p>
            {t.description && <p className="mt-0.5 text-[13px] text-ink-2">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
