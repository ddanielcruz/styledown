import type { Root } from 'hast';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified, type Pluggable } from 'unified';

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
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  // Math is *parsed* here but not typeset — that needs KaTeX, which is a quarter of a
  // megabyte and irrelevant to most documents. `remark-math` lowers it to
  // `code.language-math`, so `containsMath` can spot it and the caller can decide.
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeSlug)
  // `plainText: ['math']` keeps highlighting off the maths, which is not a language and
  // belongs to KaTeX. `detect` stays off (its default): guessing the language of an
  // unlabelled block gets it wrong often enough to be worse than leaving it plain.
  .use(rehypeHighlight, { plainText: ['math'] });

/**
 * @param math the typesetter from `loadMathPlugin`, once a document has proved it needs
 * one. Omitted, maths stays visible as its own source.
 */
export function renderMarkdown(markdown: string, math?: Pluggable): Root {
  // Calling a frozen processor copies it, which is the supported way to extend one.
  const pipeline = math ? processor().use([math]) : processor;

  return pipeline.runSync(pipeline.parse(markdown));
}
