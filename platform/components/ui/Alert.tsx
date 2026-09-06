import type { HTMLAttributes } from 'react';
import { clsx } from '@/lib/clsx';

type Tone = 'info' | 'success' | 'warning' | 'danger';

const toneClasses: Record<Tone, string> = {
  info: 'bg-brand-tint border-link/25 text-link',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300',
  warning: 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300',
  danger: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300',
};

export function Alert({
  tone = 'info',
  title,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: Tone; title?: string }) {
  return (
    <div role="alert" className={clsx('rounded-xl border px-4 py-3 text-sm', toneClasses[tone], className)} {...props}>
      {title && <p className="mb-0.5 font-medium">{title}</p>}
      {children && <div className="text-current/90">{children}</div>}
    </div>
  );
}
