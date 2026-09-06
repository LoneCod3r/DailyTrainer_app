'use client';

import { useState } from 'react';
import { Button, Alert, Input, Card, CardContent } from '@/components/ui';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { formatCurrency } from '@/lib/format-currency';
import { clsx } from '@/lib/clsx';

// Cents — kept in lockstep with the server-side donationAmountSchema bounds
// (lib/validations/billing.ts): client-side checks are a UX convenience
// only, never the actual guard (the API route re-validates independently).
const PRESET_AMOUNTS_CENTS = [500, 1000, 2500, 5000] as const; // €5 / €10 / €25 / €50
const MIN_CENTS = 100;
const MAX_CENTS = 100_000_00;

export function DonationForm({ disabled }: { disabled?: boolean }) {
  const { t, locale } = useLocale();
  const [selected, setSelected] = useState<number | 'custom'>(PRESET_AMOUNTS_CENTS[1]);
  const [customValue, setCustomValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function resolveAmountCents(): number | null {
    if (selected !== 'custom') return selected;
    const normalized = customValue.replace(',', '.').trim();
    if (!normalized) return null;
    const value = Number(normalized);
    if (!Number.isFinite(value)) return null;
    return Math.round(value * 100);
  }

  function validateAmount(amountCents: number | null): string | null {
    if (amountCents === null || Number.isNaN(amountCents)) return t('account.donation.invalidAmount');
    if (amountCents < MIN_CENTS) return t('account.donation.minAmount');
    if (amountCents > MAX_CENTS) return t('account.donation.maxAmount');
    return null;
  }

  const amountCents = resolveAmountCents();

  function selectPreset(cents: number) {
    setSelected(cents);
    setError(null);
  }

  async function onSubmit() {
    const validationError = validateAmount(amountCents);
    if (validationError) {
      setError(validationError);
      return;
    }
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

  const amountLabel = amountCents ? formatCurrency(amountCents, 'eur', locale) : '';

  return (
    <Card className="max-w-xl border-sand-300 bg-sand-50">
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-ink-700">{t('account.donation.intro')}</p>

        {disabled ? (
          <Alert tone="warning">{t('account.donation.configUnavailable')}</Alert>
        ) : (
          <>
            <div>
              <p className="mb-2 text-sm font-medium text-ink-700">{t('account.donation.chooseAmount')}</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS_CENTS.map((cents) => (
                  <button
                    key={cents}
                    type="button"
                    onClick={() => selectPreset(cents)}
                    aria-pressed={selected === cents}
                    className={clsx(
                      'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                      selected === cents
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-sand-200 bg-surface text-ink-900 hover:bg-sand-100',
                    )}
                  >
                    {formatCurrency(cents, 'eur', locale)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSelected('custom');
                    setError(null);
                  }}
                  aria-pressed={selected === 'custom'}
                  className={clsx(
                    'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                    selected === 'custom'
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-sand-200 bg-surface text-ink-900 hover:bg-sand-100',
                  )}
                >
                  {t('account.donation.customAmountLabel')}
                </button>
              </div>
            </div>

            {selected === 'custom' && (
              <Input
                type="number"
                min={1}
                max={100000}
                step="0.01"
                inputMode="decimal"
                label={t('account.donation.customAmountLabel')}
                placeholder={t('account.donation.customAmountPlaceholder')}
                value={customValue}
                onChange={(e) => {
                  setCustomValue(e.target.value);
                  setError(null);
                }}
              />
            )}

            {error && <Alert tone="danger">{error}</Alert>}

            <div>
              <Button onClick={onSubmit} loading={loading} className="w-full justify-center sm:w-auto">
                {loading ? t('account.donation.redirecting') : t('account.donation.donateButton', { amount: amountLabel })}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
