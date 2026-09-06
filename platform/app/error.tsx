'use client';

import { useEffect } from 'react';
import { Container } from '@/components/ui';
import { ErrorState } from '@/components/ui/ErrorState';
import { useT } from '@/lib/i18n/LocaleProvider';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] items-center justify-center py-16">
      <ErrorState title={t('common.unexpectedErrorTitle')} description={t('common.unexpectedErrorDesc')} onRetry={reset} />
    </Container>
  );
}
