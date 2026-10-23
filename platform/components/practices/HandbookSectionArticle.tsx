import Link from 'next/link';
import { localize, type HandbookParagraph, type StartHereSection } from '@/modules/kuko-way/types';
import { handbookSectionHref } from '@/modules/kuko-way/handbook';
import { getT } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/locale';

// One handbook chapter (verbatim, bilingual). Shared by Start Here and Learn
// — each page passes its own back link, eyebrow and prev/next neighbours, so
// a chapter is only ever reached through the page that owns it
// (modules/kuko-way/handbook.ts).
//
// Long-form reading layout: a ~65–80 character column (the page Container's
// max-w-3xl doesn't narrow it — Container always adds max-w-6xl), a serif
// title as on practice pages, and the source's numbered / bulleted lists
// restored from the paragraphs' `list` marks.
const BODY_TEXT = 'text-[16px] leading-[1.75] text-ink-700 sm:text-[17px]';

// Consecutive paragraphs that share a `list` kind form one list; anything
// else stays a plain paragraph. Order is never changed.
type Block = { kind: 'p'; item: HandbookParagraph } | { kind: 'ordered' | 'bullet'; items: HandbookParagraph[] };

function toBlocks(paragraphs: HandbookParagraph[]): Block[] {
  const blocks: Block[] = [];
  for (const p of paragraphs) {
    const last = blocks[blocks.length - 1];
    if (!p.list) blocks.push({ kind: 'p', item: p });
    else if (last && last.kind === p.list) last.items.push(p);
    else blocks.push({ kind: p.list, items: [p] });
  }
  return blocks;
}

function Paragraphs({ paragraphs, locale }: { paragraphs: HandbookParagraph[]; locale: Locale }) {
  return (
    <>
      {toBlocks(paragraphs).map((block, i) => {
        if (block.kind === 'p') {
          return (
            <p key={i} className={BODY_TEXT}>
              {localize(block.item, locale).value}
            </p>
          );
        }
        if (block.kind === 'ordered') {
          return (
            <ol key={i} className="flex flex-col gap-3">
              {block.items.map((item, j) => (
                <li key={j} className={`flex gap-3 ${BODY_TEXT}`}>
                  <span
                    aria-hidden
                    className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sand-100 text-xs font-semibold text-ink-500"
                  >
                    {j + 1}
                  </span>
                  <span>{localize(item, locale).value}</span>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <ul key={i} className="flex flex-col gap-2.5">
            {block.items.map((item, j) => (
              <li key={j} className={`flex gap-3 ${BODY_TEXT}`}>
                <span aria-hidden className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <span>{localize(item, locale).value}</span>
              </li>
            ))}
          </ul>
        );
      })}
    </>
  );
}

// Previous / next as plain editorial text links, like the Start Here index
// titles: a quiet direction label centred over an underlined serif title — no
// box, no arrows. With both, previous sits left and next right (stacked and
// centred on phones); a lone link (first or last chapter) is centred.
const NAV_LINK =
  'group flex flex-col items-center gap-1 self-center text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600 sm:self-start';
const NAV_LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500';
const NAV_TITLE =
  'text-balance font-serif text-lg leading-snug text-ink-900 underline decoration-sand-300 decoration-1 underline-offset-[0.25em] motion-safe:transition-colors group-hover:text-link group-hover:decoration-clay-fill';

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
  end?: { href: string; label: string };
}) {
  const t = getT(locale);
  const title = localize(section.title, locale);
  const forward = next ? { href: handbookSectionHref(next), label: localize(next.title, locale).value } : end;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 sm:gap-10">
      <div className="flex flex-col gap-6">
        <Link href={backHref} className="self-start text-sm font-medium text-link hover:underline">
          ← {backLabel}
        </Link>

        <header className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-link">{eyebrow}</p>
          <h1 className="text-balance font-serif text-3xl leading-tight text-ink-900 sm:text-4xl">{title.value}</h1>
          <span aria-hidden className="mt-1 h-0.5 w-10 rounded-full bg-clay-fill" />
        </header>
      </div>

      <article className="flex flex-col gap-8 sm:gap-10">
        {section.paragraphs && (
          <div className="flex flex-col gap-5">
            <Paragraphs paragraphs={section.paragraphs} locale={locale} />
          </div>
        )}

        {section.subsections?.map((sub, i) => (
          <section
            key={i}
            className={
              i === 0 && !section.paragraphs
                ? 'flex flex-col gap-4'
                : 'flex flex-col gap-4 border-t border-sand-200 pt-8 sm:pt-10'
            }
          >
            <h2 className="text-balance text-xl font-semibold leading-snug text-ink-900">
              {localize(sub.title, locale).value}
            </h2>
            <Paragraphs paragraphs={sub.paragraphs} locale={locale} />
          </section>
        ))}
      </article>

      {(prev || forward) && (
        <nav
          className={
            prev && forward
              ? 'flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-10'
              : 'flex justify-center'
          }
        >
          {prev && (
            <Link href={handbookSectionHref(prev)} className={NAV_LINK}>
              <span className={NAV_LABEL}>{t('practiceSession.previous')}</span>
              <span className={NAV_TITLE}>{localize(prev.title, locale).value}</span>
            </Link>
          )}
          {forward && (
            <Link href={forward.href} className={prev ? `${NAV_LINK} sm:ml-auto` : NAV_LINK}>
              <span className={NAV_LABEL}>{t('practiceSession.next')}</span>
              <span className={NAV_TITLE}>{forward.label}</span>
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
