import { describe, expect, it } from 'vitest';

import { toCssVariables } from './css-variables';
import { DEFAULT_STYLES, type Margins, type PageSize } from './document-styles';
import { toPageRule } from './page-rule';

const withPage = (size: PageSize, margins: Margins) => ({
  ...DEFAULT_STYLES,
  page: { size, margins },
});

describe('toPageRule', () => {
  it('sets the paper and the margin from the page setting', () => {
    expect(toPageRule(DEFAULT_STYLES)).toBe('@page { size: A4; margin: 22mm; }');
  });

  it('names each paper by its CSS keyword, so the browser can match real stock', () => {
    // Millimetre pairs would work too, but only if we carried page *heights* — and
    // Letter and Legal differ in nothing else, so the keyword is the cheaper truth.
    expect(toPageRule(withPage('letter', 'normal'))).toContain('size: Letter');
    expect(toPageRule(withPage('legal', 'normal'))).toContain('size: Legal');
  });

  it('widens the margin when a wider one is asked for', () => {
    const margin = (margins: Margins) => toPageRule(withPage('a4', margins));

    expect(margin('narrow')).toContain('margin: 15mm');
    expect(margin('wide')).toContain('margin: 32mm');
  });

  /**
   * The one that matters. The sheet on screen insets itself by `--doc-page-margin`; the
   * printed page is inset by the page box instead. If those two ever disagree, the PDF
   * silently stops matching the preview — which is the whole failure this milestone
   * exists to prevent, and nothing else in the suite would catch it.
   */
  it.each<Margins>(['narrow', 'normal', 'wide'])(
    'prints the same %s margin the preview shows',
    (margins) => {
      const styles = withPage('a4', margins);

      expect(toPageRule(styles)).toContain(
        `margin: ${toCssVariables(styles)['--doc-page-margin']}`,
      );
    },
  );
});
