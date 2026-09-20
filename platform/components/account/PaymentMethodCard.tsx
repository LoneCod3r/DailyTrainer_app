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
      <CardArtwork />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex justify-end text-white/85">
          <ContactlessGlyph />
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          <ChipGlyph />
          <p className="font-mono text-base tabular-nums tracking-[0.12em] text-white/95 sm:text-xl sm:tracking-[0.16em]">
            <span aria-hidden="true" className="mr-[2.5ch] text-white/50">
              ‹
            </span>
            •••• •••• •••• {paymentMethod.last4}
          </p>
        </div>

        <div className="flex items-end justify-between gap-3 text-white/70">
          <span className="text-[10px] font-medium sm:text-xs">{expiry}</span>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/85 sm:text-sm">{brand}</span>
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
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-7 w-7 shrink-0 rotate-90 sm:h-8 sm:w-8">
      <path d="M6 6.5c2-2 6-2 8 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 4c3.3-3.2 8.7-3.2 12 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
      <path d="M8 9c.9-.9 2.1-.9 3 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// Decorative printed-card artwork: fine flowing lines plus a soft highlight,
// all local/inline (no remote asset). Sits behind every piece of card text
// (the content wrapper is z-10) at very low contrast so it never competes
// with the chip, number, expiry or brand.
function CardArtwork() {
  return (
    <svg
      viewBox="0 0 400 250"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        <radialGradient id="pmc-glow" cx="85%" cy="0%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="250" fill="url(#pmc-glow)" />
      <g stroke="#fff" strokeWidth="0.8" strokeOpacity="0.09">
        <path d="M-20 190C60 120 130 250 220 170S350 60 430 110" />
        <path d="M-20 170C60 100 130 230 220 150S350 40 430 90" />
        <path d="M-20 150C60 80 130 210 220 130S350 20 430 70" />
        <path d="M-20 130C60 60 130 190 220 110S350 0 430 50" />
        <path d="M-20 210C60 140 130 270 220 190S350 80 430 130" />
        <path d="M-20 230C60 160 130 290 220 210S350 100 430 150" />
      </g>
      <g stroke="#fff" strokeWidth="0.7" strokeOpacity="0.07">
        <circle cx="330" cy="215" r="60" />
        <circle cx="330" cy="215" r="90" />
        <circle cx="330" cy="215" r="120" />
      </g>
    </svg>
  );
}
