import { describe, expect, it } from 'vitest';

import { loadMathPlugin, renderMarkdown } from '@/lib/markdown';

import { documentFaces, toFontFace } from './faces';

const facesOf = (markdown: string) => documentFaces(renderMarkdown(markdown));

describe('documentFaces', () => {
  it('asks for nothing but the upright body face for plain prose', () => {
    expect(facesOf('# Q3 Postmortem\n\nSomething broke, and here is why.')).toEqual({
      bodyItalic: false,
      mono: false,
      math: false,
    });
  });

  it('asks for the italic once something is emphasised', () => {
    expect(facesOf('It was *not* the database.').bodyItalic).toBe(true);
  });

  it('asks for the mono family for code of either kind', () => {
    expect(facesOf('Run `pnpm build` first.').mono).toBe(true);
    expect(facesOf('```ts\nconst a = 1;\n```').mono).toBe(true);
  });

  /**
   * Asked of the typeset tree, which is the one being written into the file — so the
   * check is for KaTeX's own output rather than for the `language-math` that preceded it.
   * A document whose maths never got typeset still reads as code, and mono is what it
   * needs.
   */
  it('asks for the maths faces only once there is typeset maths', async () => {
    const typeset = renderMarkdown('The bound is $O(n \\log n)$.', [await loadMathPlugin()]);

    expect(documentFaces(typeset).math).toBe(true);
    expect(facesOf('The bound is not $O(n)$-anything, since there is no maths here.').math).toBe(
      false,
    );
  });
});

describe('toFontFace', () => {
  it('carries the bytes, the axis and the subset it covers', () => {
    const rule = toFontFace({
      family: 'Inter Variable',
      style: 'italic',
      weight: '100 900',
      dataUri: 'data:font/woff2;base64,d09GMg',
      unicodeRange: 'U+0000-00FF',
    });

    expect(rule).toContain("font-family: 'Inter Variable'");
    expect(rule).toContain('font-style: italic');
    // The whole weight axis in one file is why bold costs no second request.
    expect(rule).toContain('font-weight: 100 900');
    expect(rule).toContain("src: url(data:font/woff2;base64,d09GMg) format('woff2')");
    expect(rule).toContain('unicode-range: U+0000-00FF');
  });

  it('leaves the range off a face that covers everything it is asked for', () => {
    // KaTeX's faces are the only glyphs in their families, so a range would only ever
    // exclude something they alone can draw.
    expect(
      toFontFace({ family: 'KaTeX_Main', dataUri: 'data:font/woff2;base64,d09GMg' }),
    ).not.toContain('unicode-range');
  });
});
