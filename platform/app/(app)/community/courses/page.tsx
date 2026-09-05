import { Container, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';

export default function CoursesPage() {
  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader
        eyebrow="Community"
        title="Courses"
        description="Structured educational courses beyond the daily practice."
      />
      <EmptyState
        title="No courses published yet"
        description="Courses will appear here once the Courses module is built."
      />
    </Container>
  );
}
