import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { clsx } from '@/lib/clsx';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, error, id, ...props },
  ref,
) {
  const areaId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={areaId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={areaId}
        className={clsx(
          'w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500',
          error ? 'border-red-400' : 'border-sand-200',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
});
