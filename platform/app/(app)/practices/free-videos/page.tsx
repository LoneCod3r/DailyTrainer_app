import { Container } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { FreeVideoCard } from '@/components/practices/FreeVideoCard';
import { Disclaimer } from '@/components/practices/Disclaimer';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { getFreeVideos } from '@/modules/kuko-way/service';

export default function FreeVideosPage() {
  const locale = getLocale();
  const t = getT(locale);
  const videos = getFreeVideos();

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader eyebrow={t('nav.practices')} title={t('freeVideos.title')} description={t('freeVideos.subtitle')} />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <FreeVideoCard key={video.id} video={video} locale={locale} t={t} />
        ))}
      </div>

      <Disclaimer t={t} />
    </Container>
  );
}
