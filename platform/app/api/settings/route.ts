import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSettings, updateSettings } from '@/modules/settings/settings.service';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { isAdmin } from '@/lib/permissions';
import { updateSettingsSchema } from '@/lib/validations/settings';

// Public GET (Home page and Navbar need the app name/logo/currency), but
// only admins may change settings.
export async function GET() {
  return withErrorHandling(async () => {
    const settings = await getSettings();
    return jsonOk({ settings });
  });
}

export async function PATCH(req: Request) {
  return withErrorHandling(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user) throw Errors.unauthorized();
    if (!isAdmin(session.user.role)) throw Errors.forbidden();

    const body = await req.json();
    const input = updateSettingsSchema.parse(body);
    const settings = await updateSettings(input);
    return jsonOk({ settings });
  });
}
