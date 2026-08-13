import { describe, expect, it } from 'vitest';

import { renderMarkdown } from '@/lib/markdown';
import { DEFAULT_STYLES } from '@/lib/styles';

import { toHtmlDocument } from './html';

const MARKDOWN = '# Q3 Postmortem\n\nThe queue backed up at 03:00.\n\n```ts\nconst a = 1;\n```\n';

const exported = (overrides: Partial<Parameters<typeof toHtmlDocument>[0]> = {}) =>
  toHtmlDocument({
    tree: renderMarkdown(MARKDOWN),
    styles: DEFAULT_STYLES,
    title: 'Q3 Postmortem',
    documentCss: '.styledown-doc { color: #1c1f24 }',
    codeThemeCss: '.hljs { background: #fff }',
    fontFaceCss: '@font-face { font-family: Inter Variable }',
    ...overrides,
  });

describe('toHtmlDocument', () => {
  it('is a whole document, named after the heading it carries', () => {
    const html = exported();

    expect(html.startsWith('<!doctype html>')).toBe(true);
    // The tab this file opens in, and the name Chrome offers when it is printed.
    expect(html).toContain('<title>Q3 Postmortem</title>');
    expect(html).toContain('The queue backed up at 03:00.');
  });

  /**
   * The claim the whole milestone rests on. A `<link>` or a remote `url()` would make the
   * file useless on a plane and quietly tell someone else's server which document was
   * opened — which is the promise the product makes, in the one artefact that leaves it.
   */
  it('references nothing outside itself', () => {
    expect(exported()).not.toMatch(/<link|<script|url\(\s*['"]?http/i);
  });

  it('carries the page setup both ways, as the app does', () => {
    // `@page` for the printer and a custom property for the screen: same setting, two
    // consumers, and an exported file needs both of them.
    const html = exported({
      styles: { ...DEFAULT_STYLES, page: { size: 'letter', margins: 'wide' } },
    });

    expect(html).toContain('@page { size: Letter; margin: 32mm; }');
    expect(html).toContain('--doc-page-width: 216mm');
    expect(html).toContain('data-page-size="letter"');
  });

  it('puts the document stylesheet last, where the app puts it', () => {
    const html = exported();

    // Both are unlayered and both style code, so the loser is decided by order — and the
    // document's own stylesheet is the one that has to win.
    expect(html.indexOf('.hljs { background: #fff }')).toBeLessThan(
      html.indexOf('.styledown-doc { color: #1c1f24 }'),
    );
  });

  it('carries KaTeX only for a document that has maths', () => {
    expect(exported()).not.toContain('.katex');
    expect(exported({ mathCss: '.katex { font: KaTeX_Main }' })).toContain('.katex');
  });
});
