import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withErrorHandling, jsonOk, Errors, ApiError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { getVisibleProgram } from '@/modules/programs/service';
import { hasProgramAccess } from '@/modules/commerce/entitlements.service';
import { completeProgramItem, ProgramProgressError } from '@/modules/programs/progress.service';

// Marks one program item as done for the signed-in user. Order of checks:
// session → program exists → access (entitlement boundary) → item exists and
// its day is open (no skipping ahead). Idempotent.
export async function POST(_req: Request, { params }: { params: { slug: string; itemId: string } }) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();

    if (!checkRateLimit(`program-item:${session.user.id}`, 60, 60_000)) {
      throw Errors.tooManyRequests();
    }

    const program = getVisibleProgram(params.slug);
    if (!program) throw Errors.notFound('Program not found');
    if (!(await hasProgramAccess(session.user, program.slug))) throw Errors.forbidden();

    try {
      const { completedItemIds, programComplete } = await completeProgramItem(session.user.id, program, params.itemId);
      return jsonOk({ completed: true, completedCount: completedItemIds.size, programComplete });
    } catch (err) {
      if (err instanceof ProgramProgressError) {
        if (err.code === 'DAY_LOCKED') throw new ApiError(403, 'DAY_LOCKED', 'This day is not open yet');
        throw Errors.notFound('Item not found');
      }
      throw err;
    }
  });
}
