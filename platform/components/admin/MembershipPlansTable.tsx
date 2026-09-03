'use client';

import { useState, type FormEvent } from 'react';
import { Badge, Button, Modal, Input, Select, Alert } from '@/components/ui';

type Plan = {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  interval: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  active: boolean;
};

type FormState = {
  name: string;
  description: string;
  amountMajor: string; // whole-currency-unit string shown in the input, e.g. "19.00"
  currency: string;
  interval: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  amountMajor: '',
  currency: 'eur',
  interval: 'month',
  active: true,
};

function toFormState(plan: Plan): FormState {
  return {
    name: plan.name,
    description: plan.description ?? '',
    amountMajor: (plan.amount / 100).toString(),
    currency: plan.currency,
    interval: plan.interval,
    active: plan.active,
  };
}

function formatPrice(plan: Plan) {
  return `${(plan.amount / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: plan.currency.toUpperCase(),
  })} / ${plan.interval}`;
}

export function MembershipPlansTable({ initialPlans }: { initialPlans: Plan[] }) {
  const [plans, setPlans] = useState(initialPlans);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setEditingId('new');
  }

  function openEdit(plan: Plan) {
    setForm(toFormState(plan));
    setError(null);
    setEditingId(plan.id);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const amount = Math.round(parseFloat(form.amountMajor) * 100);
    const body = {
      name: form.name,
      description: form.description || undefined,
      amount,
      currency: form.currency,
      interval: form.interval,
      active: form.active,
    };

    const isNew = editingId === 'new';
    const res = await fetch(isNew ? '/api/admin/membership-plans' : `/api/admin/membership-plans/${editingId}`, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data?.error?.message ?? 'Failed to save membership plan');
      return;
    }

    setPlans((prev) => (isNew ? [...prev, data.plan] : prev.map((p) => (p.id === data.plan.id ? data.plan : p))));
    setEditingId(null);
  }

  async function toggleActive(plan: Plan) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/membership-plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !plan.active }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data?.error?.message ?? 'Failed to update plan');
      return;
    }
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? data.plan : p)));
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert tone="danger">{error}</Alert>}

      <div>
        <Button onClick={openCreate}>New plan</Button>
      </div>

      {plans.length === 0 ? (
        <p className="text-sm text-ink-500">No membership plans yet — create the first one above.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sand-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-sand-200 bg-sand-50 text-ink-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stripe</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-sand-100 last:border-0">
                  <td className="px-4 py-3 text-ink-900">{plan.name}</td>
                  <td className="px-4 py-3 text-ink-500">{formatPrice(plan)}</td>
                  <td className="px-4 py-3">
                    {plan.stripePriceId ? (
                      <Badge tone="success">Connected</Badge>
                    ) : (
                      <Badge tone="warning">Not connected</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={plan.active ? 'success' : 'neutral'}>{plan.active ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" disabled={saving} onClick={() => toggleActive(plan)}>
                        {plan.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={editingId !== null}
        onClose={() => setEditingId(null)}
        title={editingId === 'new' ? 'New membership plan' : 'Edit membership plan'}
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price"
              hint="Whole currency units, e.g. 19.00"
              type="number"
              min="1"
              step="0.01"
              value={form.amountMajor}
              onChange={(e) => setForm((f) => ({ ...f, amountMajor: e.target.value }))}
              required
            />
            <Select
              label="Billing interval"
              value={form.interval}
              onChange={(e) => setForm((f) => ({ ...f, interval: e.target.value }))}
            >
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </Select>
          </div>
          <Select label="Currency" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
            <option value="eur">EUR</option>
          </Select>
          <div>
            <Button type="submit" loading={saving}>
              {editingId === 'new' ? 'Create plan' : 'Save changes'}
            </Button>
          </div>
          {editingId !== 'new' && (
            <p className="text-xs text-ink-500">
              Changing the price creates a new Stripe Price and archives the old one — existing subscribers keep
              their current price until they resubscribe.
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}
