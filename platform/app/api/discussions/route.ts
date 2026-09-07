import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createDiscussion } from '@/modules/discussions/discussions.service';
import { createDiscussionSchema } from '@/lib/validations/discussions';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { requireVerifiedUser } from '@/lib/auth-guards';

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    requireVerifiedUser(session.user);

    if (!checkRateLimit(`discussion:create:${session.user.id}`, 5, 60_000)) {
      throw Errors.tooManyRequests();
    }

    const body = await req.json();
    const input = createDiscussionSchema.parse(body);
    const discussion = await createDiscussion({ ...input, authorId: session.user.id });
    return jsonOk({ discussion }, 201);
  });
}
