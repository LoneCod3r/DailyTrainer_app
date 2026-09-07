import { generateMathChallenge } from '@/lib/math-challenge';
import { withErrorHandling, jsonOk } from '@/lib/api-response';

// Returns { challengeId, question } — never the answer. POST (not GET)
// because every call creates a new row and burns a bit of rate-limit
// budget; a GET with that side effect would be a step outside HTTP
// semantics and risk being prefetched/cached.
export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    const challenge = await generateMathChallenge(ip);
    return jsonOk(challenge);
  });
}
