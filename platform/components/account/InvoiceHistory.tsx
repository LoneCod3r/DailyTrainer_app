import { formatCurrency } from '@/lib/format-currency';
import { formatDate } from '@/lib/format-date';
import { getT } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/locale';
import type { InvoiceSummary } from '@/modules/payments/billing.service';

// Read-only list sourced live from Stripe (billing.service.ts's
// listInvoicesForUser) — no invoice data is persisted or fabricated locally.
export function InvoiceHistory({ invoices, locale }: { invoices: InvoiceSummary[]; locale: Locale }) {
  const t = getT(locale);

  if (invoices.length === 0) {
    return <p className="text-sm text-ink-500">{t('account.billing.noInvoices')}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead>
          <tr className="border-b border-sand-200 text-xs uppercase tracking-wide text-ink-500">
            <th className="py-2 pr-3 font-medium">{t('account.billing.invoiceDate')}</th>
            <th className="py-2 pr-3 font-medium">{t('account.billing.invoiceAmount')}</th>
            <th className="py-2 pr-3 font-medium">{t('account.billing.invoiceStatus')}</th>
            <th className="py-2 font-medium">{t('account.billing.invoiceReceipt')}</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-sand-100 last:border-0">
              <td className="py-2 pr-3 text-ink-900">{formatDate(invoice.date, locale)}</td>
              <td className="py-2 pr-3 text-ink-900">{formatCurrency(invoice.amount, invoice.currency, locale)}</td>
              <td className="py-2 pr-3 text-ink-700">{invoice.status}</td>
              <td className="py-2">
                {invoice.hostedInvoiceUrl ? (
                  <a
                    href={invoice.hostedInvoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-link hover:underline"
                  >
                    {t('account.billing.viewReceipt')}
                  </a>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
