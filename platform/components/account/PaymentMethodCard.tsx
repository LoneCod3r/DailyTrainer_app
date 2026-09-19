import { getT } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/locale';
import type { PaymentMethodSummary } from '@/modules/payments/billing.service';

// Purely presentational — brand/last4/expiry come straight from Stripe via
// PaymentMethodSummary (billing.service.ts); no business logic, no data
// fetching, nothing rendered here beyond what Stripe actually reports (no
// full PAN, no fabricated controls/limits/status).
export function PaymentMethodCard({ paymentMethod, locale }: { paymentMethod: PaymentMethodSummary; locale: Locale }) {
  const t = getT(locale);
  const brand = paymentMethod.brand.charAt(0).toUpperCase() + paymentMethod.brand.slice(1);
  const expiry = t('account.billing.expires', {
    month: String(paymentMethod.expMonth).padStart(2, '0'),
    year: paymentMethod.expYear,
  });

  return (
    <div
      className="relative aspect-[8/5] w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-card-face-from to-card-face-to p-4 text-white shadow-card sm:p-5"
      // The visible face is decorative/redundant with the text row below it
      // (sr-only) — screen readers get one clean sentence instead of parsing
      // the masked-digit glyphs and layout.
      aria-hidden="true"
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <ChipGlyph />
          <div className="flex items-center gap-1.5 text-white/85">
            <ContactlessGlyph />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] sm:text-sm">{brand}</span>
          </div>
        </div>

        <p className="font-mono text-base tabular-nums tracking-[0.12em] text-white/95 sm:text-xl sm:tracking-[0.16em]">
          •••• •••• •••• {paymentMethod.last4}
        </p>

        <div className="flex items-end justify-between gap-3 text-white/70">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] sm:text-xs">
            {t('account.billing.paymentMethod')}
          </span>
          <span className="text-[10px] font-medium sm:text-xs">{expiry}</span>
        </div>
      </div>
    </div>
  );
}

function ChipGlyph() {
  return (
    <svg width="30" height="22" viewBox="0 0 30 22" fill="none" aria-hidden="true" className="shrink-0 text-white/80">
      <rect x="0.75" y="0.75" width="28.5" height="20.5" rx="4" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1" />
      <path d="M10 0.75V21.25M20 0.75V21.25M0.75 7.5H29.25M0.75 14.5H29.25" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" />
    </svg>
  );
}

function ContactlessGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0 rotate-90">
      <path d="M6 6.5c2-2 6-2 8 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4 4c3.3-3.2 8.7-3.2 12 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
      <path d="M8 9c.9-.9 2.1-.9 3 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
