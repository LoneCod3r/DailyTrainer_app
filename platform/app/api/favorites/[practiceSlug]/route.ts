import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { getPracticeBySlug } from '@/modules/kuko-way/service';
import { addFavoritePractice, removeFavoritePractice } from '@/modules/kuko-way/progress.service';

// PUT adds, DELETE removes — both idempotent, both scoped to the signed-in
// user. Favorites are private (concept §16 "My favorites").
async function handle(method: 'PUT' | 'DELETE', practiceSlug: string) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();

    if (!checkRateLimit(`favorite:${session.user.id}`, 30, 60_000)) {
      throw Errors.tooManyRequests();
    }
    if (!getPracticeBySlug(practiceSlug)) throw Errors.notFound('Practice not found');

    if (method === 'PUT') await addFavoritePractice(session.user.id, practiceSlug);
    else await removeFavoritePractice(session.user.id, practiceSlug);
    return jsonOk({ favorite: method === 'PUT' });
  });
}

export async function PUT(_req: Request, { params }: { params: { practiceSlug: string } }) {
  return handle('PUT', params.practiceSlug);
}

export async function DELETE(_req: Request, { params }: { params: { practiceSlug: string } }) {
  return handle('DELETE', params.practiceSlug);
}
