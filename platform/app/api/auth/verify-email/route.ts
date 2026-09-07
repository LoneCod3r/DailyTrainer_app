import { verifyEmailSchema } from '@/lib/validations/auth';
import { verifyEmail } from '@/modules/auth/auth.service';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';

// Confirms a verification link. Deliberately POST (not the GET the link
// itself navigates to) so the raw token lives only in a request body, never
// in server access logs or Referer headers — the client-rendered
// /verify-email page reads the token out of its own URL and POSTs it here.
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    // Tokens are 256 bits of entropy — this only slows down naive guessing,
    // it isn't the actual defense.
    if (!checkRateLimit(`verify:confirm:ip:${ip}`, 20, 60_000)) {
      throw Errors.tooManyRequests();
    }

    const body = await req.json();
    const { token } = verifyEmailSchema.parse(body);
    await verifyEmail(token);
    return jsonOk({ verified: true });
  });
}
