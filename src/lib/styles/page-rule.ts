import type { DocumentStyles } from './document-styles';
import { PAGE_MARGINS, PAGE_SIZE_KEYWORDS } from './page-metrics';

/**
 * The `@page` rule for a set of styles.
 *
 * The other four settings reach the document as custom properties (see
 * `toCssVariables`), but the page box cannot be driven that way: custom properties are
 * not reliably visible inside `@page`, and its `size` descriptor will not accept a
 * `var()` at all. So page setup leaves this module as text instead — same source of
 * truth, a second way out of it.
 *
 * Returned as a string rather than injected here because `src/lib` is framework-free:
 * the app hoists this into a `<style>`, and M7's exporter writes it into the file it
 * generates.
 */
export function toPageRule(styles: DocumentStyles): string {
  const size = PAGE_SIZE_KEYWORDS[styles.page.size];
  const margin = PAGE_MARGINS[styles.page.margins];

  return `@page { size: ${size}; margin: ${margin}; }`;
}
