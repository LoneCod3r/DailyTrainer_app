'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { DictKey } from '@/lib/i18n/dictionaries';
import {
  COOKIE_CATEGORIES,
  NO_OPTIONAL_CONSENT,
  type CookieCategory,
  type CookieChoices,
} from '@/modules/legal/cookie-consent';
import { getStorageInventory, type StorageItem } from '@/modules/legal/storage-inventory';
import { useLegal } from './LegalProvider';

function durationLabel(item: StorageItem, t: ReturnType<typeof useT>): string {
  switch (item.duration.type) {
    case 'session':
      return t('cookieConsent.durationSession');
    case 'days':
      return t('cookieConsent.durationDays', { days: item.duration.days });
    case 'persistent':
      return t('cookieConsent.durationPersistent');
    case 'provider':
      return t('cookieConsent.durationProvider');
  }
}

// Detailed per-category choices. A native <dialog> opened with showModal()
// gives a real focus trap, Escape-to-close and an inert background, which the
// generic components/ui/Modal does not. Optional categories are unchecked
// unless the visitor allowed them earlier: nothing is pre-checked on a first
// visit.
export function CookieSettingsDialog() {
  const t = useT();
  const { config, consent, settingsOpen, closeSettings, saveChoices, acceptAll, rejectOptional } = useLegal();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [draft, setDraft] = useState<CookieChoices>(NO_OPTIONAL_CONSENT);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (settingsOpen && !dialog.open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      setDraft(consent?.choices ?? NO_OPTIONAL_CONSENT);
      dialog.showModal();
    } else if (!settingsOpen && dialog.open) {
      dialog.close();
    }
  }, [settingsOpen, consent]);

  // Escape (or any other native close) must also update React state, and
  // focus goes back to whatever opened the dialog.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => {
      closeSettings();
      const target = returnFocusRef.current;
      if (target && document.contains(target)) target.focus();
    };
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }, [closeSettings]);

  const inventory = getStorageInventory({ recaptchaCategory: config.recaptchaCategory });

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cookie-settings-title"
      className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-surface p-0 text-ink-900 shadow-soft backdrop:bg-ink-900/40"
    >
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-sand-200 p-5">
          <div className="flex flex-col gap-1">
            <h2 id="cookie-settings-title" className="text-lg font-semibold">
              {t('cookieConsent.settingsTitle')}
            </h2>
            <p className="text-sm text-ink-500">
              {t('cookieConsent.settingsIntro')}{' '}
              <Link
                href={config.documents.cookies.path}
                onClick={closeSettings}
                className="font-medium text-link underline underline-offset-2"
              >
                {t('cookieConsent.policyLink')}
              </Link>
            </p>
          </div>
          <button
            type="button"
            onClick={closeSettings}
            aria-label={t('cookieConsent.close')}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-700 hover:bg-sand-100"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto p-5">
          {COOKIE_CATEGORIES.map((category) => (
            <CategoryRow
              key={category}
              category={category}
              items={inventory.filter((i) => i.category === category)}
              checked={category === 'necessary' ? true : draft[category]}
              onChange={(value) => category !== 'necessary' && setDraft((d) => ({ ...d, [category]: value }))}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-sand-200 p-5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => saveChoices(draft)}>
            {t('cookieConsent.save')}
          </Button>
          <Button onClick={rejectOptional}>{t('cookieConsent.rejectOptional')}</Button>
          <Button onClick={acceptAll}>{t('cookieConsent.acceptAll')}</Button>
        </div>
      </div>
    </dialog>
  );
}

function CategoryRow({
  category,
  items,
  checked,
  onChange,
}: {
  category: CookieCategory;
  items: StorageItem[];
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const t = useT();
  const id = `cookie-category-${category}`;
  const locked = category === 'necessary';

  return (
    <div className="rounded-xl border border-sand-200 p-4">
      <div className="flex items-start gap-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={locked}
          onChange={(e) => onChange(e.target.checked)}
          aria-describedby={`${id}-desc`}
          className="mt-1 h-4 w-4 shrink-0 accent-brand-600"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor={id} className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            {t(`cookieConsent.categories.${category}` as DictKey)}
            {locked && <span className="text-xs font-normal text-ink-500">({t('cookieConsent.alwaysOn')})</span>}
          </label>
          <p id={`${id}-desc`} className="text-sm text-ink-500">
            {t(`cookieConsent.categories.${category}Desc` as DictKey)}
          </p>
          {items.length === 0 ? (
            <p className="text-xs text-ink-500">{t('cookieConsent.nothingInUse')}</p>
          ) : (
            <details className="text-xs text-ink-700">
              <summary className="cursor-pointer font-medium text-link">
                {t('cookieConsent.inUse')} ({items.length})
              </summary>
              <ul className="mt-2 flex flex-col gap-2">
                {items.map((item) => (
                  <li key={item.id} className="rounded-lg bg-sand-50 p-2">
                    <p className="break-all font-mono">{item.names.join(', ')}</p>
                    <p>{t(item.purposeKey)}</p>
                    <p className="text-ink-500">
                      {item.kind === 'cookie' ? t('cookieConsent.kindCookie') : t('cookieConsent.kindLocalStorage')} ·{' '}
                      {item.provider === 'google'
                        ? t('cookieConsent.providerGoogle')
                        : t('cookieConsent.providerFirstParty')}{' '}
                      · {durationLabel(item, t)}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

