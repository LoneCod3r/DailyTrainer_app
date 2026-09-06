// Real seed/content data this suite asserts against — see prisma/seed.ts,
// modules/discussions, modules/courses/content, modules/events/content and
// modules/kuko-way/content. Nothing here is invented: every slug/category
// below exists in the current codebase's demo data.

export const DEMO_USER = {
  email: 'member@example.dev',
  password: 'DevPassword123!',
  name: 'Demo Member',
};

export const AUTH_STORAGE_STATE = 'tests/e2e/.auth/member.json';

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
