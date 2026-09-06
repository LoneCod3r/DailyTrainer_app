import { ProgressBar } from '@/components/practices/ProgressBar';

// Reuses the same ProgressBar primitive as Practices/Programs (Day 2) so
// course progress reads as the same visual language, not a separate system.
export function CourseProgress({ completed, total, className }: { completed: number; total: number; className?: string }) {
  return (
    <div className={className}>
      <ProgressBar value={completed} max={total} />
    </div>
  );
}
