import type { Element, Root } from 'hast';
import { describe, expect, it } from 'vitest';

import { renderMarkdown } from './render';

/** Depth-first search for the first element with the given tag name. */
function find(node: Root | Element, tagName: string): Element | undefined {
  for (const child of node.children) {
    if (child.type !== 'element') continue;
    if (child.tagName === tagName) return child;
    const nested = find(child, tagName);
    if (nested) return nested;
  }
  return undefined;
}

/** Concatenated text of a subtree, which is what a reader actually sees. */
function textOf(node: Root | Element): string {
  return node.children
    .map((child) => {
      if (child.type === 'text') return child.value;
      if (child.type === 'element') return textOf(child);
      return '';
    })
    .join('');
}

describe('renderMarkdown', () => {
  it('returns a hast root', () => {
    const tree = renderMarkdown('hello');
    expect(tree.type).toBe('root');
  });

  it('maps heading levels to their own tags', () => {
    const tree = renderMarkdown('# One\n\n## Two\n\n### Three');

    expect(textOf(find(tree, 'h1')!)).toBe('One');
    expect(textOf(find(tree, 'h2')!)).toBe('Two');
    expect(textOf(find(tree, 'h3')!)).toBe('Three');
  });

  it('renders paragraphs and inline emphasis', () => {
    const tree = renderMarkdown('Plain *emphasis* and **strong**.');
    const paragraph = find(tree, 'p')!;

    expect(textOf(paragraph)).toBe('Plain emphasis and strong.');
    expect(find(paragraph, 'em')).toBeDefined();
    expect(find(paragraph, 'strong')).toBeDefined();
  });

  it('renders lists with an item per entry', () => {
    const list = find(renderMarkdown('- first\n- second\n- third'), 'ul')!;
    const items = list.children.filter(
      (child) => child.type === 'element' && child.tagName === 'li',
    );

    expect(items).toHaveLength(3);
  });

  it('nests fenced code inside pre > code and keeps it verbatim', () => {
    const tree = renderMarkdown('```ts\nconst x = 1;\n```');
    const code = find(find(tree, 'pre')!, 'code')!;

    expect(textOf(code)).toBe('const x = 1;\n');
  });

  it('records the fence language as a class, for M2 to highlight from', () => {
    const code = find(renderMarkdown('```ts\nconst x = 1;\n```'), 'code')!;

    expect(code.properties?.className).toContain('language-ts');
  });

  it('renders links with their href', () => {
    const anchor = find(renderMarkdown('[Styledown](https://example.com)'), 'a')!;

    expect(anchor.properties?.href).toBe('https://example.com');
    expect(textOf(anchor)).toBe('Styledown');
  });

  it('returns an empty root for empty input rather than throwing', () => {
    expect(renderMarkdown('').children).toEqual([]);
  });

  it('does not touch the DOM, so it can run anywhere', () => {
    // The `lib` Vitest project runs without jsdom on purpose: this pipeline has to
    // stay usable outside a browser (tests, and the export path at M7).
    expect(typeof document).toBe('undefined');
    expect(() => renderMarkdown('# ok')).not.toThrow();
  });
});
