import type { DocumentStyles, FontFamily } from './document-styles';
import { PAGE_MARGINS, PAGE_WIDTHS } from './page-metrics';

/**
 * Fontsource registers variable faces under a `… Variable` family name, so each stack
 * names that first, the static face second, and a generic last. Only Inter is bundled
 * today (M5 fetches the rest on demand); the others are still correct CSS in the
 * meantime — an unloaded family simply falls through to the next name.
 */
const FONT_STACKS: Record<FontFamily, string> = {
  inter: "'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif",
  'source-sans-3':
    "'Source Sans 3 Variable', 'Source Sans 3', ui-sans-serif, system-ui, sans-serif",
  lora: "'Lora Variable', Lora, ui-serif, Georgia, serif",
  'source-serif-4': "'Source Serif 4 Variable', 'Source Serif 4', ui-serif, Georgia, serif",
  merriweather: "'Merriweather Variable', Merriweather, ui-serif, Georgia, serif",
};

/**
 * The five settings, as the custom properties `src/styles/document.css` consumes. Set
 * on the document container, so changing one repaints without regenerating a stylesheet.
 *
 * `codeTheme` is deliberately absent. A highlight.js theme is a whole stylesheet of
 * token colours, not a value — M5 swaps the `<link>` rather than setting a variable.
 * Nothing here is missing.
 */
export function toCssVariables(styles: DocumentStyles): Record<string, string> {
  return {
    '--doc-font-body': FONT_STACKS[styles.bodyFont],
    '--doc-font-size': `${styles.fontSize}px`,
    '--doc-accent': styles.accent,
    '--doc-page-width': PAGE_WIDTHS[styles.page.size],
    '--doc-page-margin': PAGE_MARGINS[styles.page.margins],
  };
}
