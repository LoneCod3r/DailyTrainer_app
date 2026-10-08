'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Input, Button, Alert, Card, CardContent } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';

type Field = 'currentPassword' | 'newPassword' | 'confirmPassword';
type FieldErrors = Partial<Record<Field, string>>;

const MIN_LENGTH = 8;
const MAX_LENGTH = 72;

// Signed-in password change (POST /api/account/password). The server is the
// authority — it re-validates everything and verifies the current password —
// the checks here only give instant feedback. A successful change revokes
// every session issued under the old password, including this one (see
// passwordFingerprint in lib/auth.ts), so the form signs straight back in
// with the new password to keep this device signed in.
export function ChangePasswordForm({ email }: { email: string }) {
  const t = useT();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string; signIn?: boolean } | null>(
    null,
  );

  function newPasswordError(code?: string): string | undefined {
    if (code === 'SAME_AS_CURRENT') return t('account.settings.passwordSameAsCurrent');
    if (newPassword.length < MIN_LENGTH) return t('account.settings.passwordTooShort');
    if (newPassword.length > MAX_LENGTH) return t('account.settings.passwordTooLong');
    return code ? t('account.settings.passwordChangeError') : undefined;
  }

  function validate(): FieldErrors {
    const found: FieldErrors = {};
    if (!currentPassword) found.currentPassword = t('account.settings.passwordCurrentRequired');
    const lengthError = newPasswordError();
    if (lengthError) found.newPassword = lengthError;
    else if (newPassword === currentPassword) found.newPassword = t('account.settings.passwordSameAsCurrent');
    if (newPassword !== confirmPassword) found.confirmPassword = t('account.settings.passwordMismatch');
    return found;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const reason: string | undefined = data?.error?.details?.reason;
        const fieldErrors = data?.error?.details?.fieldErrors ?? {};
        if (reason === 'INVALID_CURRENT_PASSWORD') {
          setErrors({ currentPassword: t('account.settings.passwordWrongCurrent') });
        } else if (reason === 'SAME_AS_CURRENT' || fieldErrors.newPassword) {
          setErrors({ newPassword: newPasswordError(reason ?? fieldErrors.newPassword?.[0]) });
        } else if (fieldErrors.confirmPassword) {
          setErrors({ confirmPassword: t('account.settings.passwordMismatch') });
        } else {
          setMessage({
            tone: 'danger',
            text: res.status === 429 ? t('account.settings.passwordRateLimited') : t('account.settings.passwordChangeError'),
          });
        }
        return;
      }

      // The change ended this session too; sign back in with the new password.
      const result = await signIn('credentials', { email, password: newPassword, redirect: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      if (result?.ok) {
        setMessage({ tone: 'success', text: t('account.settings.passwordChanged') });
        router.refresh();
      } else {
        setMessage({ tone: 'success', text: t('account.settings.passwordChangedSignInAgain'), signIn: true });
      }
    } catch {
      setMessage({ tone: 'danger', text: t('account.settings.passwordChangeError') });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-xl">
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate data-testid="change-password-form">
          <p className="text-sm text-ink-500">{t('account.settings.passwordSectionDescription')}</p>
          {message && (
            <Alert tone={message.tone}>
              {message.text}
              {message.signIn && (
                <>
                  {' '}
                  <Link href="/login?callbackUrl=/account/settings" className="font-medium underline">
                    {t('auth.backToLogin')}
                  </Link>
                </>
              )}
            </Alert>
          )}
          <Input
            label={t('account.settings.currentPasswordLabel')}
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            required
            value={currentPassword}
            error={errors.currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label={t('account.settings.newPasswordLabel')}
            type="password"
            name="newPassword"
            autoComplete="new-password"
            required
            minLength={MIN_LENGTH}
            maxLength={MAX_LENGTH}
            hint={t('auth.passwordHint')}
            value={newPassword}
            error={errors.newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label={t('account.settings.confirmPasswordLabel')}
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={confirmPassword}
            error={errors.confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div>
            <Button type="submit" loading={saving}>
              {t('account.settings.changePasswordButton')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
