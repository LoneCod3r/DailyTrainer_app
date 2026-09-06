import { Badge } from '@/components/ui';
import { clsx } from '@/lib/clsx';
import { isProfileVisibleTo } from '@/modules/profiles/profiles.service';
import type { DictKey } from '@/lib/i18n/dictionaries';
import type { Role, ProfileVisibility } from '@prisma/client';

export type PreviewAuthor = {
  id: string;
  name: string | null;
  role: Role;
  profile: { avatarUrl: string | null; bio: string | null; visibility: ProfileVisibility } | null;
};

const ROLE_KEY: Record<Role, DictKey> = {
  USER: 'profile.roleUser',
  MODERATOR: 'profile.roleModerator',
  ADMIN: 'profile.roleAdmin',
};

// A lightweight, privacy-respecting author preview — never exposes email,
// billing, or other private account data. Bio only renders when the
// author's own visibility setting allows this viewer to see it.
export function UserProfilePreview({
  author,
  viewer,
  t,
  size = 'md',
  className,
}: {
  author: PreviewAuthor;
  viewer: { id: string } | null;
  t: (key: DictKey) => string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const displayName = author.name ?? t('profile.roleUser');
  const initial = displayName.trim().charAt(0).toUpperCase() || '?';
  const avatarSize = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';

  const hasBio = Boolean(author.profile?.bio);
  const bioVisible =
    hasBio && author.profile
      ? isProfileVisibleTo({ userId: author.id, visibility: author.profile.visibility }, viewer)
      : false;

  return (
    <div className={clsx('flex min-w-0 items-center gap-3', className)}>
      {author.profile?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={author.profile.avatarUrl}
          alt=""
          className={clsx('shrink-0 rounded-full object-cover', avatarSize)}
        />
      ) : (
        <div
          aria-hidden="true"
          className={clsx(
            'flex shrink-0 items-center justify-center rounded-full bg-brand-tint font-semibold text-link',
            avatarSize,
          )}
        >
          {initial}
        </div>
      )}
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2">
          <span className={clsx('truncate font-medium text-ink-900', size === 'sm' ? 'text-sm' : 'text-sm')}>
            {displayName}
          </span>
          {author.role !== 'USER' && <Badge tone="neutral">{t(ROLE_KEY[author.role])}</Badge>}
        </div>
        {hasBio && (
          <p className="truncate text-xs text-ink-500">{bioVisible ? author.profile!.bio : t('profile.bioHidden')}</p>
        )}
      </div>
    </div>
  );
}
