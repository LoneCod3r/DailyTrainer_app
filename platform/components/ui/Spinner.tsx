import { clsx } from '@/lib/clsx';

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={clsx('inline-block h-5 w-5 animate-spin rounded-full border-2 border-sand-200 border-t-brand-600', className)}
    />
  );
}

export function PageLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-500">
      <Spinner className="h-8 w-8" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
