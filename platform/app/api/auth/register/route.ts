import { NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations/auth';
import { registerUser } from '@/modules/auth/auth.service';
import { withErrorHandling, jsonOk } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { Errors } from '@/lib/api-response';

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    if (!checkRateLimit(`register:${ip}`, 10, 60_000)) {
      throw Errors.tooManyRequests();
    }

    const body = await req.json();
    const input = registerSchema.parse(body);
    const user = await registerUser(input);
    return jsonOk({ user }, 201);
  });
}
