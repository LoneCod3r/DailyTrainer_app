import { forgotPasswordSchema } from '@/lib/validations/auth';
import { requestPasswordReset } from '@/modules/auth/auth.service';
import { withErrorHandling, jsonOk } from '@/lib/api-response';

// Always responds with the same generic message whether or not the address
// is registered — see modules/auth/auth.service.ts requestPasswordReset.
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);
    await requestPasswordReset(email, ip);
    return jsonOk({ message: "If an account with that email exists, we've sent a password reset link." });
  });
}
