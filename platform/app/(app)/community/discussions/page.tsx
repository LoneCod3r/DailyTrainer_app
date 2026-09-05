import { Container, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';

export default function DiscussionsPage() {
  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader eyebrow="Community" title="Discussions" description="Conversations between members." />
      <EmptyState
        title="No discussions yet"
        description="Member discussion threads will appear here once the Discussions module is built."
      />
    </Container>
  );
}
