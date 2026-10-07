import { Container } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { Disclaimer } from '@/components/practices/Disclaimer';
import { LibraryBrowser } from '@/components/practices/LibraryBrowser';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { getTopLevelPractices, getHandbookSections } from '@/modules/kuko-way/service';
import { getVisiblePrograms } from '@/modules/programs/service';

export default function LibraryPage({ searchParams }: { searchParams: { q?: string } }) {
  const locale = getLocale();
  const t = getT(locale);
  const initialQuery = searchParams.q ?? '';

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader eyebrow={t('nav.practices')} title={t('library.title')} description={t('library.subtitle')} />

      <LibraryBrowser
        key={initialQuery}
        practices={getTopLevelPractices()}
        startHereSections={getHandbookSections()}
        programs={getVisiblePrograms()}
        initialQuery={initialQuery}
      />

      <Disclaimer t={t} />
    </Container>
  );
}
