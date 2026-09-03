import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProfileByUserId, upsertProfile } from '@/modules/profiles/profiles.service';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { updateProfileSchema } from '@/lib/validations/users';

export async function GET() {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();

    const profile = await getProfileByUserId(session.user.id);
    return jsonOk({ profile });
  });
}

export async function PATCH(req: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();

    const body = await req.json();
    const input = updateProfileSchema.parse(body);
    const profile = await upsertProfile(session.user.id, input);
    return jsonOk({ profile });
  });
}
