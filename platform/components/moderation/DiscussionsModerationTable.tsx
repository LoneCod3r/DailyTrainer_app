'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ModerationStatus } from '@prisma/client';
import { Badge, Button } from '@/components/ui';

type Row = {
  id: string;
  slug: string;
  title: string;
  status: ModerationStatus;
  locked: boolean;
  lastActivityAt: string | Date;
  author: { name: string | null; email: string };
  _count: { replies: number };
};

const STATUS_TONE: Record<ModerationStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  PUBLISHED: 'success',
  PENDING: 'warning',
  HIDDEN: 'danger',
  REMOVED: 'neutral',
};

export function DiscussionsModerationTable({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patch(slug: string, body: Record<string, unknown>) {
    setPendingId(slug);
    setError(null);
    try {
      const res = await fetch(`/api/moderation/discussions/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? 'Failed to update discussion');
        return;
      }
      setRows((prev) => prev.map((r) => (r.slug === slug ? { ...r, ...data.discussion } : r)));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-sand-200">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-sand-200 bg-sand-50 text-ink-500">
            <tr>
              <th className="px-4 py-3 font-medium">Discussion</th>
              <th className="px-4 py-3 font-medium">Author</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Replies</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const busy = pendingId === r.slug;
              return (
                <tr key={r.id} className="border-b border-sand-100 last:border-0 align-top">
                  <td className="px-4 py-3">
                    <Link href={`/community/discussions/${r.slug}`} className="font-medium text-ink-900 hover:underline">
                      {r.title}
                    </Link>
                    {r.locked && (
                      <span className="ml-2">
                        <Badge tone="neutral">Locked</Badge>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-500">{r.author.name ?? r.author.email}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{r._count.replies}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {r.status !== 'PUBLISHED' && (
                        <Button size="sm" variant="secondary" disabled={busy} onClick={() => patch(r.slug, { status: 'PUBLISHED' })}>
                          Restore
                        </Button>
                      )}
                      {r.status !== 'HIDDEN' && (
                        <Button size="sm" variant="secondary" disabled={busy} onClick={() => patch(r.slug, { status: 'HIDDEN' })}>
                          Hide
                        </Button>
                      )}
                      {r.status !== 'REMOVED' && (
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busy}
                          onClick={() => {
                            if (confirm(`Remove "${r.title}"? Members will no longer be able to see it. You can restore it later.`)) {
                              patch(r.slug, { status: 'REMOVED' });
                            }
                          }}
                        >
                          Remove
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => patch(r.slug, { locked: !r.locked })}>
                        {r.locked ? 'Unlock' : 'Lock'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
