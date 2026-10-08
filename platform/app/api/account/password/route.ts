import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { changePasswordSchema } from '@/lib/validations/auth';
import { changePassword } from '@/modules/auth/auth.service';

// Change the signed-in user's password. Per-user rate limit: each attempt
// checks a password guess, so a hijacked session can't brute-force the
// current password through this endpoint.
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();

    if (!checkRateLimit(`change-password:user:${session.user.id}`, 5, 15 * 60_000)) {
      throw Errors.tooManyRequests();
    }

    const body = await req.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);
    await changePassword(session.user.id, currentPassword, newPassword);
    return jsonOk({ changed: true });
  });
}
