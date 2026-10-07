import { Button } from '@/components/ui';

// The purchase action while commerce is closed: a calm, clearly inactive
// button. Deliberately a plain disabled <button> with no handler, form or
// link — it cannot reach any checkout, subscription or payment route. When
// checkout opens, this is replaced by a real action behind
// `features.programCheckout`, not re-wired.
export function ComingSoonButton({ label, describedBy }: { label: string; describedBy?: string }) {
  return (
    <Button type="button" variant="secondary" disabled aria-describedby={describedBy} data-testid="coming-soon-cta">
      {label}
    </Button>
  );
}
