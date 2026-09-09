'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { clsx } from '@/lib/clsx';
import { useT } from '@/lib/i18n/LocaleProvider';
import { EyeIcon, EyeOffIcon } from '@/components/layout/icons';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, hint, id, type, ...props },
  ref,
) {
  const t = useT();
  const inputId = id ?? props.name;
  const isPassword = type === 'password';
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPassword ? (visible ? 'text' : 'password') : type}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={clsx(
            'w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500',
            error ? 'border-red-400 dark:border-red-500' : 'border-sand-200',
            isPassword && 'pr-10',
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
            aria-pressed={visible}
            tabIndex={0}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-500 hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 rounded-r-xl"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
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
