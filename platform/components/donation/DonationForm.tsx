'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Alert, Input, CardContent } from '@/components/ui';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { clsx } from '@/lib/clsx';

// Cents — kept in lockstep with the server-side donationAmountSchema bounds
// (lib/validations/billing.ts): client-side checks are a UX convenience
// only, never the actual guard (the API route re-validates independently).
// The presets are plain choices, not tiers — equal weight, no labels.
const PRESET_AMOUNTS_CENTS = [500, 1000, 2500, 5000] as const; // €5 / €10 / €25 / €50
const MIN_CENTS = 100;
const MAX_CENTS = 100_000_00;

type Selection = number | 'custom' | null;
type AmountError = 'invalid' | 'min' | 'max';

// Whole-euro amounts render without ".00" ("€5", not "€5.00") — this is
// deliberately local to the donation UI; the shared formatCurrency keeps its
// always-two-decimals behaviour for invoices and receipts.
function formatAmount(cents: number, locale: string) {
  return new Intl.NumberFormat(locale === 'bg' ? 'bg-BG' : 'en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

// Accepts "15", "15.5", "15,50" — nothing else (no exponents, no third
// decimal), so what the user typed is exactly what gets charged.
function parseCustomCents(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

export function DonationForm({ disabled }: { disabled?: boolean }) {
  const { t, locale } = useLocale();
  const [selected, setSelected] = useState<Selection>(null);
  const [customValue, setCustomValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selected === 'custom') customInputRef.current?.focus();
  }, [selected]);

  let amountCents: number | null = null;
  let amountError: AmountError | null = null;
  if (typeof selected === 'number') {
    amountCents = selected;
  } else if (selected === 'custom' && customValue.trim()) {
    const cents = parseCustomCents(customValue);
    if (cents === null) amountError = 'invalid';
    else if (cents < MIN_CENTS) amountError = 'min';
    else if (cents > MAX_CENTS) amountError = 'max';
    else amountCents = cents;
  }

  const amountErrorMessage =
    amountError === 'invalid'
      ? t('account.donation.invalidAmount')
      : amountError === 'min'
        ? t('account.donation.minAmount')
        : amountError === 'max'
          ? t('account.donation.maxAmount')
          : undefined;

  function select(next: Exclude<Selection, null>) {
    setSelected(next);
    setError(null);
  }

  async function onSubmit() {
    if (amountCents === null) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/donations/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountCents, currency: 'eur' }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        setError(data?.error?.message ?? t('account.donation.checkoutError'));
        return;
      }
      window.location.href = data.url;
    } catch {
      setLoading(false);
      setError(t('account.donation.checkoutError'));
    }
  }

  return (
    // Same surface recipe as Card, but written out because the frame needs
    // different border/fill tokens (Card's own border-sand-200/bg-surface would
    // fight overrides). Light: warm off-white fill + sand-300 border + soft
    // shadow so it reads as a defined panel on the white page (the tiles stay
    // white on it). Dark: sand-50/sand-200 resolve to the same values as the
    // old surface/border, so the dark look is unchanged.
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-sand-300 bg-sand-50 shadow-soft dark:border-sand-200">
      {/* Nod to the Billing payment-method card: the same card-face green,
          run as a ribbon that brightens to the theme's link tone in the
          middle so it stays visible on both light and dark surfaces. */}
      <div aria-hidden="true" className="h-1.5 bg-gradient-to-r from-card-face-from via-link/70 to-card-face-from" />
      <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
        <p className="text-center text-sm text-ink-700">{t('account.donation.intro')}</p>

        {disabled ? (
          <Alert tone="warning">{t('account.donation.configUnavailable')}</Alert>
        ) : (
          <>
            <div role="radiogroup" aria-labelledby="donation-amount-label" className="flex flex-col gap-3">
              <p
                id="donation-amount-label"
                className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-link"
              >
                {t('account.donation.chooseAmount')}
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PRESET_AMOUNTS_CENTS.map((cents) => (
                  <AmountOption
                    key={cents}
                    checked={selected === cents}
                    onSelect={() => select(cents)}
                    label={formatAmount(cents, locale)}
                  />
                ))}
                <AmountOption
                  className="col-span-2 sm:col-span-4"
                  checked={selected === 'custom'}
                  onSelect={() => select('custom')}
                  label={t('account.donation.customTile')}
                  compact
                />
              </div>
            </div>

            {selected === 'custom' && (
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-0 z-10 flex h-10 items-center text-sm font-medium text-ink-500"
                >
                  €
                </span>
                <Input
                  ref={customInputRef}
                  name="donation-custom-amount"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  aria-label={t('account.donation.customAmountLabel')}
                  placeholder={t('account.donation.customAmountPlaceholder')}
                  value={customValue}
                  error={amountErrorMessage}
                  className={clsx('pl-8', !amountErrorMessage && '!border-ink-300/50 dark:!border-sand-200')}
                  onChange={(e) => {
                    setCustomValue(e.target.value);
                    setError(null);
                  }}
                />
              </div>
            )}

            {error && <Alert tone="danger">{error}</Alert>}

            <div className="flex flex-col items-center gap-3">
              <Button
                size="lg"
                onClick={onSubmit}
                loading={loading}
                disabled={amountCents === null}
                className={clsx(
                  'w-full',
                  // Default disabled is just 50% opacity, which washes the label out on
                  // light; give the "nothing chosen yet" state a readable neutral look.
                  amountCents === null &&
                    'disabled:!opacity-100 disabled:border disabled:border-sand-300 disabled:bg-sand-100 disabled:text-ink-700',
                )}
              >
                {loading
                  ? t('account.donation.redirecting')
                  : amountCents === null
                    ? t('account.donation.chooseAmount')
                    : t('account.donation.donateButton', { amount: formatAmount(amountCents, locale) })}
              </Button>
              <p className="flex items-center gap-1.5 text-xs text-ink-700">
                <LockGlyph />
                {t('account.donation.securePayment')}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </div>
  );
}

