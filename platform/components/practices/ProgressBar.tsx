import { clsx } from '@/lib/clsx';

// Progress UI foundation (Prompt2 Day 2, Step 16) — a plain value/max bar
// with no backend behind it yet. Any future real progress source can drop
// straight in since the contract is just numbers.
export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={clsx('h-1.5 w-full overflow-hidden rounded-full bg-sand-100', className)}
    >
      <div className="h-full rounded-full bg-brand-600 transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}
