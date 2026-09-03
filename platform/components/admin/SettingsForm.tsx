'use client';

import { useState, type FormEvent } from 'react';
import { Input, Button, Alert, Card, CardContent } from '@/components/ui';

type Settings = {
  appName: string;
  logoUrl: string;
  defaultLanguage: string;
  defaultCurrency: string;
  contactEmail: string;
};

export function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [values, setValues] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });
    const data = await res.json();

    setSaving(false);
    if (!res.ok) {
      setMessage({ tone: 'danger', text: data?.error?.message ?? 'Failed to save settings' });
      return;
    }
    setValues(data.settings);
    setMessage({ tone: 'success', text: 'Settings saved.' });
  }

  return (
    <Card className="max-w-xl">
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {message && <Alert tone={message.tone}>{message.text}</Alert>}
          <Input
            label="Application name"
            value={values.appName}
            onChange={(e) => setValues((v) => ({ ...v, appName: e.target.value }))}
          />
          <Input
            label="Logo URL"
            placeholder="https://…"
            value={values.logoUrl}
            onChange={(e) => setValues((v) => ({ ...v, logoUrl: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Default language"
              value={values.defaultLanguage}
              onChange={(e) => setValues((v) => ({ ...v, defaultLanguage: e.target.value }))}
            />
            <Input
              label="Default currency"
              value={values.defaultCurrency}
              onChange={(e) => setValues((v) => ({ ...v, defaultCurrency: e.target.value.toUpperCase() }))}
            />
          </div>
          <Input
            label="Contact email"
            type="email"
            value={values.contactEmail}
            onChange={(e) => setValues((v) => ({ ...v, contactEmail: e.target.value }))}
          />
          <div>
            <Button type="submit" loading={saving}>
              Save settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
