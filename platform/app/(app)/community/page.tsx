import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, Card, CardContent, Badge } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import type { DictKey } from '@/lib/i18n/dictionaries';

const AREAS: { href: string; titleKey: DictKey; descKey: DictKey }[] = [
  { href: '/community/discussions', titleKey: 'community.discussionsTitle', descKey: 'community.discussionsDesc' },
  { href: '/community/courses', titleKey: 'community.coursesTitle', descKey: 'community.coursesDesc' },
  { href: '/community/meetings', titleKey: 'community.meetingsTitle', descKey: 'community.meetingsDesc' },
];

export function generateMetadata(): Metadata {
  const t = getT(getLocale());
  return { title: t('community.title'), description: t('community.subtitle') };
}

// Community is the social/educational experience — deliberately separate
// from Practices (the personal experience). Nothing here is mixed into the
// Practices navigation.
export default function CommunityPage() {
  const locale = getLocale();
  const t = getT(locale);

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader title={t('community.title')} description={t('community.subtitle')} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {AREAS.map((area) => (
          <Link key={area.href} href={area.href}>
            <Card className="h-full transition-shadow hover:shadow-soft">
              <CardContent className="flex h-full flex-col gap-2">
                <Badge tone="neutral" className="w-fit">
                  {t('nav.community')}
                </Badge>
                <h2 className="text-base font-semibold text-ink-900">{t(area.titleKey)}</h2>
                <p className="text-sm text-ink-500">{t(area.descKey)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
