import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui';
import { localize, type StartHereSection } from '@/modules/kuko-way/types';
import { handbookSectionHref } from '@/modules/kuko-way/handbook';
import type { Locale } from '@/lib/i18n/locale';

// One handbook chapter (verbatim, bilingual). Shared by Start Here and Learn
// — each page passes its own back link, eyebrow and prev/next neighbours, so
// a chapter is only ever reached through the page that owns it
// (modules/kuko-way/handbook.ts).
export function HandbookSectionArticle({
  section,
  locale,
  backHref,
  backLabel,
  eyebrow,
  prev,
  next,
  end,
}: {
  section: StartHereSection;
  locale: Locale;
  backHref: string;
  backLabel: string;
  eyebrow: string;
  prev?: StartHereSection;
  next?: StartHereSection;
  // Shown in place of "next" on the last chapter.
  end?: ReactNode;
}) {
  const title = localize(section.title, locale);

  return (
    <>
      <Link href={backHref} className="text-sm font-medium text-link hover:underline">
        ← {backLabel}
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-link">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink-900">{title.value}</h1>
      </div>

      <article className="flex flex-col gap-4">
        {section.paragraphs?.map((p, i) => (
          <p key={i} className="text-[15px] leading-relaxed text-ink-700">
            {localize(p, locale).value}
          </p>
        ))}

        {section.subsections?.map((sub, i) => (
          <div key={i} className="flex flex-col gap-2 border-t border-sand-200 pt-4 first:border-t-0 first:pt-0">
            <h2 className="text-base font-semibold text-ink-900">{localize(sub.title, locale).value}</h2>
            {sub.paragraphs.map((p, j) => (
              <p key={j} className="text-[15px] leading-relaxed text-ink-700">
                {localize(p, locale).value}
              </p>
            ))}
          </div>
        ))}
      </article>

      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        {prev ? (
          <Link href={handbookSectionHref(prev)} className="text-sm text-ink-500 hover:text-ink-900">
            ← {localize(prev.title, locale).value}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={handbookSectionHref(next)} className="text-sm font-medium text-link hover:underline">
            {localize(next.title, locale).value} →
          </Link>
        ) : (
          end
        )}
      </Card>
    </>
  );
}
