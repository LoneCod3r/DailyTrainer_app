import { describe, it, expect } from 'vitest';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InvoiceHistory } from '@/components/account/InvoiceHistory';
import type { InvoiceSummary } from '@/modules/payments/billing.service';
import type { Locale } from '@/lib/i18n/locale';

// Next compiles JSX with the automatic runtime, but Vitest (tsconfig has
// jsx: preserve) uses the classic transform, which needs a global React. Kept
// local to this test so no shared test config or component code changes.
(globalThis as { React?: typeof React }).React = React;

// InvoiceHistory is a plain (hook-free) component, so it is rendered to static
// markup and the Status cell is read back — the real status-label logic, no
// mocks and no DOM environment needed.

function invoice(status: string): InvoiceSummary {
  return {
    id: `in_${status}`,
    date: new Date('2026-09-20T00:00:00Z'),
    amount: 1500,
    currency: 'eur',
    status,
    hostedInvoiceUrl: null,
  };
}

function renderStatusCell(status: string, locale: Locale): string {
  const html = renderToStaticMarkup(createElement(InvoiceHistory, { invoices: [invoice(status)], locale }));
  const match = html.match(/<td class="py-2 pr-3 text-ink-700">([^<]*)<\/td>/);
  if (!match) throw new Error(`status cell not found in: ${html}`);
  return match[1];
}

const KNOWN: Array<[string, string, string]> = [
  ['draft', 'Draft', 'Чернова'],
  ['open', 'Open', 'Очаква плащане'],
  ['paid', 'Paid', 'Платена'],
  ['uncollectible', 'Uncollectible', 'Несъбираема'],
  ['void', 'Void', 'Анулирана'],
];

describe('InvoiceHistory status labels', () => {
  it.each(KNOWN)('translates Stripe status "%s" to English "%s"', (status, en) => {
    expect(renderStatusCell(status, 'en')).toBe(en);
  });

  it.each(KNOWN)('translates Stripe status "%s" to Bulgarian "%s"', (status, _en, bg) => {
    expect(renderStatusCell(status, 'bg')).toBe(bg);
  });

  it.each(['en', 'bg'] as const)('shows an unknown status as the raw Stripe string (%s)', (locale) => {
    expect(() => renderStatusCell('some_future_status', locale)).not.toThrow();
    expect(renderStatusCell('some_future_status', locale)).toBe('some_future_status');
  });

  it.each(['en', 'bg'] as const)('does not translate look-alike or differently-cased statuses (%s)', (locale) => {
    // Stripe statuses are lowercase; only exact matches are translated.
    expect(renderStatusCell('PAID', locale)).toBe('PAID');
    expect(renderStatusCell('unknown', locale)).toBe('unknown');
  });

  it.each(['en', 'bg'] as const)('does not resolve inherited object keys as statuses (%s)', (locale) => {
    expect(renderStatusCell('constructor', locale)).toBe('constructor');
  });
});
