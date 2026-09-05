import { Container, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';

export default function MeetingsPage() {
  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader
        eyebrow="Community"
        title="Member Meetings"
        description="Live sessions with the KUKO WAY team and other members."
      />
      <EmptyState
        title="No meetings scheduled yet"
        description="Upcoming online and in-person meetings will be listed here once the Events/Meetings module is built."
      />
    </Container>
  );
}
