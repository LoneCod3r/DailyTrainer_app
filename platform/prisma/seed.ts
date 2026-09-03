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
    update: {},
    create: {
      email,
      name,
      role,
      status: 'ACTIVE',
      passwordHash,
      profile: { create: { bio: `Demo ${role.toLowerCase()} account — development seed data.` } },
    },
  });
}

async function main() {
  console.log('Seeding development data...');

  const admin = await upsertUser('admin@example.dev', 'Demo Admin', 'ADMIN');
  await upsertUser('moderator@example.dev', 'Demo Moderator', 'MODERATOR');
  await upsertUser('member@example.dev', 'Demo Member', 'USER');

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
      body: 'Lorem ipsum placeholder body text.',
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
      body: 'Lorem ipsum placeholder body text.',
      status: 'PUBLISHED',
      publishedAt: new Date(Date.now() - 86_400_000),
      authorId: admin.id,
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
