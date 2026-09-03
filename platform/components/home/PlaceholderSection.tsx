import type { ReactNode } from 'react';
import { Card, Badge } from '@/components/ui';

// Structural placeholder for a future Home page section (Prompt2 §5: "create
// the structural components/placeholders necessary for the Home page...
// do not build the full Blog, Courses or Events functionality yet").
//
// Each real module (Articles, Events, Courses, Discussions) should replace
// its corresponding placeholder with live data without changing the
// surrounding Home page layout.
export function PlaceholderSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
        <Badge tone="neutral">Placeholder</Badge>
      </div>
      <Card className="border-dashed bg-sand-50/50 p-6">
        <p className="text-sm text-ink-500">{description}</p>
        {children}
      </Card>
    </section>
  );
}
