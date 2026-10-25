'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui';
import { BrandMark } from '@/components/layout/BrandMark';
import { useLegal } from '@/components/legal/LegalProvider';
import { clsx } from '@/lib/clsx';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import type { Locale } from '@/lib/i18n/locale';
import { matchFaq, type FaqEntry, type FaqLink } from '@/modules/support/faq';

const QUESTION_MAX = 300;

// A visitor's message keeps their own words and the language they wrote in,
// plus the entry it matched, so a language switch can re-display it without
// matching again (see userText). entry null: the question matched nothing.
type Message =
  | { role: 'user'; text: string; locale: Locale; entry: FaqEntry | null }
  | { role: 'bot'; entry: FaqEntry | null };

// Chat bubbles: bot on the left, visitor on the right, each with one
// squared corner on its own side.
const bubble = 'max-w-[85%] rounded-2xl px-3.5 py-2.5';
const botBubble = clsx(bubble, 'self-start rounded-bl-md bg-sand-100 text-ink-900');
const userBubble = clsx(bubble, 'self-end whitespace-pre-wrap rounded-br-md bg-brand-600 text-white');
const linkClass = 'text-link underline underline-offset-2';
// Mobile: about 12px above the bottom nav (65px tall), in easy thumb reach
// and clear of the screen edge. Desktop has no bottom nav. While the cookie
// banner is open, inline styles move both (see useCookieBannerSpace).
const dock = 'bottom-[4.25rem] right-4 lg:bottom-6';
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 18.5 4 20l1.2-3.6A7.5 7.5 0 1 1 7.5 18.5Z" />
    </svg>
  );
}

const GAP = 8;
// Space kept between the mobile launcher and the top of the page footer.
const FOOTER_GAP = 14;

type BannerSpace = {
  // Bottom offset that puts the chat just above the banner.
  lift: number;
  // Lowest bottom offset that still keeps the launcher below the top bar.
  launcherMax: number;
  // Whether a usable chat panel (20rem) fits between the top bar and banner.
  panelFits: boolean;
};

