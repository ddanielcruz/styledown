import { describe, expect, it } from 'vitest';

import { accentInk, contrastOnWhite } from './accent-ink';
import { ACCENT_SWATCHES } from './document-styles';

describe('accentInk', () => {
  it('leaves every swatch we offer exactly as it is', () => {
    // The shortlist was chosen to be readable, and this is what says so: not one of the
    // six is touched, so nobody using the presets ever sees a colour they did not pick.
    for (const { value } of ACCENT_SWATCHES) {
      expect(contrastOnWhite(value)).toBeGreaterThanOrEqual(4.5);
      expect(accentInk(value)).toBe(value);
    }
  });

  it('darkens a colour the picker allows but the page cannot carry', () => {
    // A pale yellow reads at 1.5:1 against the page — a link nobody can follow, and on
    // paper there is no hover to recover it with.
    expect(contrastOnWhite('#facc15')).toBeLessThan(2);

    const ink = accentInk('#facc15');

    expect(ink).not.toBe('#facc15');
    expect(contrastOnWhite(ink)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the colour the reader chose, only darker', () => {
    // Every channel scales by the same factor, so the hue and the saturation survive and
    // only the brightness moves: their yellow is still yellow.
    const [red, green, blue] = [1, 3, 5].map((at) =>
      parseInt(accentInk('#facc15').slice(at, at + 2), 16),
    );

    expect(red).toBeGreaterThan(green!);
    expect(green!).toBeGreaterThan(blue!);
  });

  it('has an answer for white, which is a colour the picker offers', () => {
    const ink = accentInk('#ffffff');

    expect(contrastOnWhite(ink)).toBeGreaterThanOrEqual(4.5);
  });

  it('leaves black alone rather than searching past it', () => {
    expect(accentInk('#000000')).toBe('#000000');
  });
});
