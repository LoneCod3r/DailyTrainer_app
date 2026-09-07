'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ResendVerificationForm } from '@/components/auth/ResendVerificationForm';
import { Modal } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';

// Persistent, dismissible-per-page-load prompt for a signed-in-but-unverified
// session (session.user.emailVerified is null — see lib/auth.ts, which
// allows login while unverified but leaves the server-side gate in
// lib/auth-guards.ts to block the actual member actions). Not shown to
// signed-out visitors or already-verified members.
export function VerificationBanner() {
  const { data: session, status } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);
  const t = useT();

  if (status !== 'authenticated' || session.user.emailVerified || dismissed) return null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        <span>{t('auth.bannerUnverified')}</span>
        <button type="button" className="font-medium underline underline-offset-2" onClick={() => setResendOpen(true)}>
          {t('auth.resendButton')}
        </button>
        <button
          type="button"
          className="text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
          onClick={() => setDismissed(true)}
          aria-label={t('auth.bannerDismiss')}
        >
          ×
        </button>
      </div>
      <Modal open={resendOpen} onClose={() => setResendOpen(false)} title={t('auth.resendButton')}>
        <ResendVerificationForm initialEmail={session.user.email ?? ''} />
      </Modal>
    </>
  );
}
