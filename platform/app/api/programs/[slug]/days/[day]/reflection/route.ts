import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withErrorHandling, jsonOk, Errors, ApiError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { programReflectionSchema } from '@/lib/validations/practice';
import { getVisibleProgram } from '@/modules/programs/service';
import { hasProgramAccess } from '@/modules/commerce/entitlements.service';
import { saveDayReflection, ProgramProgressError } from '@/modules/programs/progress.service';

// Saves (creates or replaces) the signed-in user's private NOTICE reflection
// for one open program day.
export async function PUT(req: Request, { params }: { params: { slug: string; day: string } }) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();

    if (!checkRateLimit(`program-reflection:${session.user.id}`, 30, 60_000)) {
      throw Errors.tooManyRequests();
    }

    const program = getVisibleProgram(params.slug);
    const day = Number(params.day);
    if (!program || !Number.isInteger(day) || day < 1) throw Errors.notFound('Program day not found');
    if (!(await hasProgramAccess(session.user, program.slug))) throw Errors.forbidden();

    const input = programReflectionSchema.parse(await req.json());
    try {
      await saveDayReflection(session.user.id, program, day, input);
      return jsonOk({ saved: true });
    } catch (err) {
      if (err instanceof ProgramProgressError) {
        if (err.code === 'DAY_LOCKED') throw new ApiError(403, 'DAY_LOCKED', 'This day is not open yet');
        throw Errors.notFound('Program day not found');
      }
      throw err;
    }
  });
}
