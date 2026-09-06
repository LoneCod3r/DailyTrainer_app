'use client';

import { useState } from 'react';
import type { Role, UserStatus } from '@prisma/client';
import { Badge, Select } from '@/components/ui';

type Row = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string | Date;
};

const statusTone: Record<UserStatus, 'success' | 'neutral' | 'danger'> = {
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  SUSPENDED: 'danger',
};

export function UsersTable({ initialUsers, currentUserId }: { initialUsers: Row[]; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function patchUser(id: string, body: Record<string, string>) {
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? 'Failed to update user');
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data.user } : u)));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-sand-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-sand-200 bg-sand-50 text-ink-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id} className="border-b border-sand-100 last:border-0">
                  <td className="px-4 py-3 text-ink-900">{u.name ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-500">{u.email}</td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <Badge tone="brand">{u.role}</Badge>
                    ) : (
                      <Select
                        aria-label={`Role for ${u.email}`}
                        value={u.role}
                        disabled={pendingId === u.id}
                        onChange={(e) => patchUser(u.id, { role: e.target.value })}
                        className="py-1.5"
                      >
                        <option value="USER">USER</option>
                        <option value="MODERATOR">MODERATOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </Select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <Badge tone={statusTone[u.status]}>{u.status}</Badge>
                    ) : (
                      <Select
                        aria-label={`Status for ${u.email}`}
                        value={u.status}
                        disabled={pendingId === u.id}
                        onChange={(e) => patchUser(u.id, { status: e.target.value })}
                        className="py-1.5"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </Select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
