import type { Element, Root } from 'hast';
import { describe, expect, it } from 'vitest';

import { mermaidSources, rehypeMermaid } from './mermaid';
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

/** Stands in for what mermaid draws, which no test outside a browser can produce. */
const drawing = (label: string): Element => ({
  type: 'element',
  tagName: 'svg',
  properties: { viewBox: '0 0 10 10' },
  children: [
    { type: 'element', tagName: 'title', properties: {}, children: [] },
    { type: 'text', value: label },
  ],
});

const FLOWCHART = 'graph TD\n  A --> B\n';
const SEQUENCE = 'sequenceDiagram\n  A ->> B: hi\n';

describe('mermaidSources', () => {
  it('returns each diagram in document order and ignores other fences', () => {
    const markdown = [
      '```mermaid',
      FLOWCHART.trimEnd(),
      '```',
      '',
      '```ts',
      'const x = 1;',
      '```',
      '',
      '```mermaid',
      SEQUENCE.trimEnd(),
      '```',
    ].join('\n');

    expect(mermaidSources(renderMarkdown(markdown))).toEqual([FLOWCHART, SEQUENCE]);
  });

  it('finds nothing in a document with no diagrams', () => {
    expect(mermaidSources(renderMarkdown('# Title\n\nSome prose.'))).toEqual([]);
  });
});

describe('rehypeMermaid', () => {
  const markdown = `\`\`\`mermaid\n${FLOWCHART.trimEnd()}\n\`\`\``;

  it('replaces the fence with the drawing it was given', () => {
    const drawn = new Map([[FLOWCHART, drawing('flowchart')]]);
    const tree = renderMarkdown(markdown, [rehypeMermaid(drawn)]);

    const diagram = find(tree, 'div')!;
    expect(diagram.properties.className).toEqual(['diagram']);
    expect(find(diagram, 'svg')).toBeDefined();
    // The fence is gone, not hidden: a code block left behind would print twice.
    expect(find(tree, 'pre')).toBeUndefined();
  });

  it('leaves the fence alone when there is no drawing for it', () => {
    // One case, two meanings: mermaid has not drawn this yet, and mermaid cannot draw
    // this at all. Either way the source is what the reader gets — on screen, on paper
    // and in the exported file.
    const tree = renderMarkdown(markdown, [rehypeMermaid(new Map())]);

    expect(find(tree, 'div')).toBeUndefined();
    expect(textOf(find(tree, 'code')!)).toBe(FLOWCHART);
  });
});
