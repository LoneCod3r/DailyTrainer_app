import { Container, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';

export default function LibraryPage() {
  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader
        eyebrow="Practices"
        title="Library"
        description="Every practice and program in one searchable, filterable place."
      />
      <div className="rounded-xl border border-sand-200 bg-surface px-4 py-3 text-sm text-ink-300">
        Search and filters will appear here.
      </div>
      <EmptyState
        title="No practices published yet"
        description="Individual practices will be listed here once the practice content model is built."
      />
    </Container>
  );
}
