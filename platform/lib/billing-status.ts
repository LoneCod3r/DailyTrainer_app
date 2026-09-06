import type { DictKey } from '@/lib/i18n/dictionaries';

// Shared status → visual tone / translation-key mapping so the Account hub,
// Membership and Billing pages render subscription/payment states
// consistently instead of each inventing its own labels.
export type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

export const SUBSCRIPTION_STATUS_TONE: Record<string, Tone> = {
  ACTIVE: 'success',
  TRIALING: 'success',
  PAST_DUE: 'warning',
  CANCELED: 'neutral',
  INCOMPLETE: 'warning',
  INCOMPLETE_EXPIRED: 'danger',
  UNPAID: 'danger',
};

export function subscriptionStatusKey(status: string): DictKey {
  return `account.membership.status.${status}` as DictKey;
}

export const PAYMENT_STATUS_TONE: Record<string, Tone> = {
  PENDING: 'warning',
  PROCESSING: 'warning',
  SUCCEEDED: 'success',
  FAILED: 'danger',
  CANCELED: 'neutral',
  REFUNDED: 'neutral',
  REQUIRES_ACTION: 'warning',
};

export function paymentStatusKey(status: string): DictKey {
  return `account.donation.status.${status}` as DictKey;
}
