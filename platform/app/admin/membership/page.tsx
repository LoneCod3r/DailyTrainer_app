import { listAllPlans } from '@/modules/membership/membership.service';
import { MembershipPlansTable } from '@/components/admin/MembershipPlansTable';

export default async function AdminMembershipPage() {
  const plans = await listAllPlans();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Membership plans</h1>
        <p className="text-sm text-ink-500">
          Each plan is backed by a Stripe Product/Price (Test Mode). Changing the price creates a new Stripe Price
          and archives the old one.
        </p>
      </div>
      <MembershipPlansTable initialPlans={plans} />
    </div>
  );
}
