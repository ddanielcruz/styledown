import type { Root } from 'hast';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

/**
 * Markdown → hast.
 *
 * The pipeline deliberately stops at hast rather than producing React. hast is plain
 * data, which keeps this module framework-free, and it gives the preview and the HTML
 * exporter (M7) a single shared source — they render the same tree, so they cannot
 * drift apart.
 *
 * Synchronous on purpose: no plugin here needs to await anything, so the preview can
 * render during React's render pass instead of juggling async state.
 */
const processor = unified().use(remarkParse).use(remarkRehype);

export function renderMarkdown(markdown: string): Root {
  return processor.runSync(processor.parse(markdown));
}