// Light theme: the shared sand-200 border is only ~1.4:1 on white and
// brand-tint ~1.1:1, so idle boundaries and the selected fill nearly vanish.
// These are scoped to the donation controls (no global token change) and use
// adaptive tokens with opacity; dark keeps its existing sand-200 border and
// brand-tint fill, which already separate against the darker page.
const CONTROL_BORDER = 'border-ink-300/50 dark:border-sand-200';

// A native radio (visually hidden, still focusable) drives the tile, so
// checked/focus state, arrow-key navigation and screen-reader semantics all
// come from the browser rather than hand-rolled ARIA. The selected state is
// carried by a thicker border (border + ring) plus a tint, never by colour alone. All
// colours are the theme's CSS-variable tokens so light/dark both work.
function AmountOption({
  checked,
  onSelect,
  label,
  className,
  compact,
}: {
  checked: boolean;
  onSelect: () => void;
  label: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <label className={clsx('relative block cursor-pointer', className)}>
      <input
        type="radio"
        name="donation-amount"
        checked={checked}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span
        className={clsx(
          'flex items-center justify-center rounded-2xl border bg-surface px-3 text-ink-900 transition-colors',
          CONTROL_BORDER,
          'peer-[&:not(:checked)]:hover:bg-sand-100 peer-checked:border-link peer-checked:bg-link/[0.14] peer-checked:ring-1 peer-checked:ring-link dark:peer-checked:bg-brand-tint',
          'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-link',
          compact ? 'py-3.5 text-sm font-medium' : 'py-5 text-2xl font-semibold tabular-nums',
        )}
        style={compact ? undefined : { fontFamily: 'var(--font-serif), Georgia, serif' }}
      >
        {label}
      </span>
    </label>
  );
}

function LockGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="3" y="7" width="10" height="7" rx="1.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
