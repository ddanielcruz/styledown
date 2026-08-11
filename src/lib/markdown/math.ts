import type { Element, Root } from 'hast';
import type { Pluggable } from 'unified';

/**
 * Does this document contain maths worth loading a typesetter for?
 *
 * Asked of the tree rather than the source text, which makes the answer exact instead
 * of a guess: `remark-math` has already lowered both `$…$` and ` ```math ` fences to
 * the same `language-math` class, so one check covers every syntax.
 */
export function containsMath(node: Root | Element): boolean {
  for (const child of node.children) {
    if (child.type !== 'element') continue;

    const classes = child.properties?.className;
    if (Array.isArray(classes) && classes.includes('language-math')) return true;
    if (containsMath(child)) return true;
  }

  return false;
}

/**
 * KaTeX, on demand. It weighs about as much as the rest of the app put together, and
 * most technical documents contain no maths at all, so it stays out of the main bundle
 * and loads only for the documents that need it.
 *
 * No caching here — the module registry already deduplicates `import()`.
 */
export async function loadMathPlugin(): Promise<Pluggable> {
  const { default: rehypeKatex } = await import('rehype-katex');

  return rehypeKatex;
}
