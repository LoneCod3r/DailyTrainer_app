'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input, Textarea, Select, Button, Alert, Card, CardContent } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';
import { DISCUSSION_CATEGORIES } from '@/modules/discussions/discussions.service';
import type { DiscussionCategory } from '@prisma/client';
import type { DictKey } from '@/lib/i18n/dictionaries';

const CATEGORY_LABEL_KEY: Record<DiscussionCategory, DictKey> = {
  GENERAL: 'discussions.categoryGeneral',
  PRACTICES: 'discussions.categoryPractices',
  PROGRAMS: 'discussions.categoryPrograms',
  KUKO_WAY: 'discussions.categoryKukoWay',
  COMMUNITY: 'discussions.categoryCommunity',
  QUESTIONS: 'discussions.categoryQuestions',
};

// Real submission — POSTs to the Discussions API and persists to Postgres
// (see modules/discussions/discussions.service.ts). Not a mock/local-only
// form: the resulting discussion is a real row other members can see.
export function DiscussionComposer() {
  const t = useT();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DiscussionCategory>('GENERAL');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/discussions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, body }),
    });
    const data = await res.json();

    if (!res.ok) {
      setSubmitting(false);
      setError(data?.error?.message ?? t('discussions.submitError'));
      return;
    }

    router.push(`/community/discussions/${data.discussion.slug}`);
    router.refresh();
  }

  return (
    <Card className="max-w-xl">
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Input
            label={t('discussions.fieldTitle')}
            name="title"
            required
            minLength={4}
            maxLength={140}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Select
            label={t('discussions.fieldCategory')}
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as DiscussionCategory)}
          >
            {DISCUSSION_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(CATEGORY_LABEL_KEY[c])}
              </option>
            ))}
          </Select>
          <Textarea
            label={t('discussions.fieldBody')}
            name="body"
            required
            minLength={10}
            maxLength={8000}
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <Button type="submit" loading={submitting}>
              {submitting ? t('discussions.submitting') : t('discussions.submit')}
            </Button>
            <Link href="/community/discussions" className="text-sm font-medium text-ink-500 hover:text-ink-900">
              {t('discussions.cancel')}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
