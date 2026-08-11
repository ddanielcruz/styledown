import type { Element, Root } from 'hast';
import { describe, expect, it } from 'vitest';

import { containsMath, loadMathPlugin } from './math';
import { renderMarkdown } from './render';

/** Depth-first search for the first element carrying the given class. */
function findByClass(node: Root | Element, className: string): Element | undefined {
  for (const child of node.children) {
    if (child.type !== 'element') continue;

    const classes = child.properties?.className;
    if (Array.isArray(classes) && classes.includes(className)) return child;

    const nested = findByClass(child, className);
    if (nested) return nested;
  }
  return undefined;
}

function textOf(node: Root | Element): string {
  return node.children
    .map((child) => {
      if (child.type === 'text') return child.value;
      if (child.type === 'element') return textOf(child);
      return '';
    })
    .join('');
}

describe('containsMath', () => {
  it('finds inline math', () => {
    expect(containsMath(renderMarkdown('The identity $e^{i\\pi} + 1 = 0$ is famous.'))).toBe(true);
  });

  it('finds display math', () => {
    expect(containsMath(renderMarkdown('$$\nx = 1\n$$'))).toBe(true);
  });

  it('finds a math fence', () => {
    expect(containsMath(renderMarkdown('```math\nx = 1\n```'))).toBe(true);
  });

  it('is false for a document with no math, including one full of code', () => {
    const tree = renderMarkdown('# Title\n\n```ts\nconst x = 1;\n```\n\n| a | b |\n| - | - |');

    expect(containsMath(tree)).toBe(false);
  });

  it('treats two dollar amounts on one line as math, exactly as GitHub does', () => {
    // Not a bug to fix: `remark-math` defaults to `singleDollarTextMath: true`, and
    // GitHub behaves the same way — the remedy there and here is to escape as `\$`.
    // Pinned so nobody "corrects" it and silently drops support for `$x$`.
    expect(containsMath(renderMarkdown('It costs $5 and $10.'))).toBe(true);
    expect(containsMath(renderMarkdown('It costs \\$5 and \\$10.'))).toBe(false);
  });
});

describe('math rendering', () => {
  it('leaves the source readable as code until the typesetter loads', () => {
    const tree = renderMarkdown('$x = 1$');

    // The fallback a reader sees for one frame. Plain, but not wrong.
    expect(textOf(findByClass(tree, 'language-math')!)).toBe('x = 1');
  });

  it('typesets math once the plugin is passed in', async () => {
    const tree = renderMarkdown('$x = 1$', await loadMathPlugin());

    expect(findByClass(tree, 'katex')).toBeDefined();
    expect(findByClass(tree, 'language-math')).toBeUndefined();
  });

  it('leaves documents without math untouched by the plugin', async () => {
    const tree = renderMarkdown('# Just a heading', await loadMathPlugin());

    expect(findByClass(tree, 'katex')).toBeUndefined();
  });
});
