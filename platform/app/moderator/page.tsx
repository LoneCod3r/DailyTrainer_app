import { redirect } from 'next/navigation';

// Friendly alias for the canonical moderator area. All auth/role checks
// live in app/moderation/layout.tsx — this route intentionally has none of
// its own, so behavior for anonymous/USER/MODERATOR/ADMIN stays identical
// to visiting /moderation directly.
export default function ModeratorAliasPage() {
  redirect('/moderation');
}
