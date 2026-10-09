import { z } from 'zod';

// Newsletter signup: email only. Same normalisation as the auth schemas, plus
// the RFC 5321 length ceiling so oversized input is rejected before it goes
// anywhere.
export const newsletterSignupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});
