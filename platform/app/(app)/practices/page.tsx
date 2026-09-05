import Link from 'next/link';
import { Container, Card, CardContent, Badge } from '@/components/ui';

const CATEGORIES = [
  {
    href: '/practices/start-here',
    title: 'Start Here',
    description: 'The essentials — orientation for anyone new to the KUKO WAY practice.',
  },
  {
    href: '/practices/feel-better-now',
    title: 'Feel Better Now',
    description: 'Short, targeted practices for immediate relief.',
  },
  {
    href: '/practices/programs/7-days',
    title: '7 Days',
    description: 'A one-week guided program.',
  },
  {
    href: '/practices/programs/14-days',
    title: '14 Days',
    description: 'A two-week guided program.',
  },
  {
    href: '/practices/programs/28-days',
    title: '28 Days',
    description: 'A four-week guided program for deeper practice.',
  },
  {
    href: '/practices/library',
    title: 'Library',
    description: 'Every practice, browsable and searchable.',
  },
];

// Practices is the core personal experience: Practices → category →
// practice/program → practice session. This page is the "category" level —
// it deliberately does not attempt any recommendation logic yet.
export default function PracticesPage() {
  return (
    <Container className="flex flex-col gap-8 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Practices</h1>
        <p className="mt-1 text-sm text-ink-500">Your personal practice space — start anywhere below.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <Link key={cat.href} href={cat.href}>
            <Card className="h-full transition-shadow hover:shadow-soft">
              <CardContent className="flex h-full flex-col gap-2">
                <Badge tone="brand" className="w-fit">
                  Practices
                </Badge>
                <h2 className="text-base font-semibold text-ink-900">{cat.title}</h2>
                <p className="text-sm text-ink-500">{cat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
