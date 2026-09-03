'use client';

import { useEffect } from 'react';
import { Container } from '@/components/ui';
import { ErrorState } from '@/components/ui/ErrorState';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] items-center justify-center py-16">
      <ErrorState title="Unexpected error" description="Please try again." onRetry={reset} />
    </Container>
  );
}
