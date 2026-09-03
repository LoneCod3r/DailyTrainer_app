import { z } from 'zod';

// Kept in lockstep with lib/validations/billing.ts's supported-currency list —
// membership pricing goes through the same Stripe integration.
const SUPPORTED_CURRENCIES = ['eur'] as const;
const INTERVALS = ['month', 'year'] as const;

export const membershipPlanAmountSchema = z
  .number()
  .int('Price must be an integer number of cents')
  .min(100, 'Minimum price is 1.00')
  .max(100_000_00, 'Price exceeds the allowed maximum');

export const createMembershipPlanSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
  amount: membershipPlanAmountSchema,
  currency: z.enum(SUPPORTED_CURRENCIES).default('eur'),
  interval: z.enum(INTERVALS),
  active: z.boolean().optional(),
});

export const updateMembershipPlanSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).optional(),
  amount: membershipPlanAmountSchema.optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),
  interval: z.enum(INTERVALS).optional(),
  active: z.boolean().optional(),
});

// Only the plan id is accepted from the client — the price is always
// resolved server-side from the MembershipPlan row, never trusted from the
// frontend (Prompt3 §11).
export const subscribeToMembershipSchema = z.object({
  membershipPlanId: z.string().cuid(),
});

export type CreateMembershipPlanInput = z.infer<typeof createMembershipPlanSchema>;
export type UpdateMembershipPlanInput = z.infer<typeof updateMembershipPlanSchema>;
