import { describe, expect, it } from 'vitest';

import { createDefaultStyles, defaultPageSize } from './locale-defaults';

describe('defaultPageSize', () => {
  it.each(['en-US', 'es-MX', 'en-CA', 'fr-CA', 'es-CL', 'fil-PH'])(
    'gives %s the paper its shops sell',
    (locale) => {
      expect(defaultPageSize([locale])).toBe('letter');
    },
  );

  it.each(['en-GB', 'pt-BR', 'de-DE', 'ja-JP', 'es-ES', 'en-AU'])(
    'gives %s A4, which is the rest of the world',
    (locale) => {
      expect(defaultPageSize([locale])).toBe('a4');
    },
  );

  it('skips locales that do not say where the reader is', () => {
    expect(defaultPageSize(['en', 'en-US'])).toBe('letter');
  });

  it('does not read a region into a bare language tag', () => {
    // `Intl.Locale('en').maximize()` says US, which would hand Letter to every reader
    // whose browser reports no region at all.
    expect(defaultPageSize(['en'])).toBe('a4');
  });

  it('falls back to A4 when asked about nothing, or about nonsense', () => {
    expect(defaultPageSize([])).toBe('a4');
    expect(defaultPageSize(['not a locale'])).toBe('a4');
  });
});

describe('createDefaultStyles', () => {
  it('changes the paper and nothing else', () => {
    const a4 = createDefaultStyles(['en-GB']);
    const letter = createDefaultStyles(['en-US']);

    expect(letter).toEqual({ ...a4, page: { ...a4.page, size: 'letter' } });
  });
});
