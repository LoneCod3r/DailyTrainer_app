import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { practiceSummaryQuerySchema } from '@/lib/validations/practice';
import { getPracticeSummary } from '@/modules/kuko-way/progress.service';

// The signed-in user's own practice totals. `today` is the device's calendar
// day (the server can't know the user's timezone) — validated to be a real,
// plausible date, and only used to anchor the streak.
export async function GET(req: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();

    const { today } = practiceSummaryQuerySchema.parse({ today: new URL(req.url).searchParams.get('today') ?? '' });
    return jsonOk(await getPracticeSummary(session.user.id, today));
  });
}
