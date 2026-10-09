import type { Excerpt, ExcerptPassage } from '@/modules/kuko-way/search';

// What a Library search result shows under its title (built by
// modules/kuko-way/search.ts): an optional heading line — the other
// language's title, or the handbook sub-section that matched — then a passage
// of the item's own content. Rendered as plain text nodes, never as HTML, with
// each match in a <mark> that is bold as well as tinted, so it doesn't rely on
// colour alone. `lang` is each passage's own language, which may differ from
// the site language.
function Passage({ passage, className }: { passage: ExcerptPassage; className: string }) {
  return (
    <span lang={passage.lang} className={className}>
      {passage.croppedStart && '…'}
      {passage.segments.map((segment, i) =>
        segment.match ? (
          // No horizontal padding: a match inside a word ("kidney" in "kidneys") must not split it visually.
          <mark key={i} className="rounded-sm bg-brand-tint font-semibold text-ink-900">
            {segment.text}
          </mark>
        ) : (
          segment.text
        ),
      )}
      {passage.croppedEnd && '…'}
    </span>
  );
}

export function SearchExcerpt({ excerpt }: { excerpt: Excerpt }) {
  return (
    <>
      {excerpt.heading && (
        <Passage passage={excerpt.heading} className="mt-0.5 block text-sm font-medium text-ink-700 [overflow-wrap:anywhere]" />
      )}
      <Passage passage={excerpt} className="mt-1 block text-sm leading-relaxed text-ink-500 [overflow-wrap:anywhere]" />
    </>
  );
}
