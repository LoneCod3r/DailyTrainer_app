import { listActivePlans } from '@/modules/membership/membership.service';
import { withErrorHandling, jsonOk } from '@/lib/api-response';

// Public — the pricing page needs this without requiring a session.
export async function GET() {
  return withErrorHandling(async () => {
    const plans = await listActivePlans();
    return jsonOk({ plans });
  });
}
