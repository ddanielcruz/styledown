import { CODE_THEME_CSS } from '@/components/preview/code-themes';
import { titleOf } from '@/lib/document/title';
import { documentFaces, toHtmlDocument } from '@/lib/export';
import { containsMath, loadMathPlugin, renderMarkdown } from '@/lib/markdown';
import type { DocumentStyles } from '@/lib/styles';

import { loadFontFaceCss } from './document-fonts';

import documentCss from '@/styles/document.css?inline';

/**
 * KaTeX ships its own `@font-face` rules, and they point at files in our bundle — paths
 * that mean nothing on the reader's disk, and would be a request to a server they never
 * chose if they did resolve. Ours go in instead, bytes and all.
 *
 * Minified CSS has no nested braces, so a block is everything up to the first `}`.
 */
const withoutFontFaces = (css: string) => css.replace(/@font-face\s*{[^}]*}/g, '');

/**
 * The document as a standalone file: one HTML page with its stylesheet, its code theme,
 * its typefaces and its page box inside it, and nothing to fetch.
 *
 * It renders its own tree rather than borrowing the preview's. The preview's is a piece of
 * React state that may or may not have had a typesetter applied yet, and an export that
 * came out different depending on how long the reader had been looking at the screen would
 * be a bad kind of bug to have.
 */
export async function toExportedHtml(markdown: string, styles: DocumentStyles): Promise<string> {
  const plain = renderMarkdown(markdown);
  const hasMaths = containsMath(plain);

  const [tree, mathCss] = hasMaths
    ? await Promise.all([
        loadMathPlugin().then((math) => renderMarkdown(markdown, math)),
        import('katex/dist/katex.min.css?inline').then(({ default: css }) => withoutFontFaces(css)),
      ])
    : [plain, undefined];

  return toHtmlDocument({
    tree,
    styles,
    title: titleOf(markdown),
    documentCss,
    codeThemeCss: CODE_THEME_CSS[styles.codeTheme],
    fontFaceCss: await loadFontFaceCss(styles.bodyFont, documentFaces(tree)),
    mathCss,
  });
}
