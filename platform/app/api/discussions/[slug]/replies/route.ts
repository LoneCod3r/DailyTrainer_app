import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createReply } from '@/modules/discussions/discussions.service';
import { createReplySchema } from '@/lib/validations/discussions';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { requireVerifiedUser } from '@/lib/auth-guards';

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    requireVerifiedUser(session.user);

    if (!checkRateLimit(`reply:create:${session.user.id}`, 20, 60_000)) {
      throw Errors.tooManyRequests();
    }

    const body = await req.json();
    const input = createReplySchema.parse(body);

    try {
      const reply = await createReply({ discussionSlug: params.slug, body: input.body, authorId: session.user.id });
      return jsonOk({ reply }, 201);
    } catch (err) {
      const message = (err as Error).message;
      if (message === 'Discussion not found') throw Errors.notFound(message);
      if (message === 'Discussion is locked') throw Errors.forbidden(message);
      throw err;
    }
  });
}
