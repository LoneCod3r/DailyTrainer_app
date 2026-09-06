import { Card } from '@/components/ui';
import { localize, type FreeVideo } from '@/modules/kuko-way/types';
import type { Locale } from '@/lib/i18n/locale';
import type { DictKey } from '@/lib/i18n/dictionaries';

// Embeds the real YouTube player rather than linking out — the video is the
// content here, unlike PracticeCard which links to a detail page.
export function FreeVideoCard({
  video,
  locale,
  t,
}: {
  video: FreeVideo;
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
}) {
  const title = localize(video.title, locale);

  return (
    <Card className="flex flex-col gap-3 overflow-hidden p-3">
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-ink-900">
        <iframe
          src={`https://www.youtube.com/embed/${video.youtubeId}`}
          title={title.value}
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      <div className="flex flex-col gap-1 px-2 pb-2">
        <h3 className="text-sm font-semibold text-ink-900">{title.value}</h3>
        {title.isFallback && <p className="text-xs italic text-ink-300">{t('language.contentInBulgarian')}</p>}
        <a
          href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-link hover:underline"
        >
          {t('freeVideos.watchOnYoutube')} ↗
        </a>
      </div>
    </Card>
  );
}
