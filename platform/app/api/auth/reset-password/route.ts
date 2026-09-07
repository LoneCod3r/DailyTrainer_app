import { resetPasswordSchema } from '@/lib/validations/auth';
import { resetPassword } from '@/modules/auth/auth.service';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    if (!checkRateLimit(`reset:confirm:ip:${ip}`, 20, 60_000)) {
      throw Errors.tooManyRequests();
    }

    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);
    await resetPassword(token, password);
    return jsonOk({ reset: true });
  });
}
