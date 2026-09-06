'use client';

import { useState, type FormEvent } from 'react';
import { Input, Textarea, Select, Button, Alert, Card, CardContent } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';

type Profile = {
  bio: string | null;
  avatarUrl: string | null;
  interests: string[];
  visibility: 'PUBLIC' | 'MEMBERS' | 'PRIVATE';
};

export function ProfileForm({ initialProfile }: { initialProfile: Profile }) {
  const t = useT();
  const [bio, setBio] = useState(initialProfile.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl ?? '');
  const [visibility, setVisibility] = useState(initialProfile.visibility);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch('/api/profiles/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio, avatarUrl, visibility }),
    });
    const data = await res.json();

    setSaving(false);
    if (!res.ok) {
      setMessage({ tone: 'danger', text: data?.error?.message ?? t('account.settings.profileSaveError') });
      return;
    }
    setMessage({ tone: 'success', text: t('account.settings.profileSaved') });
  }

  return (
    <Card className="max-w-xl">
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {message && <Alert tone={message.tone}>{message.text}</Alert>}
          <Input
            label={t('account.settings.avatarUrlLabel')}
            placeholder="https://…"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
          <Textarea
            label={t('account.settings.bioLabel')}
            rows={4}
            maxLength={1000}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <Select
            label={t('account.settings.visibilityLabel')}
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Profile['visibility'])}
          >
            <option value="PUBLIC">{t('account.settings.visibilityPublic')}</option>
            <option value="MEMBERS">{t('account.settings.visibilityMembers')}</option>
            <option value="PRIVATE">{t('account.settings.visibilityPrivate')}</option>
          </Select>
          <div>
            <Button type="submit" loading={saving}>
              {t('account.settings.saveProfile')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
