import { Button } from './Button';

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again. If the problem continues, contact support.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50/50 px-6 py-16 text-center">
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="max-w-sm text-sm text-ink-500">{description}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
