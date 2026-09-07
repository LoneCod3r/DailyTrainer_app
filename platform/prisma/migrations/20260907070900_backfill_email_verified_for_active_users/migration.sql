-- Grandfather in accounts that existed before email verification was
-- introduced: any already-ACTIVE user is treated as verified (as of their
-- original createdAt) so this security change doesn't lock out existing
-- users. Only new registrations from this point on require the
-- verification-link flow (see modules/auth/auth.service.ts, lib/auth.ts).
UPDATE "users"
SET "emailVerified" = "createdAt"
WHERE "emailVerified" IS NULL
  AND "status" = 'ACTIVE';
