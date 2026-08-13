import type { Element } from 'hast';
import type { Pluggable } from 'unified';

import { CODE_THEME_CSS } from '@/components/preview/code-themes';
import { titleOf } from '@/lib/document/title';
import { documentFaces, toHtmlDocument } from '@/lib/export';
import {
  containsMath,
  loadDiagramRenderer,
  loadMathPlugin,
  mermaidSources,
  rehypeMermaid,
  renderMarkdown,
} from '@/lib/markdown';
import { FONT_STACKS, type DocumentStyles } from '@/lib/styles';

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
 * Every diagram in the document, drawn. Unlike the preview, which shows what it has and
 * fills in the rest as it arrives, the export waits: a file is written once and cannot come
 * back for the diagram that had not finished.
 */
async function drawDiagrams(sources: string[], fontFamily: string): Promise<Map<string, Element>> {
  const draw = await loadDiagramRenderer();
  const drawings = await Promise.all(sources.map((source) => draw(source, fontFamily)));

  return new Map(
    sources
      .map((source, index) => [source, drawings[index]] as const)
      .filter((entry): entry is [string, Element] => entry[1] !== undefined),
  );
}

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
  const diagrams = mermaidSources(plain);
  const hasMaths = containsMath(plain);

  const [math, drawings, mathCss] = await Promise.all([
    hasMaths ? loadMathPlugin() : undefined,
    diagrams.length ? drawDiagrams(diagrams, FONT_STACKS[styles.bodyFont]) : undefined,
    hasMaths
      ? import('katex/dist/katex.min.css?inline').then(({ default: css }) => withoutFontFaces(css))
      : undefined,
  ]);

  const plugins: Pluggable[] = [];
  if (math) plugins.push(math);
  if (drawings?.size) plugins.push(rehypeMermaid(drawings));

  const tree = plugins.length ? renderMarkdown(markdown, plugins) : plain;

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
