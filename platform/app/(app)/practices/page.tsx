import Link from 'next/link';
import { Container, Card, CardContent, Badge } from '@/components/ui';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import type { DictKey } from '@/lib/i18n/dictionaries';

// Practices is the core personal experience: Practices → category →
// practice/program → practice session. This page is the "category" level —
// it deliberately does not attempt any recommendation logic yet.
export default function PracticesPage() {
  const locale = getLocale();
  const t = getT(locale);

  const categories: { href: string; titleKey: DictKey; descKey: DictKey }[] = [
    { href: '/practices/start-here', titleKey: 'practices.startHereTitle', descKey: 'practices.startHereDesc' },
    { href: '/practices/feel-better-now', titleKey: 'practices.feelBetterNowTitle', descKey: 'practices.feelBetterNowDesc' },
    { href: '/practices/programs/7-days', titleKey: 'nav.days7', descKey: 'programs.days7desc' },
    { href: '/practices/programs/14-days', titleKey: 'nav.days14', descKey: 'programs.days14desc' },
    { href: '/practices/programs/28-days', titleKey: 'nav.days28', descKey: 'programs.days28desc' },
    { href: '/practices/library', titleKey: 'practices.libraryTitle', descKey: 'practices.libraryDesc' },
  ];

  return (
    <Container className="flex flex-col gap-8 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">{t('practices.pageTitle')}</h1>
        <p className="mt-1 text-sm text-ink-500">{t('practices.pageSubtitle')}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Link key={cat.href} href={cat.href}>
            <Card className="h-full transition-shadow hover:shadow-soft">
              <CardContent className="flex h-full flex-col gap-2">
                <Badge tone="brand" className="w-fit">
                  {t('nav.practices')}
                </Badge>
                <h2 className="text-base font-semibold text-ink-900">{t(cat.titleKey)}</h2>
                <p className="text-sm text-ink-500">{t(cat.descKey)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
