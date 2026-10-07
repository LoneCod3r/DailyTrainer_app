import { listActivePlans } from '@/modules/membership/membership.service';
import { withErrorHandling, jsonOk } from '@/lib/api-response';
import { features } from '@/lib/features';

// Public — the pricing page needs this without requiring a session. While
// membership sales are closed (lib/features.ts) no plan is offered, so the
// legacy plan is never exposed as a current product.
export async function GET() {
  return withErrorHandling(async () => {
    if (!features.membershipSales) return jsonOk({ plans: [] });
    const plans = await listActivePlans();
    return jsonOk({ plans });
  });
}
