/**
 * The five values a reader is allowed to change, and the choices behind each one.
 *
 * Everything else about the typography — the heading scale, the spacing rhythm, the
 * table and blockquote treatment — is a fixed token living in `src/styles/document.css`.
 * That split is the whole design: `docs/DESIGN.md` promises a default that already looks
 * good, and controls that only ever *adjust* it. Exposing another token later means
 * moving it out of the stylesheet's defaults and into this type, which is a small local
 * change rather than a refactor.
 *
 * Each union is *derived from* the list of options rather than declared beside it. A
 * union and a menu that are written separately can disagree — a theme with no label
 * renders as a blank row — and this way they are the same statement, so the panel can
 * only ever offer exactly what the type allows.
 */

export interface StyleOption<T extends string> {
  value: T;
  label: string;
}

/** The shortlist spans sans and serif on purpose; five near-identical sans faces would be a worse menu. */
export const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter' },
  { value: 'source-sans-3', label: 'Source Sans 3' },
  { value: 'lora', label: 'Lora' },
  { value: 'source-serif-4', label: 'Source Serif 4' },
  { value: 'merriweather', label: 'Merriweather' },
] as const satisfies readonly StyleOption<string>[];

export type FontFamily = (typeof FONT_OPTIONS)[number]['value'];

export const PAGE_SIZE_OPTIONS = [
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
  { value: 'legal', label: 'Legal' },
] as const satisfies readonly StyleOption<string>[];

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]['value'];

export const MARGIN_OPTIONS = [
  { value: 'narrow', label: 'Narrow' },
  { value: 'normal', label: 'Normal' },
  { value: 'wide', label: 'Wide' },
] as const satisfies readonly StyleOption<string>[];

export type Margins = (typeof MARGIN_OPTIONS)[number]['value'];

export const CODE_THEME_OPTIONS = [
  { value: 'github-light', label: 'GitHub Light' },
  { value: 'github-dark', label: 'GitHub Dark' },
  { value: 'atom-one-light', label: 'Atom One Light' },
  { value: 'atom-one-dark', label: 'Atom One Dark' },
  { value: 'nord', label: 'Nord' },
  { value: 'night-owl', label: 'Night Owl' },
] as const satisfies readonly StyleOption<string>[];

export type CodeTheme = (typeof CODE_THEME_OPTIONS)[number]['value'];

/**
 * Accents dark enough to stay legible as link text on white, and to print as a colour
 * rather than a smudge. Anything lighter is a swatch that looks good in the panel and
 * ruins the document, which is the opposite of what a control is for.
 */
export const ACCENT_SWATCHES = [
  { value: '#475569', label: 'Slate' },
  { value: '#1d4ed8', label: 'Blue' },
  { value: '#0f766e', label: 'Teal' },
  { value: '#15803d', label: 'Green' },
  { value: '#b45309', label: 'Amber' },
  { value: '#be123c', label: 'Rose' },
] as const satisfies readonly StyleOption<string>[];

/** Below 14 the document stops being comfortable; above 20 it stops being a document. */
export const FONT_SIZE_RANGE = { min: 14, max: 20, step: 1 } as const;

export interface DocumentStyles {
  bodyFont: FontFamily;
  /** In pixels, 14–20. Everything in the document scales from this. */
  fontSize: number;
  /** Links, rules, small accents. Hex, because that is what a colour input hands back. */
  accent: string;
  page: { size: PageSize; margins: Margins };
  codeTheme: CodeTheme;
}

export const DEFAULT_STYLES: DocumentStyles = {
  bodyFont: 'inter',
  fontSize: 16,
  // Slate. Near-neutral links are deliberate for something built to be printed — a
  // saturated accent that sings on screen is a distraction on paper.
  accent: '#475569',
  // A4 unless the reader's locale says otherwise; `createDefaultStyles()` is what asks.
  page: { size: 'a4', margins: 'normal' },
  codeTheme: 'github-light',
};
