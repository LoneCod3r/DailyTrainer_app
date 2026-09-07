import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createLogger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/validations/auth';

const log = createLogger('auth');

// Coarse, IP-keyed volumetric guard against credential-stuffing across many
// accounts from one source — resets quickly since it's meant to catch bursts,
// not a single retrying human. The per-account lockout below is the real
// brute-force defense and is what actually protects a given account.
const LOGIN_IP_LIMIT = 20;
const LOGIN_IP_WINDOW_MS = 5 * 60_000;

const LOGIN_LOCKOUT_THRESHOLD = 5;
const LOGIN_LOCKOUT_DURATION_MS = 15 * 60_000;

// Credentials (email + password) provider today; mature OAuth providers
// (Google, etc.) can be added to this `providers` array later without
// touching the rest of the app, since everything reads from `session.user`.
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw, req) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase();

        const ip = (req?.headers?.['x-forwarded-for'] as string | undefined) ?? 'unknown';
        if (!checkRateLimit(`login:ip:${ip}`, LOGIN_IP_LIMIT, LOGIN_IP_WINDOW_MS)) {
          log.warn('login blocked: IP rate limit exceeded', { ip });
          throw new Error('RATE_LIMITED');
        }

        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user || !user.passwordHash) {
          log.warn('login failed: no such user', { email: normalizedEmail });
          return null;
        }

        // Per-account brute-force lockout — persists in the database (unlike
        // the in-memory IP limiter above) so it survives restarts and can't
        // be sidestepped by attacking from many IPs.
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          log.warn('login blocked: account temporarily locked', { userId: user.id });
          throw new Error('ACCOUNT_LOCKED');
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          const attempts = user.failedLoginAttempts + 1;
          const lockingNow = attempts >= LOGIN_LOCKOUT_THRESHOLD;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: lockingNow ? 0 : attempts,
              lockedUntil: lockingNow ? new Date(Date.now() + LOGIN_LOCKOUT_DURATION_MS) : null,
            },
          });
          log.warn('login failed: bad password', { userId: user.id, attempts });
          return null;
        }

        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          });
        }

        if (user.status !== 'ACTIVE') {
          log.warn('login blocked: inactive/suspended account', { userId: user.id, status: user.status });
          return null;
        }

        // Unverified accounts ARE allowed to sign in — session.user.emailVerified
        // carries the state through so the UI can prompt for verification, and
        // lib/auth-guards.ts blocks the specific member actions server-side
        // that require it. Blocking login entirely here would just replace one
        // dead end with another and give unverified users no way to reach the
        // "resend verification" flow from an authenticated context.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        token.emailVerified = user.emailVerified;
        return token;
      }

      // No `user` means this is a follow-up request reusing an
      // already-issued JWT, not a fresh sign-in — re-read the current
      // values from the database so a change made mid-session (most
      // notably: verifying the email, which registration's auto-sign-in
      // means happens *after* the JWT already exists) is reflected without
      // requiring the user to sign out and back in. A cheap, indexed
      // lookup by id; only skipped if the account was deleted, in which
      // case the stale token is left as-is (the user is no longer
      // resolvable, so there's nothing fresher to apply).
      if (token.id) {
        const current = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true, status: true, emailVerified: true },
        });
        if (current) {
          token.role = current.role;
          token.status = current.status;
          token.emailVerified = current.emailVerified;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
  },
};
