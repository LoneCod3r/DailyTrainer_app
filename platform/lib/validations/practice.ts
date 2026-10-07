import { z } from 'zod';
import { POST_FEELINGS, PRE_FEELINGS, REFLECTION_NOTE_MAX } from '@/modules/kuko-way/check-ins';
import { isLocalDateString, isPlausibleToday } from '@/lib/progress/dates';

// Client-generated id for one practice attempt — the idempotency key that
// makes a retried save a no-op (PracticeSession @@unique([userId, clientId])).
const clientIdSchema = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/, 'Invalid client id');

const slugSchema = z.string().min(1).max(120);

// "What did you notice?" — optional; whitespace-only counts as empty.
const noteSchema = z
  .string()
  .max(REFLECTION_NOTE_MAX)
  .transform((value) => value.trim())
  .transform((value) => (value.length > 0 ? value : undefined))
  .optional();

const localTodaySchema = z.string().refine((value) => isPlausibleToday(value), 'Invalid local date');

export const recordPracticeSessionSchema = z.object({
  clientId: clientIdSchema,
  practiceSlug: slugSchema,
  localDate: localTodaySchema,
  // Up to 4 hours; anything longer is a tab left open, not a practice.
  durationSec: z.number().int().min(0).max(4 * 60 * 60).optional(),
  preFeelings: z
    .array(z.enum(PRE_FEELINGS))
    .max(PRE_FEELINGS.length)
    .transform((values) => Array.from(new Set(values)))
    .optional(),
  postFeeling: z.enum(POST_FEELINGS).optional(),
  note: noteSchema,
});

// Completions recorded on a device before sign-in (lib/local-progress.ts):
// slug + the day it was done. Bounded so one request can't flood the table.
export const importDeviceCompletionsSchema = z.object({
  completions: z
    .array(
      z.object({
        practiceSlug: slugSchema,
        // On-device tracking launched in 2026, so nothing older is genuine.
        // Future dates (beyond the client's `today`) are dropped by the service.
        localDate: z.string().refine((value) => isLocalDateString(value) && value >= '2026-01-01', 'Invalid date'),
      }),
    )
    .max(200),
  today: localTodaySchema,
});

export const practiceSummaryQuerySchema = z.object({ today: localTodaySchema });

export const programReflectionSchema = z.object({
  feeling: z.enum(POST_FEELINGS).optional(),
  note: noteSchema,
});
