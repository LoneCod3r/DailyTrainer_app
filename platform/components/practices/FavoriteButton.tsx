'use client';

import { useState } from 'react';
import Link from 'next/link';
import { clsx } from '@/lib/clsx';
import { useT } from '@/lib/i18n/LocaleProvider';

// Save/unsave a practice to the signed-in user's private favorites
// (concept §16 "My favorites"). Signed-out visitors get a log-in link
// instead — favorites are account-only. Optimistic, rolled back on failure.
export function FavoriteButton({
  practiceSlug,
  initialFavorite,
  signedIn,
}: {
  practiceSlug: string;
  initialFavorite: boolean;
  signedIn: boolean;
}) {
  const t = useT();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [busy, setBusy] = useState(false);

  const base =
    'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

  if (!signedIn) {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(`/practices/${practiceSlug}`)}`}
        className={clsx(base, 'border-sand-300 text-ink-700 hover:border-brand-600')}
      >
        <Heart filled={false} /> {t('practiceSession.favoriteSignIn')}
      </Link>
    );
  }

  async function toggle() {
    const next = !favorite;
    setFavorite(next);
    setBusy(true);
    try {
      const res = await fetch(`/api/favorites/${encodeURIComponent(practiceSlug)}`, { method: next ? 'PUT' : 'DELETE' });
      if (!res.ok) setFavorite(!next);
    } catch {
      setFavorite(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={favorite}
      className={clsx(
        base,
        favorite ? 'border-brand-600 bg-brand-tint text-link' : 'border-sand-300 text-ink-700 hover:border-brand-600',
      )}
      data-testid="favorite-button"
    >
      <Heart filled={favorite} /> {favorite ? t('practiceSession.favoriteRemove') : t('practiceSession.favoriteAdd')}
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
      <path d="M10 16.5s-6-3.6-6-8.2A3.3 3.3 0 0 1 10 6.4a3.3 3.3 0 0 1 6 1.9c0 4.6-6 8.2-6 8.2Z" strokeLinejoin="round" />
    </svg>
  );
}
