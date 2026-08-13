import { describe, expect, it } from 'vitest';

import { toCssVariables } from './css-variables';
import { DEFAULT_STYLES } from './document-styles';

describe('toCssVariables', () => {
  it('turns the defaults into the variables the stylesheet reads', () => {
    expect(toCssVariables(DEFAULT_STYLES)).toEqual({
      '--doc-font-body': expect.stringContaining('Inter'),
      '--doc-font-size': '16px',
      '--doc-accent': DEFAULT_STYLES.accent,
      '--doc-page-width': '210mm',
      '--doc-page-height': '297mm',
      '--doc-page-margin': '22mm',
    });
  });

  it('emits nothing for the code theme, which is a stylesheet rather than a variable', () => {
    const light = toCssVariables(DEFAULT_STYLES);
    const dark = toCssVariables({ ...DEFAULT_STYLES, codeTheme: 'github-dark' });

    expect(dark).toEqual(light);
  });

  it('gives Letter and Legal the same width, because they differ only in height', () => {
    const paper = (size: 'a4' | 'letter' | 'legal') =>
      toCssVariables({ ...DEFAULT_STYLES, page: { ...DEFAULT_STYLES.page, size } });

    expect(paper('letter')['--doc-page-width']).toBe(paper('legal')['--doc-page-width']);
    expect(paper('letter')['--doc-page-width']).not.toBe(paper('a4')['--doc-page-width']);
    expect(paper('letter')['--doc-page-height']).not.toBe(paper('legal')['--doc-page-height']);
  });

  it('serves a serif face when one is chosen', () => {
    const { '--doc-font-body': stack } = toCssVariables({ ...DEFAULT_STYLES, bodyFont: 'lora' });

    expect(stack).toContain('Lora');
    expect(stack).toContain('serif');
  });

  it('carries the base size through as pixels, since everything else scales from it', () => {
    expect(toCssVariables({ ...DEFAULT_STYLES, fontSize: 20 })['--doc-font-size']).toBe('20px');
  });
});
