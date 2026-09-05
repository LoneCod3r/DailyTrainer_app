import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Container, Card, CardContent, Badge, Button, EmptyState } from '@/components/ui';
import { listPublishedContent } from '@/modules/content/content.service';

// Home answers one question: "what should I do today?" Every section below
// is a structural placeholder except "Latest KUKO WAY information", which
// already has a real content source (modules/content) to read from.
// Recommendation/progress logic is intentionally not implemented yet.
export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const latest = await listPublishedContent({ limit: 3 });

  const firstName = session?.user?.name?.split(' ')[0];

  return (
    <Container className="flex flex-col gap-10 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">{firstName ? `Welcome back, ${firstName}` : 'Welcome'}</h1>
        <p className="mt-1 text-sm text-ink-500">Here&apos;s what&apos;s on your practice today.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Badge tone="brand">Today&apos;s practice</Badge>
              <Badge tone="neutral">Placeholder</Badge>
            </div>
            <h2 className="text-lg font-semibold text-ink-900">Your recommended practice will appear here</h2>
            <p className="text-sm text-ink-500">
              Once practice recommendations are built, this card will suggest a session based on your program and
              progress.
            </p>
            <div>
              <Link href="/practices/start-here">
                <Button>Browse Start Here</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <Badge tone="neutral">Placeholder</Badge>
            <h2 className="text-base font-semibold text-ink-900">Continue your program</h2>
            <p className="text-sm text-ink-500">You don&apos;t have an active program yet.</p>
            <div>
              <Link href="/practices" className="text-sm font-medium text-brand-700 hover:underline">
                Choose a program →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3">
            <Badge tone="neutral">Placeholder</Badge>
            <h2 className="text-base font-semibold text-ink-900">Quick practice</h2>
            <p className="text-sm text-ink-500">A short session for whenever you have a few spare minutes.</p>
            <div>
              <Link href="/practices/feel-better-now">
                <Button variant="secondary">Feel Better Now</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <Badge tone="neutral">Placeholder</Badge>
            <h2 className="text-base font-semibold text-ink-900">Your progress</h2>
            <div className="flex gap-6">
              <div>
                <p className="text-xl font-semibold text-ink-900">—</p>
                <p className="text-xs text-ink-500">Day streak</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-ink-900">—</p>
                <p className="text-xs text-ink-500">Sessions completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink-900">Latest KUKO WAY information</h2>
          <Link href="/practices/library" className="text-sm font-medium text-brand-700 hover:underline">
            View library
          </Link>
        </div>
        {latest.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {latest.map((item) => (
              <Card key={item.id}>
                <CardContent>
                  <Badge tone="neutral" className="mb-2">
                    {item.type}
                  </Badge>
                  <h3 className="font-medium text-ink-900">{item.title}</h3>
                  {item.excerpt && <p className="mt-1 line-clamp-2 text-sm text-ink-500">{item.excerpt}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No articles published yet"
            description="Educational KUKO WAY content will appear here once it's published from the admin panel."
          />
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-ink-900">Upcoming member meeting</h2>
        <EmptyState
          title="No meeting scheduled yet"
          description="Live member meetings will show up here once the Community module schedules one."
          action={
            <Link href="/community/meetings" className="text-sm font-medium text-brand-700 hover:underline">
              View meetings →
            </Link>
          }
        />
      </section>
    </Container>
  );
}
