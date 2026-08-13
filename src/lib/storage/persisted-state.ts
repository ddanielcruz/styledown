import { z } from 'zod';

import { DEFAULT_DOCUMENT } from '../document/default-document';
import {
  CODE_THEME_OPTIONS,
  createDefaultStyles,
  FONT_OPTIONS,
  FONT_SIZE_RANGE,
  MARGIN_OPTIONS,
  PAGE_SIZE_OPTIONS,
  type DocumentStyles,
  type StyleOption,
} from '../styles';

/**
 * What survives a refresh, and how it survives being wrong.
 *
 * `localStorage` is shared with every other script that has ever run on this origin, it
 * outlives the version of the app that wrote it, and a reader can edit it by hand. So
 * nothing read back is trusted, and `docs/DESIGN.md` sets the bar: a corrupted entry must
 * never produce a broken app.
 *
 * The interesting part is *how far* a bad value is allowed to reach. Validating the whole
 * object at once would answer one unrecognised colour by throwing away everything the
 * reader has written, which is a far worse failure than the one it is reporting. So every
 * setting carries its own fallback and fails alone — only `version` is all-or-nothing,
 * because a format we do not recognise is not a document we can partially rescue.
 */

export interface PersistedState {
  version: 1;
  content: string;
  styles: DocumentStyles;
}

/**
 * `z.enum` wants the literals themselves, and `.map()` widens them to `string`. The cast
 * is what keeps one source of truth: the menu and the validator read the same list, so a
 * code theme cannot be offerable and unloadable at the same time.
 */
type ValueOf<T extends readonly StyleOption<string>[]> = T[number]['value'];

const valuesOf = <T extends readonly StyleOption<string>[]>(options: T) =>
  options.map((option) => option.value) as [ValueOf<T>, ...ValueOf<T>[]];

/** What a colour input hands back, and so the only shape we ever write. */
const HEX_COLOUR = /^#[0-9a-f]{6}$/i;

function schemaFor(locales: readonly string[]) {
  const fallback = createDefaultStyles(locales);

  const styles = z
    .object({
      bodyFont: z.enum(valuesOf(FONT_OPTIONS)).catch(fallback.bodyFont),
      fontSize: z
        .number()
        .int()
        .min(FONT_SIZE_RANGE.min)
        .max(FONT_SIZE_RANGE.max)
        .catch(fallback.fontSize),
      accent: z.string().regex(HEX_COLOUR).catch(fallback.accent),
      page: z
        .object({
          size: z.enum(valuesOf(PAGE_SIZE_OPTIONS)).catch(fallback.page.size),
          margins: z.enum(valuesOf(MARGIN_OPTIONS)).catch(fallback.page.margins),
        })
        .catch(fallback.page),
      codeTheme: z.enum(valuesOf(CODE_THEME_OPTIONS)).catch(fallback.codeTheme),
    })
    .catch(fallback);

  return z.object({
    // Deliberately uncaught. Everything else falls back to a default; a version we have
    // never heard of means the shape underneath is unknown, and guessing at it is how a
    // migration turns into a mangled document.
    version: z.literal(1),
    /*
     * An empty document is not a state worth restoring. `docs/DESIGN.md`'s first rule is
     * that there is no blank canvas — the app always opens on something rendered — and a
     * reader who cleared the editor and closed the tab comes back to a screen with nothing
     * on it and no way to ask for something. Emptying it still *saves*, so clearing the
     * page and going to make coffee loses nothing; it is only on the way back in that
     * empty is read as "start me over".
     */
    content: z
      .string()
      .refine((text) => text.trim().length > 0)
      .catch(DEFAULT_DOCUMENT),
    styles,
  });
}

/**
 * The state to start from, given whatever was in storage — including nothing, and
 * including nonsense. Never throws.
 *
 * @param locales the reader's language preferences, which decide the paper for anyone who
 * has not chosen one. `src/lib` cannot reach for a browser, so they come in as an argument.
 */
export function loadState(raw: string | null, locales: readonly string[]): PersistedState {
  const fresh: PersistedState = {
    version: 1,
    content: DEFAULT_DOCUMENT,
    styles: createDefaultStyles(locales),
  };

  if (!raw) return fresh;

  try {
    const parsed = schemaFor(locales).safeParse(JSON.parse(raw));

    return parsed.success ? parsed.data : fresh;
  } catch {
    // Not JSON at all.
    return fresh;
  }
}

export function serializeState(state: PersistedState): string {
  return JSON.stringify(state);
}
