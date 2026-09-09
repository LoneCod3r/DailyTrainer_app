import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createReport } from '@/modules/moderation/moderation.service';
import { createReportSchema } from '@/lib/validations/moderation';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { requireVerifiedUser } from '@/lib/auth-guards';

// Any verified member can file a report against a discussion or reply — the
// entry point moderators' queue depends on. Reporting itself never mutates
// the content; it only creates a Report for a moderator to review.
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    requireVerifiedUser(session.user);

    if (!checkRateLimit(`report:create:${session.user.id}`, 10, 60_000)) {
      throw Errors.tooManyRequests();
    }

    const body = await req.json();
    const input = createReportSchema.parse(body);
    const report = await createReport({ ...input, reporterId: session.user.id });
    return jsonOk({ report }, 201);
  });
}
