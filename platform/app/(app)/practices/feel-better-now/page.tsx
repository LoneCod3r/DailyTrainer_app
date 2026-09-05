import { Container, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';

export default function FeelBetterNowPage() {
  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader
        eyebrow="Practices"
        title="Feel Better Now"
        description="Short, targeted practices for when you need relief in the moment."
      />
      <EmptyState
        title="Quick practices coming soon"
        description="A set of short sessions, organized by what you're feeling, will appear here."
      />
    </Container>
  );
}
