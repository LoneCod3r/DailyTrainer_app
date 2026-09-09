'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ReportReason, ReportResolution, ReportTargetType } from '@prisma/client';
import { Badge, Button, Card, CardContent, EmptyState, Modal, Select, Textarea, Alert } from '@/components/ui';
import { FlagIcon } from '@/components/layout/icons';
import { REASON_LABEL, RESOLUTION_LABEL, TARGET_LABEL } from './labels';

type ReportRow = {
  id: string;
  reason: ReportReason;
  note: string | null;
  targetType: ReportTargetType;
  createdAt: string | Date;
  reporter: { id: string; name: string | null; email: string };
  target:
    | { kind: 'DISCUSSION'; slug: string; title: string; authorName: string | null }
    | { kind: 'DISCUSSION_REPLY'; discussionSlug: string; body: string; authorName: string | null }
    | { kind: 'MISSING' };
};

const RESOLUTION_OPTIONS: ReportResolution[] = ['NONE', 'WARNED', 'CONTENT_HIDDEN', 'CONTENT_REMOVED', 'USER_SUSPENDED'];

export function ReportsQueue({ initialReports }: { initialReports: ReportRow[] }) {
  const [reports, setReports] = useState(initialReports);
  const [active, setActive] = useState<ReportRow | null>(null);
  const [outcome, setOutcome] = useState<'RESOLVED' | 'DISMISSED'>('RESOLVED');
  const [resolution, setResolution] = useState<ReportResolution>('NONE');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openReport(r: ReportRow) {
    setActive(r);
    setOutcome('RESOLVED');
    setResolution('NONE');
    setNote('');
    setError(null);
  }

  async function submit() {
    if (!active) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/moderation/reports/${active.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome, resolution, resolutionNote: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? 'Failed to resolve report');
        return;
      }
      setReports((prev) => prev.filter((r) => r.id !== active.id));
      setActive(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (reports.length === 0) {
    return (
      <EmptyState
        icon={<FlagIcon width={28} height={28} />}
        title="Your moderation queue is clear"
        description="No reports are waiting for review. New reports from members will show up here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {reports.map((r) => (
        <Card key={r.id}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge tone="warning">{REASON_LABEL[r.reason]}</Badge>
                <Badge tone="neutral">{TARGET_LABEL[r.targetType]}</Badge>
              </div>
              <span className="text-xs text-ink-300">{new Date(r.createdAt).toLocaleString()}</span>
            </div>

            {r.target.kind === 'MISSING' ? (
              <p className="text-sm text-ink-500">Reported content is no longer available.</p>
            ) : r.target.kind === 'DISCUSSION' ? (
              <div>
                <Link href={`/community/discussions/${r.target.slug}`} className="text-sm font-medium text-link hover:underline">
                  {r.target.title}
                </Link>
                <p className="text-xs text-ink-500">by {r.target.authorName ?? 'Unknown member'}</p>
              </div>
            ) : (
              <div>
                <Link href={`/community/discussions/${r.target.discussionSlug}`} className="text-sm text-ink-700 hover:underline">
                  “{r.target.body.slice(0, 140)}”
                </Link>
                <p className="text-xs text-ink-500">reply by {r.target.authorName ?? 'Unknown member'}</p>
              </div>
            )}

            {r.note && <p className="rounded-lg bg-sand-50 p-3 text-sm text-ink-700">{r.note}</p>}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-ink-500">Reported by {r.reporter.name ?? r.reporter.email}</p>
              <Button size="sm" variant="secondary" onClick={() => openReport(r)}>
                Review
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Modal open={!!active} onClose={() => setActive(null)} title="Resolve report">
        {active && (
          <div className="flex flex-col gap-4">
            {error && <Alert tone="danger">{error}</Alert>}
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-900">Outcome</label>
              <Select value={outcome} onChange={(e) => setOutcome(e.target.value as typeof outcome)}>
                <option value="RESOLVED">Resolved — action taken</option>
                <option value="DISMISSED">Dismissed — not a violation</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-900">Action</label>
              <Select value={resolution} onChange={(e) => setResolution(e.target.value as ReportResolution)}>
                {RESOLUTION_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {RESOLUTION_LABEL[r]}
                  </option>
                ))}
              </Select>
              {resolution === 'USER_SUSPENDED' && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  This immediately suspends the content author&apos;s account — they will not be able to sign in.
                </p>
              )}
              {resolution === 'WARNED' && (
                <p className="mt-1 text-xs text-ink-500">
                  Recorded on this report only — there is no in-app notification system yet to deliver it to the member.
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-900">Note (optional)</label>
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setActive(null)}>
                Cancel
              </Button>
              <Button onClick={submit} loading={submitting}>
                Submit
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
