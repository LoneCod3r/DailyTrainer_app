import { forwardRef, type SelectHTMLAttributes } from 'react';
import { clsx } from '@/lib/clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, error, id, children, ...props },
  ref,
) {
  const selectId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={clsx(
          'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink-900',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500',
          error ? 'border-red-400' : 'border-sand-200',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});
