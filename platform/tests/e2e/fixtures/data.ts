// Real seed/content data this suite asserts against — see prisma/seed.ts,
// modules/discussions, modules/courses/content, modules/events/content and
// modules/kuko-way/content. Nothing here is invented: every slug/category
// below exists in the current codebase's demo data.

// Seeded demo accounts share one password, supplied via SEED_DEMO_PASSWORD
// (never hard-coded — see prisma/seed.ts). playwright.config.ts loads it from
// .env; it must match the value the database was seeded with.
const DEMO_ACCOUNT_PASSWORD = (() => {
  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password) {
    throw new Error('SEED_DEMO_PASSWORD is not set — use the same value prisma/seed.ts seeded the database with.');
  }
  return password;
})();

export const DEMO_USER = {
  email: 'member@example.dev',
  password: DEMO_ACCOUNT_PASSWORD,
  name: 'Demo Member',
};

export const AUTH_STORAGE_STATE = 'tests/e2e/.auth/member.json';

// Seeded MODERATOR account (prisma/seed.ts) — used only by
// moderator-boundary.spec.ts to verify the Moderator vs Admin permission
// boundary. Logs in fresh in that spec rather than via a shared storageState
// setup project, since it's the only spec that needs this identity.
export const MODERATOR_USER = {
  email: 'moderator@example.dev',
  password: DEMO_ACCOUNT_PASSWORD,
  name: 'Demo Moderator',
};

// Seeded ADMIN account (prisma/seed.ts) — used only by
// moderator-boundary.spec.ts to confirm Admin's financial/admin access is
// unaffected by the Moderator boundary.
export const ADMIN_USER = {
  email: 'admin@example.dev',
  password: DEMO_ACCOUNT_PASSWORD,
  name: 'Demo Admin',
};

// Discussion moderation states (prisma/seed.ts) — one of each state the app
// actually renders differently for.
export const SEEDED_DISCUSSIONS = {
  withReply: 'how-did-you-start-your-daily-practice',
  noReplies: 'when-is-the-next-28-day-program-update',
  locked: 'feedback-on-the-new-design',
  pending: 'draft-question-about-kuko-way',
  hidden: 'removed-off-topic-post',
};

// modules/courses/content/courses.ts
export const COURSE = {
  slug: 'foundations-of-practice',
  title: 'Foundations of Practice',
  moduleSlug: 'getting-grounded',
  firstLessonSlug: 'why-consistency-matters',
  secondLessonSlug: 'choosing-your-time',
};

// modules/events/content/meetings.ts (dates generated relative to "now")
export const MEETINGS = {
  upcoming: 'community-open-qa',
  cancelled: 'members-open-forum',
  past: 'welcome-session',
};

// Seeded via prisma/seed.ts ContentItem rows
export const BLOG = {
  featured: 'sample-article-one',
  other: 'sample-article-two',
};

// modules/kuko-way/content/practices.ts — has `instructions`, so
// MarkCompleteButton renders on its detail page.
export const PRACTICE_WITH_INSTRUCTIONS = 'body-scan-1';

// modules/kuko-way/content/start-here.ts — first section
export const START_HERE_FIRST_SLUG = 'vavedenie';
