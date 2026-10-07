import Link from 'next/link';
import { localize } from '@/modules/kuko-way/types';
import { getPracticeBySlug } from '@/modules/kuko-way/service';
import type { ProgramItem } from '@/modules/programs/types';
import type { Locale } from '@/lib/i18n/locale';
import type { DictKey } from '@/lib/i18n/dictionaries';
import { ItemDoneButton } from './ItemDoneButton';

// One part of a program day. Rendered only after the page has checked
// access server-side. VIDEO/AUDIO show a neutral media area: no media
// provider is chosen yet, and paid media will only ever be resolved through
// a server-side, access-checked playback endpoint — never a URL in content.
export function ProgramItemView({
  programSlug,
  item,
  done,
  locale,
  t,
}: {
  programSlug: string;
  item: ProgramItem;
  done: boolean;
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
}) {
  const kindLabel = t(`resetPrograms.kinds.${item.kind}` as DictKey);
  const title = item.title ? localize(item.title, locale) : undefined;
  const practice = item.practiceSlug ? getPracticeBySlug(item.practiceSlug) : undefined;

  return (
    <article
      className="flex flex-col gap-4 rounded-2xl border border-sand-200 bg-surface p-5"
      data-testid="program-item"
      data-content-required={item.contentRequired ? 'true' : undefined}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold uppercase tracking-wide text-clay">{kindLabel}</span>
        {item.slot && <span className="text-ink-500">{t(`resetPrograms.slots.${item.slot}` as DictKey)}</span>}
        {item.durationSec ? (
          <span className="text-ink-500">{t('journey.minutesShort', { count: Math.round(item.durationSec / 60) })}</span>
        ) : null}
      </div>
      <h3 className="text-xl font-semibold text-ink-900">{title?.value ?? kindLabel}</h3>
      {title?.isFallback && <p className="-mt-3 text-xs italic text-ink-300">{t('language.contentInBulgarian')}</p>}

      {(item.kind === 'VIDEO' || item.kind === 'AUDIO') && (
        <div
          className={
            item.kind === 'VIDEO'
              ? 'flex aspect-video w-full items-center justify-center rounded-xl bg-night px-4 text-center text-sm text-[#d9c7a7]'
              : 'flex h-20 w-full items-center justify-center rounded-xl bg-night px-4 text-center text-sm text-[#d9c7a7]'
          }
        >
          {item.contentRequired ? t('resetPrograms.contentRequired') : t('resetPrograms.mediaPending')}
        </div>
      )}

      {item.kind === 'TEXT' &&
        (item.body && item.body.length > 0 ? (
          <div className="flex flex-col gap-3">
            {item.body.map((p, i) => (
              <p key={i} className="leading-relaxed text-ink-700">
                {localize(p, locale).value}
              </p>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-sand-300 p-4 text-sm text-ink-500">{t('resetPrograms.contentRequired')}</p>
        ))}

      {item.kind === 'PRACTICE' &&
        (practice ? (
          <Link href={`/practices/${practice.slug}`} className="w-fit font-medium text-link hover:underline">
            {t('resetPrograms.openPractice')}: {localize(practice.title, locale).value} →
          </Link>
        ) : (
          <p className="rounded-xl border border-dashed border-sand-300 p-4 text-sm text-ink-500">{t('resetPrograms.contentRequired')}</p>
        ))}

      <ItemDoneButton programSlug={programSlug} itemId={item.id} done={done} />
    </article>
  );
}
