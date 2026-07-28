import * as React from 'react';
import { cn } from './cn';

const control =
  'w-full rounded-lg border border-hair bg-surface px-3 text-sm text-ink placeholder:text-ink-3 ' +
  'transition-colors focus:border-accent focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('mb-1.5 block text-[13px] font-medium text-ink-2', className)}
      {...props}
    />
  );
}

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, error, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? (
        <p className="mt-1.5 text-[12px] font-medium text-caneta">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(control, 'h-10', className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(control, 'min-h-24 py-2 leading-6', className)} {...props} />;
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(control, 'h-10 cursor-pointer pr-8', className)} {...props}>
      {children}
    </select>
  );
});

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export function Checkbox({ className, label, id, ...props }: CheckboxProps) {
  const auto = React.useId();
  const inputId = id ?? auto;
  return (
    <span className="inline-flex items-center gap-2">
      <input
        id={inputId}
        type="checkbox"
        className={cn(
          'size-4 shrink-0 cursor-pointer appearance-none rounded-[5px] border border-hair bg-surface',
          'checked:border-accent checked:bg-accent',
          "checked:after:block checked:after:h-full checked:after:w-full checked:after:content-['✓']",
          'checked:after:text-center checked:after:text-[11px] checked:after:leading-4 checked:after:text-white',
          className,
        )}
        {...props}
      />
      {label && (
        <label htmlFor={inputId} className="cursor-pointer text-sm text-ink select-none">
          {label}
        </label>
      )}
    </span>
  );
}

export interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  id?: string;
}

export function Switch({ checked, onChange, label, description, id }: SwitchProps) {
  const auto = React.useId();
  const switchId = id ?? auto;
  return (
    <div className="flex items-start justify-between gap-4">
      {label && (
        <span className="min-w-0">
          <label htmlFor={switchId} className="block cursor-pointer text-sm font-medium text-ink">
            {label}
          </label>
          {description && <span className="mt-0.5 block text-[12px] text-ink-3">{description}</span>}
        </span>
      )}
      <button
        id={switchId}
        role="switch"
        type="button"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-150',
          checked ? 'border-transparent bg-accent' : 'border-hair bg-surface-2',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-4.5 rounded-full bg-white shadow-sm transition-[left] duration-150',
            checked ? 'left-[calc(100%-1.25rem)]' : 'left-0.5',
          )}
        />
      </button>
    </div>
  );
}
