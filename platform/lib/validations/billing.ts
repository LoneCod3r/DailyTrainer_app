import { z } from 'zod';

// Server-side validation for billing inputs. Per Prompt3 §11/§4: amounts and
// currencies are NEVER trusted from the frontend as final truth — these
// schemas bound what a client may *request*; the billing service is still
// responsible for resolving authoritative prices (e.g. from MembershipPlan /
// Stripe Price) rather than trusting a client-supplied amount where one exists.

const SUPPORTED_CURRENCIES = ['eur'] as const;

export const donationAmountSchema = z
  .number()
  .int('Amount must be an integer number of cents')
  .min(100, 'Minimum donation is 1.00')
  .max(100_000_00, 'Amount exceeds the allowed maximum');

export const createDonationCheckoutSchema = z.object({
  amount: donationAmountSchema,
  currency: z.enum(SUPPORTED_CURRENCIES).default('eur'),
  userId: z.string().cuid().optional(), // absent => guest donation
});

export const createSubscriptionCheckoutSchema = z.object({
  membershipPlanId: z.string().cuid(),
  userId: z.string().cuid(),
});

export const createOneTimeCheckoutSchema = z.object({
  courseId: z.string().min(1),
  userId: z.string().cuid(),
});

export type CreateDonationCheckoutInput = z.infer<typeof createDonationCheckoutSchema>;
export type CreateSubscriptionCheckoutInput = z.infer<typeof createSubscriptionCheckoutSchema>;
export type CreateOneTimeCheckoutInput = z.infer<typeof createOneTimeCheckoutSchema>;
