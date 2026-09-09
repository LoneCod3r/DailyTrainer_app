'use client';

import { useState } from 'react';
import type { ReportReason } from '@prisma/client';
import { Button, Modal, Select, Textarea, Alert } from '@/components/ui';
import { FlagIcon } from '@/components/layout/icons';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { DictKey } from '@/lib/i18n/dictionaries';

const REASONS: { value: ReportReason; labelKey: DictKey }[] = [
  { value: 'SPAM', labelKey: 'discussions.reportReasonSpam' },
  { value: 'HARASSMENT', labelKey: 'discussions.reportReasonHarassment' },
  { value: 'INAPPROPRIATE', labelKey: 'discussions.reportReasonInappropriate' },
  { value: 'OTHER', labelKey: 'discussions.reportReasonOther' },
];

// Any verified member can report a discussion or reply — feeds the
// moderator queue at /moderation/reports. Hidden entirely for signed-out
// visitors and for a member reporting their own content.
export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: 'DISCUSSION' | 'DISCUSSION_REPLY';
  targetId: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('SPAM');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason, note: note.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data?.error?.message ?? t('discussions.reportError'));
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setDone(false);
          setError(null);
          setNote('');
          setReason('SPAM');
        }}
        className="inline-flex items-center gap-1 text-xs font-medium text-ink-300 hover:text-ink-700"
      >
        <FlagIcon width={13} height={13} /> {t('discussions.report')}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('discussions.reportTitle')}>
        {done ? (
          <div className="flex flex-col gap-4">
            <Alert tone="success">{t('discussions.reportSubmitted')}</Alert>
            <div className="flex justify-end">
              <Button onClick={() => setOpen(false)}>OK</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {error && <Alert tone="danger">{error}</Alert>}
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-900">{t('discussions.reportReason')}</label>
              <Select value={reason} onChange={(e) => setReason(e.target.value as ReportReason)}>
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {t(r.labelKey)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-900">{t('discussions.reportNote')}</label>
              <Textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                {t('discussions.reportCancel')}
              </Button>
              <Button onClick={submit} loading={submitting}>
                {t('discussions.reportSubmit')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
