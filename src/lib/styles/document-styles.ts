/**
 * The five values a reader is allowed to change.
 *
 * Everything else about the typography — the heading scale, the spacing rhythm, the
 * table and blockquote treatment — is a fixed token living in `src/styles/document.css`.
 * That split is the whole design: `docs/DESIGN.md` promises a default that already looks
 * good, and controls that only ever *adjust* it. Exposing another token later means
 * moving it out of the stylesheet's defaults and into this type, which is a small local
 * change rather than a refactor.
 */

/** The shortlist spans sans and serif on purpose; five near-identical sans faces would be a worse menu. */
export type FontFamily = 'inter' | 'source-sans-3' | 'lora' | 'source-serif-4' | 'merriweather';

export type PageSize = 'a4' | 'letter' | 'legal';

export type Margins = 'narrow' | 'normal' | 'wide';

export type CodeTheme =
  | 'github-light'
  | 'github-dark'
  | 'atom-one-light'
  | 'atom-one-dark'
  | 'nord'
  | 'night-owl';

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
  // A4 flat, for now. `docs/DESIGN.md` wants the size derived from the reader's locale,
  // which needs a browser and so belongs with the control at M5 — not in a lib constant.
  page: { size: 'a4', margins: 'normal' },
  codeTheme: 'github-light',
};
