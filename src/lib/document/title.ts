import type { Heading, Nodes, Root } from 'mdast';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

/**
 * What a document is called, and what a downloaded copy of it is called.
 *
 * There is no title control and no stored title: a document's name is its first heading,
 * which is the one place a reader has already written it. A field beside the app name
 * would be a sixth control that can silently disagree with the heading on the page.
 *
 * It shows up in two places, and the second is the reason this exists at all. The browser
 * tab is the obvious one. The other is Chrome's print dialog, which offers `document.title`
 * as the filename when you save a PDF — so a document headed `# Q3 Postmortem` saves as
 * `Q3 Postmortem.pdf` rather than `Styledown.pdf`, on the one screen we cannot style.
 */

/** Headings are the only thing this needs, and headings are what `remark-gfm` leaves alone. */
const parser = unified().use(remarkParse);

function textOf(node: Nodes): string {
  if ('value' in node) return node.value;
  if ('children' in node) return node.children.map(textOf).join('');

  return '';
}

/**
 * The document's first top-level heading, if it has one.
 *
 * Parsed rather than matched with `/^# (.+)/m`, because a document that opens with a shell
 * fence would otherwise be titled after a comment inside it. Parsing also takes a setext
 * heading for free.
 */
export function titleOf(markdown: string): string | undefined {
  const root = parser.parse(markdown) as Root;
  const heading = root.children.find(
    (node): node is Heading => node.type === 'heading' && node.depth === 1,
  );

  const title = heading ? textOf(heading).trim() : '';

  return title || undefined;
}

/** Long enough for a real title, short enough that a stray paragraph cannot become a filename. */
const MAX_SLUG = 60;

/**
 * `Q3 Postmortem: What Broke` → `q3-postmortem-what-broke.md`.
 *
 * Letters are matched by Unicode property, not `[a-z]`: slugging to ASCII would name every
 * document written in most of the world's scripts `untitled.md`.
 *
 * The extension is an argument because the same document leaves as `.md` and as `.html`,
 * and the two downloads sitting side by side in a folder should differ only in that.
 */
export function fileNameOf(title: string | undefined, extension = 'md'): string {
  const slug = (title ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .slice(0, MAX_SLUG)
    .replace(/^-+|-+$/g, '');

  return `${slug || 'untitled'}.${extension}`;
}
