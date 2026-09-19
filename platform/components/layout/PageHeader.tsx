import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  centered,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  centered?: boolean;
}) {
  return (
    <div
      className={
        centered
          ? 'flex flex-col items-center gap-3 text-center'
          : 'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'
      }
    >
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-wide text-link">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold text-ink-900">{title}</h1>
        {description && (
          <p className={centered ? 'mx-auto mt-1 max-w-2xl text-sm text-ink-500' : 'mt-1 max-w-2xl text-sm text-ink-500'}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
