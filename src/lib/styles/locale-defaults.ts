import { DEFAULT_STYLES, type DocumentStyles, type PageSize } from './document-styles';

/**
 * Where Letter is the paper you get when you ask for paper. Everywhere else is A4, which
 * is why A4 is the fallback rather than an entry in a second list.
 */
const LETTER_REGIONS = new Set([
  'US',
  'CA',
  'MX',
  'PH',
  'CL',
  'CO',
  'CR',
  'DO',
  'GT',
  'NI',
  'PA',
  'PR',
  'SV',
  'VE',
]);

/** `Intl.Locale` throws on a malformed tag, and a browser is not the only caller. */
function regionOf(locale: string): string | undefined {
  try {
    return new Intl.Locale(locale).region;
  } catch {
    return undefined;
  }
}

/**
 * The paper the reader most likely prints on, from their language preferences.
 *
 * The first tag that says where the reader *is* decides it — a language on its own says
 * nothing about paper, and `maximize()` would invent a region from one, handing Letter to
 * everybody whose browser reports a bare `en`.
 */
export function defaultPageSize(locales: readonly string[]): PageSize {
  for (const locale of locales) {
    const region = regionOf(locale);
    if (region) return LETTER_REGIONS.has(region) ? 'letter' : 'a4';
  }

  return DEFAULT_STYLES.page.size;
}

/**
 * The starting styles for a reader. `DEFAULT_STYLES` stays the flat constant the tests and
 * the stylesheet's own defaults are written against; only the paper is worth deriving,
 * and only a browser knows what to derive it from — so the locales come in as an argument.
 */
export function createDefaultStyles(locales: readonly string[]): DocumentStyles {
  return {
    ...DEFAULT_STYLES,
    page: { ...DEFAULT_STYLES.page, size: defaultPageSize(locales) },
  };
}
