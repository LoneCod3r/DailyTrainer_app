import { Container, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';

export default function StartHerePage() {
  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader
        eyebrow="Practices"
        title="Start Here"
        description="The essentials for anyone new to the KUKO WAY practice — what it is, how it works, and how to begin."
      />
      <EmptyState
        title="Orientation content coming soon"
        description="An introduction to the KUKO WAY method and your first guided practice will appear here."
      />
    </Container>
  );
}
