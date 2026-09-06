import Link from 'next/link';
import { Container, Button } from '@/components/ui';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';

export default function NotFound() {
  const locale = getLocale();
  const t = getT(locale);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-sm font-medium text-brand-700">404</p>
      <h1 className="text-2xl font-semibold text-ink-900">{t('common.notFoundTitle')}</h1>
      <p className="max-w-sm text-sm text-ink-500">{t('common.notFoundDesc')}</p>
      <Link href="/">
        <Button>{t('common.backToHome')}</Button>
      </Link>
    </Container>
  );
}
