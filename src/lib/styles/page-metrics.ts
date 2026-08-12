import type { Margins, PageSize } from './document-styles';

/**
 * The page, in the two forms the document needs it.
 *
 * These live apart from either consumer because both of them read the margin: the sheet
 * insets itself by `--doc-page-margin` on screen, and the page box insets the paper by
 * the same amount in print. A copy in each file is a copy that can drift, and a printed
 * margin that quietly stops matching the preview is the exact failure the print
 * milestone exists to prevent.
 */

/** Letter and Legal share a width and differ only in height, which nothing reads on screen. */
export const PAGE_WIDTHS: Record<PageSize, string> = {
  a4: '210mm',
  letter: '216mm',
  legal: '216mm',
};

/**
 * `@page` takes the paper by name. Millimetre pairs would work as well, but only if we
 * also carried heights — and the name is what lets the browser match the stock actually
 * loaded in the printer.
 */
export const PAGE_SIZE_KEYWORDS: Record<PageSize, string> = {
  a4: 'A4',
  letter: 'Letter',
  legal: 'Legal',
};

export const PAGE_MARGINS: Record<Margins, string> = {
  narrow: '15mm',
  normal: '22mm',
  wide: '32mm',
};
