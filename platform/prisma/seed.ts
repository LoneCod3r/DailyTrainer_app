// Development seed data (Prompt2 §19). Never use real personal information —
// every account and content item here is clearly marked as demo/dev data.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEV_PASSWORD = 'DevPassword123!';

async function upsertUser(email: string, name: string, role: 'ADMIN' | 'MODERATOR' | 'USER') {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12);
  return prisma.user.upsert({
    where: { email },
    // Re-verify on every reseed, in case a previous test run consumed this
    // demo account's verification (e.g. the reset-password e2e flow).
    update: { emailVerified: new Date() },
    create: {
      email,
      name,
      role,
      status: 'ACTIVE',
      // Seeded demo accounts are trusted dev fixtures, not real signups —
      // grandfathered in as already verified so they can log in immediately
      // (see lib/auth.ts, which refuses login until emailVerified is set).
      emailVerified: new Date(),
      passwordHash,
      profile: { create: { bio: `Demo ${role.toLowerCase()} account — development seed data.` } },
    },
  });
}

async function main() {
  console.log('Seeding development data...');

  const admin = await upsertUser('admin@example.dev', 'Demo Admin', 'ADMIN');
  const moderator = await upsertUser('moderator@example.dev', 'Demo Moderator', 'MODERATOR');
  const member = await upsertUser('member@example.dev', 'Demo Member', 'USER');

  await prisma.contentItem.upsert({
    where: { slug: 'welcome-to-the-platform' },
    update: {},
    create: {
      type: 'ANNOUNCEMENT',
      title: '[Placeholder] Welcome to the platform',
      slug: 'welcome-to-the-platform',
      excerpt: 'This is placeholder announcement content used during development.',
      body: 'Replace this with a real announcement from the admin panel once the Content module is extended.',
      status: 'PUBLISHED',
      pinned: true,
      publishedAt: new Date(),
      authorId: admin.id,
    },
  });

  await prisma.contentItem.upsert({
    where: { slug: 'sample-article-one' },
    update: {},
    create: {
      type: 'ARTICLE',
      title: '[Placeholder] Getting started with the community',
      slug: 'sample-article-one',
      excerpt: 'Placeholder article content — replace via the admin panel.',
      body: 'Lorem ipsum placeholder body text. This article walks through the basics of finding your way around Discussions, Courses and Member Meetings.',
      category: 'community',
      status: 'PUBLISHED',
      featured: true,
      publishedAt: new Date(),
      authorId: admin.id,
    },
  });

  await prisma.contentItem.upsert({
    where: { slug: 'sample-article-two' },
    update: {},
    create: {
      type: 'ARTICLE',
      title: '[Placeholder] A second sample article',
      slug: 'sample-article-two',
      excerpt: 'Another placeholder article for development purposes.',
      body: 'Lorem ipsum placeholder body text discussing how a daily practice habit tends to form over the first few weeks.',
      category: 'practices',
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 86_400_000),
      authorId: admin.id,
    },
  });

  await prisma.contentItem.upsert({
    where: { slug: 'sample-article-three' },
    update: {},
    create: {
      type: 'ARTICLE',
      title: '[Placeholder] Notes on the 7/14/28-day structure',
      slug: 'sample-article-three',
      excerpt: 'Placeholder article for development purposes — a look at how the program lengths differ.',
      body: 'Lorem ipsum placeholder body text comparing the 7, 14 and 28-day programs and who each one tends to suit.',
      category: 'programs',
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 2 * 86_400_000),
      authorId: admin.id,
    },
  });

  await prisma.contentItem.upsert({
    where: { slug: 'sample-article-four' },
    update: {},
    create: {
      type: 'ARTICLE',
      title: '[Placeholder] Announcing Member Meetings',
      slug: 'sample-article-four',
      excerpt: 'Placeholder article for development purposes — introducing the Member Meetings area.',
      body: 'Lorem ipsum placeholder body text introducing live community meetings and how to find upcoming sessions.',
      category: 'community',
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 4 * 86_400_000),
      authorId: admin.id,
    },
  });

  // --- Discussions (Day 3) — demo/dev data illustrating each moderation
  // state described in modules/discussions. Never real community activity.
  const discussionRootQuestion = await prisma.discussion.upsert({
    where: { slug: 'how-did-you-start-your-daily-practice' },
    update: {},
    create: {
      slug: 'how-did-you-start-your-daily-practice',
      title: '[Demo] How did you start your daily practice?',
      body: 'Placeholder discussion — curious how other members built a consistent daily practice habit. What worked for you?',
      category: 'GENERAL',
      status: 'PUBLISHED',
      authorId: member.id,
      lastActivityAt: new Date(),
    },
  });
  await prisma.discussionReply.upsert({
    where: { id: 'seed-reply-daily-practice-1' },
    update: {},
    create: {
      id: 'seed-reply-daily-practice-1',
      discussionId: discussionRootQuestion.id,
      authorId: moderator.id,
      body: 'Placeholder reply — starting with just a few minutes right after waking up made the biggest difference for me.',
    },
  });

  await prisma.discussion.upsert({
    where: { slug: 'when-is-the-next-28-day-program-update' },
    update: {},
    create: {
      slug: 'when-is-the-next-28-day-program-update',
      title: '[Demo] When is the next 28-day program update?',
      body: 'Placeholder discussion with no replies yet — used to demonstrate the "be the first to reply" empty state.',
      category: 'PROGRAMS',
      status: 'PUBLISHED',
      authorId: member.id,
    },
  });

  const lockedDiscussion = await prisma.discussion.upsert({
    where: { slug: 'feedback-on-the-new-design' },
    update: {},
    create: {
      slug: 'feedback-on-the-new-design',
      title: '[Demo] Feedback on the new design',
      body: 'Placeholder discussion — this thread collected feedback and has since been locked by a moderator.',
      category: 'COMMUNITY',
      status: 'PUBLISHED',
      locked: true,
      authorId: member.id,
    },
  });
  await prisma.discussionReply.upsert({
    where: { id: 'seed-reply-design-feedback-1' },
    update: {},
    create: {
      id: 'seed-reply-design-feedback-1',
      discussionId: lockedDiscussion.id,
      authorId: admin.id,
      body: 'Placeholder reply — thanks for the feedback, closing this thread now that changes have shipped.',
    },
  });

  await prisma.discussion.upsert({
    where: { slug: 'draft-question-about-kuko-way' },
    update: {},
    create: {
      slug: 'draft-question-about-kuko-way',
      title: '[Demo] Draft question about KUKO WAY',
      body: 'Placeholder discussion awaiting moderation review — only visible to its author and moderators.',
      category: 'KUKO_WAY',
      status: 'PENDING',
      authorId: member.id,
    },
  });

  await prisma.discussion.upsert({
    where: { slug: 'removed-off-topic-post' },
    update: {},
    create: {
      slug: 'removed-off-topic-post',
      title: '[Demo] Off-topic post',
      body: 'Placeholder discussion hidden from ordinary members by a moderator — only visible to the author and moderators.',
      category: 'GENERAL',
      status: 'HIDDEN',
      authorId: member.id,
    },
  });

  console.log('Seed complete.');
  console.log('Demo accounts (development only — do not use in production):');
  console.log('  admin@example.dev / moderator@example.dev / member@example.dev');
  console.log(`  password: ${DEV_PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
