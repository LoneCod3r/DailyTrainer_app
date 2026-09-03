import { z } from 'zod';

// Foundation settings only (Prompt2 §8). Payment/donation *functionality*
// is out of scope here — this just lets the admin configure the basics.
export const updateSettingsSchema = z.object({
  appName: z.string().trim().min(1).max(80).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  defaultLanguage: z.string().trim().min(2).max(10).optional(),
  defaultCurrency: z.string().trim().length(3).optional(),
  contactEmail: z.string().trim().email().optional().or(z.literal('')),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
