import Link from 'next/link';
import { Container, Card, CardContent, Badge, Button, EmptyState } from '@/components/ui';
import { PlaceholderSection } from '@/components/home/PlaceholderSection';
import { getFeaturedContent, listPublishedContent, getPinnedAnnouncements } from '@/modules/content/content.service';
import { getSettings } from '@/modules/settings/settings.service';

export default async function HomePage() {
  const [featured, latest, announcements, settings] = await Promise.all([
    getFeaturedContent(),
    listPublishedContent({ limit: 4 }),
    getPinnedAnnouncements(3),
    getSettings(),
  ]);

  return (
    <div className="flex flex-col gap-16 py-10">
      {/* --- Featured content hero -------------------------------------- */}
      <Container>
        {featured ? (
          <Card className="overflow-hidden">
            <div className="grid gap-0 md:grid-cols-2">
              <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-brand-100 to-sand-100 text-ink-300 md:aspect-auto">
                Featured image
              </div>
              <CardContent className="flex flex-col justify-center gap-3 p-8">
                <Badge tone="brand">Featured</Badge>
                <h1 className="text-2xl font-semibold text-ink-900">{featured.title}</h1>
                {featured.excerpt && <p className="text-ink-500">{featured.excerpt}</p>}
                <div className="mt-2">
                  <Button size="md">Read more</Button>
                </div>
              </CardContent>
            </div>
          </Card>
        ) : (
          <Card className="border-dashed bg-sand-50/50">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Badge tone="neutral">Placeholder</Badge>
              <h1 className="text-2xl font-semibold text-ink-900">{settings.appName}</h1>
              <p className="max-w-lg text-sm text-ink-500">
                This large featured area will highlight your top article, announcement, or event once content is
                published from the admin panel.
              </p>
            </CardContent>
          </Card>
        )}
      </Container>

      {/* --- Pinned announcements ---------------------------------------- */}
      {announcements.length > 0 && (
        <Container className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-ink-900">Announcements</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {announcements.map((a) => (
              <Card key={a.id}>
                <CardContent>
                  <Badge tone="warning" className="mb-2">
                    Pinned
                  </Badge>
                  <h3 className="font-medium text-ink-900">{a.title}</h3>
                  {a.excerpt && <p className="mt-1 text-sm text-ink-500">{a.excerpt}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      )}

      {/* --- Latest information ------------------------------------------- */}
      <Container className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink-900">Latest information</h2>
          <Link href="/articles" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        {latest.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            description="Once the Articles/Blog module is built, the newest posts will appear here automatically."
          />
        )}
      </Container>

      {/* --- Future modules (structural placeholders only) ---------------- */}
      <Container className="flex flex-col gap-16">
        <PlaceholderSection
          title="Upcoming meetings"
          description="Upcoming online and in-person events will be listed here once the Events/Meetings module is built."
        />
        <PlaceholderSection
          title="Featured courses"
          description="Selected courses will appear here once the Courses module is built."
        />
        <PlaceholderSection
          title="Community activity"
          description="Recent discussions will appear here once the Discussions module is built."
        />
      </Container>
    </div>
  );
}
