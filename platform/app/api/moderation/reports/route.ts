import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listOpenReports, listReportHistory } from '@/modules/moderation/moderation.service';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { requireRole } from '@/lib/auth-guards';

// Moderator+ only — server-side enforced regardless of what the client UI
// shows (Prompt §"SECURITY / AUTHORIZATION").
export async function GET(req: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    requireRole(session.user.role, 'MODERATOR');

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope');

    const reports = scope === 'history' ? await listReportHistory() : await listOpenReports();
    return jsonOk({ reports });
  });
}
