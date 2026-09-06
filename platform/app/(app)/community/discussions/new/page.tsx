import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Container, Button, Alert } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { DiscussionComposer } from '@/components/community/DiscussionComposer';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';

export default async function NewDiscussionPage() {
  const locale = getLocale();
  const t = getT(locale);
  const session = await getServerSession(authOptions);

  return (
    <Container className="flex flex-col gap-6 py-8">
      <PageHeader eyebrow={t('nav.community')} title={t('discussions.createTitle')} description={t('discussions.createSubtitle')} />

      {session?.user ? (
        <DiscussionComposer />
      ) : (
        <Alert
          tone="info"
          title={t('discussions.loginPromptTitle')}
          className="flex max-w-xl flex-col items-start gap-3"
        >
          <p>{t('discussions.loginPromptDesc')}</p>
          <Link href="/login?callbackUrl=/community/discussions/new">
            <Button size="sm">{t('discussions.loginCta')}</Button>
          </Link>
        </Alert>
      )}

      <Link href="/community/discussions" className="text-sm font-medium text-link hover:underline">
        {t('discussions.backToDiscussions')}
      </Link>
    </Container>
  );
}
