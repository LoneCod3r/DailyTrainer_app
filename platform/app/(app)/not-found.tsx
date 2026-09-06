import Link from 'next/link';
import { Container, Button } from '@/components/ui';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';

// Next.js only returns a real HTTP 404 for a `notFound()` call when a
// `not-found.tsx` exists at (or below) the segment that threw it — without
// one here, every notFound() inside app/(app)/** (missing practice, blog
// article, discussion, course, meeting, ...) bubbles all the way to the
// root not-found.tsx and gets served with a 200 status instead of 404. This
// also means visitors now keep the app shell (nav, theme, locale switcher)
// instead of landing on the bare root fallback.
export default function AppNotFound() {
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
