import { NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations/auth';
import { registerUser } from '@/modules/auth/auth.service';
import { withErrorHandling, jsonOk } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { Errors } from '@/lib/api-response';

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    // Coarse volumetric guard, not the primary defense — CAPTCHA (verified
    // server-side in registerUser) and the honeypot/timing check are.
    // Kept generous enough that it's not the first thing a burst of
    // legitimate signups from behind one NAT/proxy IP hits.
    if (!checkRateLimit(`register:${ip}`, 20, 60_000)) {
      throw Errors.tooManyRequests();
    }

    const body = await req.json();
    const input = registerSchema.parse(body);
    const user = await registerUser(input, { ip });
    return jsonOk({ user }, 201);
  });
}
