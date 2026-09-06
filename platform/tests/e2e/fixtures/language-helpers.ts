import type { Page } from '@playwright/test';

// The switcher is a dropdown (see LanguageSwitcher.tsx): open it, then pick
// the target option. Every label in it (toggle + both options) renders
// using the *current* active locale's dictionary, so the Bulgarian option's
// text is "БГ" while browsing in Bulgarian but "BG" while browsing in
// English — the English option is always "EN" either way. `from` picks the
// right expected label; the toggle button's own aria-label prefix
// ("Language"/"Език") also depends on `from`, so match either.
const OPTION_LABEL: Record<'bg' | 'en', Record<'bg' | 'en', string>> = {
  en: { bg: 'BG', en: 'EN' },
  bg: { bg: 'БГ', en: 'EN' },
};

export async function switchLanguage(page: Page, from: 'bg' | 'en', to: 'bg' | 'en'): Promise<void> {
  await page.getByRole('button', { name: /^(Language|Език):/ }).click();
  await page.getByRole('option', { name: OPTION_LABEL[from][to], exact: true }).click();
}
