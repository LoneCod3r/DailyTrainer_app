import { forwardRef, type InputHTMLAttributes } from 'react';
import { clsx } from '@/lib/clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, hint, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={clsx(
          'w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500',
          error ? 'border-red-400 dark:border-red-500' : 'border-sand-200',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
