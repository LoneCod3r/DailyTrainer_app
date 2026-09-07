// Best-effort Latin → Cyrillic transliteration for Bulgarian first names,
// so a signed-in greeting like "Добре дошъл, {name}" doesn't mix scripts
// when the account's name is stored in Latin letters (e.g. from a Google
// sign-in or an EN registration). Names already in Cyrillic pass through
// unchanged. Uses the standard Bulgarian transliteration digraphs (BDS
// ISO / Bulgarian transliteration law), longest-match-first.
const CYRILLIC_PATTERN = /[Ѐ-ӿ]/;

const TRIGRAPHS: Record<string, string> = {
  sht: 'щ',
};

const DIGRAPHS: Record<string, string> = {
  zh: 'ж',
  ts: 'ц',
  ch: 'ч',
  sh: 'ш',
  yu: 'ю',
  ya: 'я',
};

const SINGLE: Record<string, string> = {
  a: 'а',
  b: 'б',
  v: 'в',
  g: 'г',
  d: 'д',
  e: 'е',
  z: 'з',
  i: 'и',
  y: 'й',
  k: 'к',
  l: 'л',
  m: 'м',
  n: 'н',
  o: 'о',
  p: 'п',
  r: 'р',
  s: 'с',
  t: 'т',
  u: 'у',
  f: 'ф',
  h: 'х',
  c: 'ц',
  j: 'ж',
  w: 'в',
  q: 'к',
};

export function toBulgarianCyrillic(latin: string): string {
  if (!latin || CYRILLIC_PATTERN.test(latin)) return latin;

  const lower = latin.toLowerCase();
  let result = '';
  for (let i = 0; i < lower.length; ) {
    const three = lower.slice(i, i + 3);
    if (TRIGRAPHS[three]) {
      result += TRIGRAPHS[three];
      i += 3;
      continue;
    }
    const two = lower.slice(i, i + 2);
    if (DIGRAPHS[two]) {
      result += DIGRAPHS[two];
      i += 2;
      continue;
    }
    const char = lower[i];
    result += SINGLE[char] ?? char;
    i += 1;
  }

  return /^[A-ZА-Я]/.test(latin) ? result.charAt(0).toUpperCase() + result.slice(1) : result;
}
