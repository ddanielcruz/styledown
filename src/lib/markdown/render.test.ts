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

/** Every element with the given tag name, in document order. */
function findAll(node: Root | Element, tagName: string): Element[] {
  const found: Element[] = [];

  for (const child of node.children) {
    if (child.type !== 'element') continue;
    if (child.tagName === tagName) found.push(child);
    found.push(...findAll(child, tagName));
  }

  return found;
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

function classesOf(element: Element): string[] {
  const className = element.properties?.className;
  return Array.isArray(className) ? className.map(String) : [];
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
    // stay usable outside a browser — the tests, and the exporter's own tree.
    expect(typeof document).toBe('undefined');
    expect(() => renderMarkdown('# ok')).not.toThrow();
  });
});

describe('GitHub-flavoured markdown', () => {
  it('renders tables with a header row and body rows', () => {
    const table = find(renderMarkdown('| Size | Width |\n| --- | --- |\n| A4 | 210mm |'), 'table')!;

    expect(findAll(find(table, 'thead')!, 'th').map(textOf)).toEqual(['Size', 'Width']);
    expect(findAll(find(table, 'tbody')!, 'td').map(textOf)).toEqual(['A4', '210mm']);
  });

  it('renders strikethrough', () => {
    expect(textOf(find(renderMarkdown('~~withdrawn~~'), 'del')!)).toBe('withdrawn');
  });

  it('renders task lists as checkboxes that reflect their state', () => {
    const boxes = findAll(renderMarkdown('- [x] shipped\n- [ ] pending'), 'input');

    expect(boxes.map((box) => box.properties?.checked)).toEqual([true, false]);
    // Disabled, so the rendered document stays a document rather than a form.
    expect(boxes.every((box) => box.properties?.disabled)).toBe(true);
  });

  it('links bare URLs', () => {
    const anchor = find(renderMarkdown('See https://example.com for the details.'), 'a')!;

    expect(anchor.properties?.href).toBe('https://example.com');
  });

  it('collects footnotes into their own section', () => {
    const section = find(renderMarkdown('A claim[^1]\n\n[^1]: The evidence.'), 'section')!;

    expect(section.properties?.dataFootnotes).toBe(true);
    expect(textOf(section)).toContain('The evidence.');
  });
});

describe('syntax highlighting', () => {
  it('marks up the tokens of a fenced block without changing its text', () => {
    const code = find(renderMarkdown('```ts\nconst x = 1;\n```'), 'code')!;
    const tokens = findAll(code, 'span').filter((span) =>
      classesOf(span).some((name) => name.startsWith('hljs-')),
    );

    expect(classesOf(code)).toContain('hljs');
    expect(tokens.length).toBeGreaterThan(0);
    // The whole point: highlighting is markup around the code, never a rewrite of it.
    expect(textOf(code)).toBe('const x = 1;\n');
  });

  it('leaves a fence with no language unhighlighted, but still dressed as a code block', () => {
    const code = find(renderMarkdown('```\nnot really any language\n```'), 'code')!;

    // No guess at the language, and so no tokens to colour…
    expect(classesOf(code).some((name) => name.startsWith('language-'))).toBe(false);
    expect(findAll(code, 'span')).toHaveLength(0);
    // …but the theme hangs its padding and background off `.hljs`, and a block missing
    // that reads as an outlier — worse still under a dark theme.
    expect(classesOf(code)).toContain('hljs');
  });

  it('keeps code verbatim when the language is unknown', () => {
    const tree = renderMarkdown('```klingon\nnuqneH\n```');

    expect(textOf(find(tree, 'code')!)).toBe('nuqneH\n');
  });
});

describe('heading ids', () => {
  it('slugs headings so in-document links resolve', () => {
    const heading = find(renderMarkdown('## Getting started'), 'h2')!;

    expect(heading.properties?.id).toBe('getting-started');
  });

  it('keeps repeated headings distinct', () => {
    const ids = findAll(renderMarkdown('# Notes\n\n# Notes'), 'h1').map(
      (heading) => heading.properties?.id,
    );

    expect(ids).toEqual(['notes', 'notes-1']);
  });
});
