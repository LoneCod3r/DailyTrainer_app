import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Container, Card, CardContent, Button } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';

// Donation is voluntary support — intentionally kept separate from
// Membership (recurring paid access), both in navigation and visually here.
export default async function DonationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/account/donation');

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader
        eyebrow="Account"
        title="Donation"
        description="Support the KUKO WAY with a one-off or recurring donation — separate from your membership."
      />

      <Card className="max-w-xl border-sand-300 bg-sand-50">
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-ink-500">
            Donations help fund the KUKO WAY beyond membership dues. The donation flow isn&apos;t wired up yet — this
            is a structural placeholder.
          </p>
          <div>
            <Button variant="secondary" disabled>
              Donate — coming soon
            </Button>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