// Space around the first-visit cookie banner (components/legal/CookieBanner)
// while it is shown, so the chat can sit above it instead of under it. The
// banner keeps its own place and size; only the chat moves.
function useCookieBannerSpace(): BannerSpace | null {
  const { consent, settingsOpen } = useLegal();
  const visible = consent === null && !settingsOpen;
  const [space, setSpace] = useState<BannerSpace | null>(null);

  useEffect(() => {
    const banner = visible ? document.querySelector<HTMLElement>('[data-testid="cookie-banner"]') : null;
    if (!banner) {
      setSpace(null);
      return;
    }
    const measure = () => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      // The app shell's top bar (components/layout/Topbar) is its only header.
      const top = (document.querySelector('header')?.getBoundingClientRect().bottom ?? 0) + GAP;
      const lift = banner.offsetHeight + GAP;
      setSpace({
        lift,
        launcherMax: window.innerHeight - top - 3.5 * rem, // h-14
        panelFits: window.innerHeight - top - lift >= 20 * rem,
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(banner);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [visible]);

  return space;
}

// Floating help assistant: a small chat window that answers from the fixed
// FAQ in modules/support/faq.ts by keyword matching, entirely in the
// browser. Nothing is sent or stored.
export function SupportChat({ contactEmail }: { contactEmail: string }) {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  // Set when the visitor closes the chat themselves (× or Escape), so focus
  // goes back to the launcher; not when a link in an answer navigates away.
  const restoreFocus = useRef(false);
  const [panelMax, setPanelMax] = useState<number | null>(null);
  // While an on-screen keyboard covers the bottom of the screen: the panel's
  // bottom offset and height that keep it, and its input, above the keyboard.
  const [keyboardBottom, setKeyboardBottom] = useState<number | null>(null);
  const [keyboardMax, setKeyboardMax] = useState<number | null>(null);
  const space = useCookieBannerSpace();
  // While the banner is up these override the default dock. On a screen too
  // short to fit them between the top bar and the banner, the launcher stops
  // below the top bar (over the banner's top corner, never its buttons) and
  // the open panel covers the banner until it is closed.
  const launcherStyle =
    space &&
    (space.lift <= space.launcherMax ? { bottom: space.lift } : { bottom: space.launcherMax, zIndex: 50 });
  const panelStyle =
    keyboardBottom !== null
      ? { bottom: keyboardBottom, maxHeight: keyboardMax ?? undefined, zIndex: 50 }
      : {
          ...(space &&
            (space.panelFits
              ? { bottom: space.lift, maxHeight: `calc(100vh - ${space.lift + 2 * GAP}px)` }
              : { zIndex: 50 })),
          ...(panelMax !== null && { maxHeight: panelMax }),
        };

  // Mobile: keep the open panel below the top bar. Its bottom edge comes from
  // the dock (above the bottom nav) or the banner lift; its height is capped
  // to what is left above that, and the conversation scrolls inside. When an
  // on-screen keyboard shrinks the visible area (visualViewport), the panel
  // sits just above the keyboard instead and fits what is still visible.
  // Measured before paint, and again on resize or when the banner or
  // keyboard comes and goes. Desktop keeps its CSS height.
  const keyboardOpen = keyboardBottom !== null;
  useLayoutEffect(() => {
    if (!open) return;
    const vv = window.visualViewport;
    const fit = () => {
      const panel = panelRef.current;
      if (!panel || window.matchMedia('(min-width: 1024px)').matches) {
        setPanelMax(null);
        setKeyboardBottom(null);
        return;
      }
      const topbar = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
      const covered = vv ? Math.round(window.innerHeight - vv.height - vv.offsetTop) : 0;
      if (vv && covered > 0) {
        const top = Math.max(topbar, vv.offsetTop) + GAP;
        setKeyboardBottom(covered + GAP);
        setKeyboardMax(Math.max(0, Math.floor(vv.offsetTop + vv.height - GAP - top)));
        return;
      }
      setKeyboardBottom(null);
      setPanelMax(Math.max(0, Math.floor(panel.getBoundingClientRect().bottom - topbar - GAP)));
    };
    fit();
    window.addEventListener('resize', fit);
    vv?.addEventListener('resize', fit);
    vv?.addEventListener('scroll', fit);
    return () => {
      window.removeEventListener('resize', fit);
      vv?.removeEventListener('resize', fit);
      vv?.removeEventListener('scroll', fit);
    };
  }, [open, space, keyboardOpen]);

  // Mobile: the launcher keeps its spot above the bottom nav while the page
  // scrolls, until the footer (components/legal/SiteFooter) comes up under
  // it. From there it rides FOOTER_GAP above the footer's top edge, moving
  // with it frame by frame, so it never sits on footer text or links. If
  // that would bring it up against the top bar it is hidden instead, and
  // comes back as the footer scrolls away. Applied as a transform on top of
  // whatever bottom offset is in effect (dock or cookie-banner lift), so it
  // only ever moves the launcher up. Desktop is unchanged.
  useEffect(() => {
    if (open) return;
    const launcher = launcherRef.current;
    const footer = document.querySelector('footer');
    if (!launcher || !footer) return;
    const desktop = window.matchMedia('(min-width: 1024px)');
    let shift = 0;
    let frame = 0;

    const place = () => {
      frame = 0;
      // Where the launcher sits without the current shift.
      const rect = launcher.getBoundingClientRect();
      const restingTop = rect.top + shift;
      const restingBottom = rect.bottom + shift;
      shift = desktop.matches ? 0 : Math.max(0, restingBottom - (footer.getBoundingClientRect().top - FOOTER_GAP));
      const topbar = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
      const hidden = shift > 0 && restingTop - shift < topbar + GAP;
      launcher.style.transform = shift ? `translateY(${-shift}px)` : '';
      launcher.style.visibility = hidden ? 'hidden' : '';
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };

    place();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // The footer moves without scrolling too, e.g. when page content loads.
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
      launcher.style.transform = launcher.style.visibility = '';
    };
  }, [open, space]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else if (restoreFocus.current) {
      restoreFocus.current = false;
      launcherRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  function close() {
    restoreFocus.current = true;
    setOpen(false);
  }

  function send(e: FormEvent) {
    e.preventDefault();
    const question = draft.trim();
    if (!question) return;
    setDraft('');
    const entry = matchFaq(question);
    setMessages((m) => [...m, { role: 'user', text: question, locale, entry }, { role: 'bot', entry }]);
  }

  // In the language it was written in, a message shows the visitor's own
  // words. After a language switch, a recognised message shows its entry's
  // question in the new language, so the whole conversation reads in one
  // language; switching back restores the original words. Text the FAQ
  // didn't recognise can't be translated without a translation engine, so it
  // stays as written, marked with its own language for screen readers.
  function userText(m: Extract<Message, { role: 'user' }>): { text: string; lang: Locale } {
    if (m.locale === locale || m.entry === null) return { text: m.text, lang: m.locale };
    return { text: m.entry.question[locale], lang: locale };
  }

  const contactLink = contactEmail && (
    <>
      {t('supportChat.contactEmail')}{' '}
      <a href={`mailto:${contactEmail}`} className={linkClass}>
        {contactEmail}
      </a>
    </>
  );

  function links(items: FaqLink[]) {
    if (items.length === 0) return null;
    return (
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {items.map((link) => (
          <li key={link.href}>
            <Link href={link.href} onClick={() => setOpen(false)} className={linkClass}>
              {link.label[locale]}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  // The answer text, with the entry's inline link text (if any) rendered as
  // an external link in place; the rest stays plain text.
  function answerText(entry: FaqEntry, text: string) {
    const inline = entry.inline;
    const at = inline ? text.indexOf(inline.text) : -1;
    if (!inline || at < 0) return text;
    return (
      <>
        {text.slice(0, at)}
        <a href={inline.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {inline.text}
        </a>
        {text.slice(at + inline.text.length)}
      </>
    );
  }

  // Unmatched: say so, and the contact address only when one is set. Asked
  // for contact: say so honestly if there is none.
  function answerBody(entry: FaqEntry | null) {
    return (
      <>
        {entry === null ? (
          <p>
            {t('supportChat.noMatch')} {contactLink}
          </p>
        ) : entry.answer === null ? (
          <p>{contactLink || t('supportChat.noContact')}</p>
        ) : (
          <p>
            {answerText(entry, entry.answer[locale])}
            {entry.offerContact && contactLink && <> {contactLink}</>}
          </p>
        )}
        {links(entry?.links ?? [])}
      </>
    );
  }

  return (
    <>
      {!open && (
        <button
          ref={launcherRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('supportChat.openLabel')}
          style={launcherStyle ?? undefined}
          className={clsx(
            'fixed z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg hover:bg-brand-700',
            dock,
            focusRing,
          )}
        >
          <ChatIcon className="h-6 w-6" />
        </button>
      )}

      {open && (
        <section
          ref={panelRef}
          role="dialog"
          aria-labelledby="support-chat-title"
          onKeyDown={(e) => e.key === 'Escape' && close()}
          style={panelStyle}
          className={clsx(
            'fixed z-40 flex h-[min(32rem,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-sand-200 bg-surface shadow-lg',
            dock,
          )}
        >
          <div className="flex items-center gap-2.5 border-b border-sand-200 px-4 py-2.5">
            <BrandMark size={36} className="h-8 w-8 rounded-full" />
            <h2 id="support-chat-title" className="flex-1 text-sm font-semibold text-ink-900">
              {t('supportChat.title')}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label={t('supportChat.close')}
              className={clsx('rounded-full p-1.5 text-ink-500 hover:bg-sand-100 hover:text-ink-900', focusRing)}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div
            role="log"
            aria-label={t('supportChat.conversationLabel')}
            className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4 text-sm"
          >
            <p className={botBubble}>{t('supportChat.welcome')}</p>
            {messages.map((m, i) => {
              if (m.role === 'user') {
                const { text, lang } = userText(m);
                return (
                  <p key={i} lang={lang} className={userBubble}>
                    {text}
                  </p>
                );
              }
              return (
                <div key={i} className={botBubble}>
                  {answerBody(m.entry)}
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-sand-200 p-3">
            <label htmlFor="support-chat-input" className="sr-only">
              {t('supportChat.inputLabel')}
            </label>
            <input
              id="support-chat-input"
              ref={inputRef}
              type="text"
              autoComplete="off"
              enterKeyHint="send"
              value={draft}
              maxLength={QUESTION_MAX}
              placeholder={t('supportChat.placeholder')}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-[2.75rem] min-w-0 flex-1 rounded-xl border border-sand-200 bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-600 focus:outline-none"
            />
            <Button type="submit" size="sm" disabled={!draft.trim()}>
              {t('supportChat.send')}
            </Button>
          </form>
        </section>
      )}
    </>
  );
}
