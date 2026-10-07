import type { LocalizedText } from '@/modules/kuko-way/types';

// The KUKO WAY product catalog — the single source of displayed prices
// (V1 decision document §1/§3). Static for now: it has exactly the shape the
// planned Product / ProductPrice tables will hold (slug, kind, standard
// price, Stripe ids later), so when checkout is built the catalog service
// reads the database instead and the UI doesn't change.
//
// Display only. Nothing here creates a checkout, a Purchase, an Entitlement
// or a subscription — checkout stays off (lib/features.ts
// `programCheckout`). Only the client's confirmed *standard* prices are
// listed: Founding Member prices, upgrade credit and VAT presentation are
// unresolved and deliberately absent.
//
// Amounts are in cents, like every other billing amount in the app.

export type ProductKind =
  // One-time purchase of a Reset Program (never a subscription).
  | 'PROGRAM'
  // Recurring membership — future (KUKO WAY Community).
  | 'SUBSCRIPTION'
  // Practitioner training — future.
  | 'TRAINING';

export interface CatalogPrice {
  amount: number;
  currency: 'eur';
  // Only for SUBSCRIPTION prices. One-time products have no interval.
  interval?: 'month' | 'year';
}

export interface CatalogProduct {
  slug: string;
  kind: ProductKind;
  // PROGRAM only — the Reset Program it unlocks (modules/programs).
  programSlug?: string;
  title: LocalizedText;
  // The client's own one-line role for each product (client chat price
  // table), with a direct English translation.
  tagline: LocalizedText;
  prices: CatalogPrice[];
  // 'current' = part of the V1 lineup (checkout not open yet);
  // 'future'  = announced, not launching in V1.
  status: 'current' | 'future';
}

const eur = (amount: number, interval?: 'month' | 'year'): CatalogPrice => ({ amount, currency: 'eur', interval });

export const CATALOG: CatalogProduct[] = [
  {
    slug: 'reset-1-day',
    kind: 'PROGRAM',
    programSlug: '1-day',
    title: { bg: '1 Day Reset', en: '1 Day Reset' },
    tagline: { bg: 'Първо преживяване', en: 'A first experience' },
    prices: [eur(1900)],
    status: 'current',
  },
  {
    slug: 'reset-3-days',
    kind: 'PROGRAM',
    programSlug: '3-days',
    title: { bg: '3 Day Reset', en: '3 Day Reset' },
    tagline: { bg: 'Кратък рестарт', en: 'A short restart' },
    prices: [eur(3900)],
    status: 'current',
  },
  {
    slug: 'reset-7-days',
    kind: 'PROGRAM',
    programSlug: '7-days',
    title: { bg: '7 Day Reset', en: '7 Day Reset' },
    tagline: { bg: 'Основен кратък курс', en: 'The core short course' },
    prices: [eur(7900)],
    status: 'current',
  },
  {
    slug: 'reset-28-days',
    kind: 'PROGRAM',
    programSlug: '28-days',
    title: { bg: '28 Day Reset', en: '28 Day Reset' },
    tagline: { bg: 'Флагманска програма', en: 'The flagship program' },
    prices: [eur(14900)],
    status: 'current',
  },
  {
    slug: 'community',
    kind: 'SUBSCRIPTION',
    title: { bg: 'KUKO WAY Community', en: 'KUKO WAY Community' },
    tagline: { bg: 'Продължаване след курса', en: 'Continuing after a program' },
    prices: [eur(1900, 'month'), eur(19000, 'year')],
    status: 'future',
  },
  {
    slug: 'trainer',
    kind: 'TRAINING',
    title: { bg: 'KUKO WAY Trainer Program', en: 'KUKO WAY Trainer Program' },
    tagline: { bg: 'Обучение за треньори', en: 'Training for trainers' },
    prices: [eur(149000)],
    status: 'future',
  },
];

export function getCatalog(): CatalogProduct[] {
  return CATALOG;
}

export function getProgramProduct(programSlug: string): CatalogProduct | undefined {
  return CATALOG.find((p) => p.kind === 'PROGRAM' && p.programSlug === programSlug);
}

export function getFutureProducts(): CatalogProduct[] {
  return CATALOG.filter((p) => p.status === 'future');
}
