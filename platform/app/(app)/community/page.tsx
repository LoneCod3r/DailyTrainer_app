import Link from 'next/link';
import { Container, Card, CardContent, Badge } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';

const AREAS = [
  {
    href: '/community/discussions',
    title: 'Discussions',
    description: 'Conversations between members.',
  },
  {
    href: '/community/courses',
    title: 'Courses',
    description: 'Structured educational courses beyond the daily practice.',
  },
  {
    href: '/community/meetings',
    title: 'Member Meetings',
    description: 'Live sessions with the KUKO WAY team and other members.',
  },
];

// Community is the social/educational experience — deliberately separate
// from Practices (the personal experience). Nothing here is mixed into the
// Practices navigation.
export default function CommunityPage() {
  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader title="Community" description="Connect with other members, take courses, and join live meetings." />

      <div className="grid gap-5 sm:grid-cols-3">
        {AREAS.map((area) => (
          <Link key={area.href} href={area.href}>
            <Card className="h-full transition-shadow hover:shadow-soft">
              <CardContent className="flex h-full flex-col gap-2">
                <Badge tone="neutral" className="w-fit">
                  Community
                </Badge>
                <h2 className="text-base font-semibold text-ink-900">{area.title}</h2>
                <p className="text-sm text-ink-500">{area.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
