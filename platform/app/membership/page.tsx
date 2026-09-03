import { Container, Card, CardContent, Badge, EmptyState } from '@/components/ui';
import { listActivePlans } from '@/modules/membership/membership.service';
import { JoinButton } from '@/components/membership/JoinButton';

function formatPrice(amount: number, currency: string, interval: string) {
  const value = (amount / 100).toLocaleString(undefined, { style: 'currency', currency: currency.toUpperCase() });
  return `${value} / ${interval}`;
}

export default async function MembershipPage() {
  const plans = await listActivePlans();

  return (
    <Container className="flex flex-col gap-8 py-10">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-ink-900">Membership</h1>
        <p className="mt-1 text-sm text-ink-500">
          Join the community with a membership plan. Pricing is set by the team and can change at any time.
        </p>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          title="No membership plans available yet"
          description="Plans will appear here once the admin team publishes one."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-4">
                <div>
                  <Badge tone="brand">Membership</Badge>
                  <h2 className="mt-2 text-lg font-semibold text-ink-900">{plan.name}</h2>
                  {plan.description && <p className="mt-1 text-sm text-ink-500">{plan.description}</p>}
                </div>
                <p className="text-2xl font-semibold text-ink-900">
                  {formatPrice(plan.amount, plan.currency, plan.interval)}
                </p>
                <div className="mt-auto">
                  <JoinButton membershipPlanId={plan.id} disabled={!plan.stripePriceId} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
