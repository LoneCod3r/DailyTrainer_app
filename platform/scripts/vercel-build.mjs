// Vercel build entry point. Vercel runs the `vercel-build` npm script instead
// of `build` when it exists, so this only ever runs on Vercel — local builds
// and CI keep using plain `next build`.
//
// Production builds apply pending Prisma migrations first, using
// `prisma migrate deploy` (never `migrate dev` / `migrate reset`): it only
// runs committed migrations that haven't been applied yet, never generates
// new ones and never drops data. Running it here is the only place the real
// DATABASE_URL is available (it is stored as a Sensitive variable, so it
// can't be pulled to a developer machine). If a migration fails, the build
// fails and the previous deployment stays live.
//
// Preview/development builds skip migrations so they can never touch the
// production database.
//
// Migrations need a direct (non-pooled) connection. If DATABASE_URL is a
// pooled URL (e.g. a Neon "-pooler" host), set DIRECT_DATABASE_URL to the
// direct one; it is used for the migration step only.
import { execSync } from 'node:child_process';

function run(command, env = process.env) {
  console.log(`> ${command}`);
  execSync(command, { stdio: 'inherit', env });
}

if (process.env.VERCEL_ENV === 'production') {
  const migrationUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!migrationUrl) {
    console.error('DATABASE_URL is not set for the Production environment; refusing to build without a database.');
    process.exit(1);
  }
  run('npx prisma migrate deploy', { ...process.env, DATABASE_URL: migrationUrl });
} else {
  console.log(`Skipping prisma migrate deploy (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unset'}).`);
}

run('npx next build');
