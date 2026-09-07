import { resendVerificationSchema } from '@/lib/validations/auth';
import { resendVerificationEmail } from '@/modules/auth/auth.service';
import { withErrorHandling, jsonOk } from '@/lib/api-response';

// Always responds with the same generic message regardless of whether the
// address is registered or already verified — see
// modules/auth/auth.service.ts resendVerificationEmail for the rate limiting
// and the enumeration-safe behavior itself.
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const body = await req.json();
    const { email } = resendVerificationSchema.parse(body);
    await resendVerificationEmail(email, ip);
    return jsonOk({ message: "If an account with that email exists and needs verifying, we've sent a new link." });
  });
}
