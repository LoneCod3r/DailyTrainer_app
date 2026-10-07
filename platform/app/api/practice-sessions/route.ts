import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { recordPracticeSessionSchema } from '@/lib/validations/practice';
import { isTrackablePractice } from '@/modules/kuko-way/service';
import { recordPracticeSession } from '@/modules/kuko-way/progress.service';

// Records one completed practice (with optional before/after check-ins) for
// the signed-in user. Private, personal data — no email-verification gate,
// since nothing here is visible to anyone else (unlike posting to
// Discussions). Idempotent on the client-generated `clientId`.
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();

    if (!checkRateLimit(`practice-session:${session.user.id}`, 30, 60_000)) {
      throw Errors.tooManyRequests();
    }

    const input = recordPracticeSessionSchema.parse(await req.json());
    if (!isTrackablePractice(input.practiceSlug)) throw Errors.notFound('Practice not found');

    const { session: row, created } = await recordPracticeSession(session.user.id, input);
    return jsonOk({ id: row.id, created }, created ? 201 : 200);
  });
}
