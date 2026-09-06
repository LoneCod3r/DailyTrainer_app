import type { Locale } from '../locale';
import bg from './bg';
import en from './en';

export const dictionaries = { bg, en } satisfies Record<Locale, typeof bg>;

export type Dictionary = typeof bg;

// Dot-path key across the dictionary shape, e.g. "home.welcomeBack".
type Join<K extends string, P extends string> = P extends '' ? K : `${K}.${P}`;
type Paths<T> = T extends string
  ? ''
  : {
      [K in keyof T & string]: Join<K, Paths<T[K]>>;
    }[keyof T & string];

export type DictKey = Paths<Dictionary>;

function resolve(dict: Dictionary, path: string): string {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, dict);
  return typeof value === 'string' ? value : path;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

// Server + client shared translator factory. Falls back to Bulgarian if a
// key is somehow missing from the requested locale's dictionary.
export function getT(locale: Locale) {
  const dict = dictionaries[locale] ?? dictionaries.bg;
  return (key: DictKey, vars?: Record<string, string | number>) => {
    const raw = resolve(dict, key) ?? resolve(dictionaries.bg, key);
    return interpolate(raw, vars);
  };
}
