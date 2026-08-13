import { describe, expect, it } from 'vitest';

import { DEFAULT_DOCUMENT } from '../document/default-document';
import { DEFAULT_STYLES } from '../styles';
import { loadState, serializeState } from './persisted-state';

const UK = ['en-GB'];
const US = ['en-US'];

describe('loadState', () => {
  it('round-trips what was saved', () => {
    const saved = serializeState({
      version: 1,
      content: '# Q3 Postmortem',
      styles: { ...DEFAULT_STYLES, bodyFont: 'lora', fontSize: 19, accent: '#be123c' },
    });

    expect(loadState(saved, UK)).toEqual({
      version: 1,
      content: '# Q3 Postmortem',
      styles: { ...DEFAULT_STYLES, bodyFont: 'lora', fontSize: 19, accent: '#be123c' },
    });
  });

  it('starts a first-time reader on the default document, papered for where they are', () => {
    expect(loadState(null, US)).toEqual({
      version: 1,
      content: DEFAULT_DOCUMENT,
      styles: { ...DEFAULT_STYLES, page: { ...DEFAULT_STYLES.page, size: 'letter' } },
    });
  });

  it('recovers from anything that is not the state we wrote', () => {
    // A corrupt entry must never produce a broken app, so every one of these is a fresh
    // start rather than a throw: truncated JSON, another app's key, a format from a
    // version that no longer exists.
    for (const raw of ['{"version":1,"conte', '"a string"', 'null', '{"version":7}', '{}']) {
      expect(loadState(raw, UK).content).toBe(DEFAULT_DOCUMENT);
    }
  });

  it('starts over rather than opening on an empty page, keeping the settings', () => {
    // There is no blank canvas in this product, and an editor with nothing in it and no
    // way to ask for something is the worst version of one.
    for (const content of ['', '   \n\n  ']) {
      const raw = JSON.stringify({
        version: 1,
        content,
        styles: { ...DEFAULT_STYLES, bodyFont: 'lora' },
      });

      expect(loadState(raw, UK).content).toBe(DEFAULT_DOCUMENT);
      expect(loadState(raw, UK).styles.bodyFont).toBe('lora');
    }
  });

  it('loses only the setting that is broken, never the document', () => {
    // The whole argument for validating field by field. All-or-nothing parsing would
    // answer one bad colour by throwing away everything the reader has written.
    const raw = JSON.stringify({
      version: 1,
      content: '# Still here',
      styles: { ...DEFAULT_STYLES, accent: 'banana', bodyFont: 'lora', codeTheme: 'nord' },
    });

    expect(loadState(raw, UK)).toEqual({
      version: 1,
      content: '# Still here',
      styles: {
        ...DEFAULT_STYLES,
        accent: DEFAULT_STYLES.accent,
        bodyFont: 'lora',
        codeTheme: 'nord',
      },
    });
  });

  it('refuses a size the slider cannot reach', () => {
    const raw = JSON.stringify({
      version: 1,
      content: '# Still here',
      styles: { ...DEFAULT_STYLES, fontSize: 96 },
    });

    expect(loadState(raw, UK).styles.fontSize).toBe(DEFAULT_STYLES.fontSize);
  });
});
