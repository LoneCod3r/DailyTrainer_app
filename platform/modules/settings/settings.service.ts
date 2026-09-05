import { prisma } from '@/lib/prisma';
import type { UpdateSettingsInput } from '@/lib/validations/settings';

// Small, fixed set of foundation settings (Prompt2 §8). Stored as rows in
// the generic `Setting` key/value table so future modules can add their own
// settings without a schema migration.
export const SETTINGS_KEYS = {
  appName: 'app.name',
  logoUrl: 'app.logoUrl',
  defaultLanguage: 'app.defaultLanguage',
  defaultCurrency: 'app.defaultCurrency',
  contactEmail: 'app.contactEmail',
} as const;

const DEFAULTS: Record<keyof typeof SETTINGS_KEYS, string> = {
  appName: process.env.APP_NAME ?? 'KUKO WAY',
  logoUrl: '',
  defaultLanguage: process.env.DEFAULT_LANGUAGE ?? 'en',
  defaultCurrency: process.env.DEFAULT_CURRENCY ?? 'EUR',
  contactEmail: '',
};

export async function getSettings() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.values(SETTINGS_KEYS) } },
  });

  const byKey = new Map(rows.map((r) => [r.key, r.value as string]));

  const result: Record<keyof typeof SETTINGS_KEYS, string> = { ...DEFAULTS };
  for (const [field, key] of Object.entries(SETTINGS_KEYS) as [keyof typeof SETTINGS_KEYS, string][]) {
    const stored = byKey.get(key);
    if (typeof stored === 'string') result[field] = stored;
  }
  return result;
}

export async function updateSettings(input: UpdateSettingsInput) {
  const entries = Object.entries(input).filter(([, v]) => v !== undefined) as [
    keyof typeof SETTINGS_KEYS,
    string,
  ][];

  await prisma.$transaction(
    entries.map(([field, value]) =>
      prisma.setting.upsert({
        where: { key: SETTINGS_KEYS[field] },
        create: { key: SETTINGS_KEYS[field], value },
        update: { value },
      }),
    ),
  );

  return getSettings();
}
