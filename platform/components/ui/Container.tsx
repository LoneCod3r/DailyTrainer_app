import type { HTMLAttributes } from 'react';
import { clsx } from '@/lib/clsx';

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)} {...props} />;
}
