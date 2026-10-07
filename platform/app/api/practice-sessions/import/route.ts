import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { importDeviceCompletionsSchema } from '@/lib/validations/practice';
import { isTrackablePractice } from '@/modules/kuko-way/service';
import { importDeviceCompletions } from '@/modules/kuko-way/progress.service';

// One-time merge of completions recorded on this device before sign-in
// (lib/local-progress.ts). Idempotent — see importDeviceCompletions — so a
// repeat from another tab or a retry never double-counts. Unknown slugs are
// skipped rather than failing the whole import.
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();

    if (!checkRateLimit(`practice-import:${session.user.id}`, 5, 60_000)) {
      throw Errors.tooManyRequests();
    }

    const { completions, today } = importDeviceCompletionsSchema.parse(await req.json());
    const known = completions.filter((c) => isTrackablePractice(c.practiceSlug));
    const result = await importDeviceCompletions(session.user.id, known, today);
    return jsonOk(result);
  });
}
