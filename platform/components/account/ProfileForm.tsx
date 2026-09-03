'use client';

import { useState, type FormEvent } from 'react';
import { Input, Textarea, Select, Button, Alert, Card, CardContent } from '@/components/ui';

type Profile = {
  bio: string | null;
  avatarUrl: string | null;
  interests: string[];
  visibility: 'PUBLIC' | 'MEMBERS' | 'PRIVATE';
};

export function ProfileForm({ initialProfile }: { initialProfile: Profile }) {
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
      setMessage({ tone: 'danger', text: data?.error?.message ?? 'Failed to save profile' });
      return;
    }
    setMessage({ tone: 'success', text: 'Profile updated.' });
  }

  return (
    <Card className="max-w-xl">
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {message && <Alert tone={message.tone}>{message.text}</Alert>}
          <Input label="Avatar URL" placeholder="https://…" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          <Textarea label="Bio" rows={4} maxLength={1000} value={bio} onChange={(e) => setBio(e.target.value)} />
          <Select
            label="Profile visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Profile['visibility'])}
          >
            <option value="PUBLIC">Public — visible to anyone</option>
            <option value="MEMBERS">Members only — visible to logged-in members</option>
            <option value="PRIVATE">Private — visible only to me</option>
          </Select>
          <div>
            <Button type="submit" loading={saving}>
              Save profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
