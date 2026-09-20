import { formatCurrency } from '@/lib/format-currency';
import { formatDate } from '@/lib/format-date';
import { getT, type DictKey } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/locale';
import type { InvoiceSummary } from '@/modules/payments/billing.service';

// Stripe's raw invoice statuses that have a translated label; anything else
// (e.g. a status Stripe adds later) is shown as-is rather than hidden.
const INVOICE_STATUSES = ['draft', 'open', 'paid', 'uncollectible', 'void'];

// Read-only list sourced live from Stripe (billing.service.ts's
// listInvoicesForUser) — no invoice data is persisted or fabricated locally.
export function InvoiceHistory({ invoices, locale }: { invoices: InvoiceSummary[]; locale: Locale }) {
  const t = getT(locale);
  const statusLabel = (status: string) =>
    INVOICE_STATUSES.includes(status) ? t(`account.billing.invoiceStatuses.${status}` as DictKey) : status;

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
              <td className="py-2 pr-3 text-ink-700">{statusLabel(invoice.status)}</td>
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
