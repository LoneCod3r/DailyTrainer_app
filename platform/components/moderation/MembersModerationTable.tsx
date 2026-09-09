'use client';

import { useState } from 'react';
import type { UserStatus } from '@prisma/client';
import { Badge, Button } from '@/components/ui';

type Row = { id: string; name: string | null; email: string; status: UserStatus; createdAt: string | Date };

const STATUS_TONE: Record<UserStatus, 'success' | 'neutral' | 'danger'> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  SUSPENDED: 'danger',
};

export function MembersModerationTable({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(id: string, status: UserStatus) {
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/moderation/users/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? 'Failed to update member');
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...data.user } : r)));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-sand-200">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-sand-200 bg-sand-50 text-ink-500">
            <tr>
              <th className="px-4 py-3 font-medium">Member</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const busy = pendingId === r.id;
              return (
                <tr key={r.id} className="border-b border-sand-100 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{r.name ?? '—'}</p>
                    <p className="text-xs text-ink-500">{r.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {r.status === 'SUSPENDED' ? (
                      <Button size="sm" variant="secondary" disabled={busy} onClick={() => setStatus(r.id, 'ACTIVE')}>
                        Reactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busy}
                        onClick={() => {
                          if (confirm(`Suspend ${r.name ?? r.email}? They will not be able to sign in until reactivated.`)) {
                            setStatus(r.id, 'SUSPENDED');
                          }
                        }}
                      >
                        Suspend
                      </Button>
                    )}
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
