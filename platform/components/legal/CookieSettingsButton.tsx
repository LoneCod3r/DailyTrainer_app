'use client';

import type { ButtonHTMLAttributes } from 'react';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useLegal } from './LegalProvider';

// Reopens the cookie settings dialog, so a choice can be changed later.
// Unstyled by default, so callers (footer link row, reCAPTCHA consent notice)
// style it.
export function CookieSettingsButton(props: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type'>) {
  const t = useT();
  const { openSettings } = useLegal();
  return (
    <button type="button" onClick={openSettings} {...props}>
      {props.children ?? t('legal.cookieSettings')}
    </button>
  );
}
