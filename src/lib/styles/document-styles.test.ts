import { describe, expect, it } from 'vitest';

import { ACCENT_SWATCHES, DEFAULT_STYLES } from './document-styles';

describe('DEFAULT_STYLES', () => {
  // The other four defaults cannot drift: their types are derived from the option lists,
  // so a value the panel does not offer will not compile. An accent is a free-form hex,
  // which is the one place a default can be a colour no swatch shows as selected.
  it('starts on a swatch the panel can show as chosen', () => {
    expect(ACCENT_SWATCHES.map((swatch) => swatch.value)).toContain(DEFAULT_STYLES.accent);
  });
});
