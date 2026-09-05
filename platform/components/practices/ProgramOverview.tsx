import { Container, Card, CardContent, Badge, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';

// Shared structural layout for the three program lengths (7/14/28 days).
// Day-by-day content is intentionally not implemented yet — this only
// establishes the practices → program → session hierarchy.
export function ProgramOverview({ days }: { days: number }) {
  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader
        eyebrow="Practices · Program"
        title={`${days}-Day Program`}
        description="A guided sequence of daily practice sessions. Day-by-day content will appear here once the program is built out."
      />

      <EmptyState
        title="Program content coming soon"
        description="Each day below will unlock a guided practice session once this program is published."
      />

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-7">
        {Array.from({ length: days }, (_, i) => i + 1).map((day) => (
          <Card key={day} className="opacity-60">
            <CardContent className="flex flex-col items-center gap-1 p-3 text-center">
              <span className="text-sm font-semibold text-ink-900">Day {day}</span>
              <Badge tone="neutral">Locked</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
}
