import { Container } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { Disclaimer } from '@/components/practices/Disclaimer';
import { LibraryBrowser } from '@/components/practices/LibraryBrowser';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { getTopLevelPractices, getStartHereSections, getPrograms } from '@/modules/kuko-way/service';

export default function LibraryPage() {
  const locale = getLocale();
  const t = getT(locale);

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader eyebrow={t('nav.practices')} title={t('library.title')} description={t('library.subtitle')} />

      <LibraryBrowser practices={getTopLevelPractices()} startHereSections={getStartHereSections()} programs={getPrograms()} />

      <Disclaimer t={t} />
    </Container>
  );
}
