import { describe, expect, it } from 'vitest';

import { DEFAULT_DOCUMENT, isUnedited } from './default-document';

describe('isUnedited', () => {
  it('treats an empty document as nothing worth keeping', () => {
    expect(isUnedited('')).toBe(true);
  });

  it('treats a document of whitespace the same way', () => {
    expect(isUnedited('\n\n   \n')).toBe(true);
  });

  it('recognises the document we handed the reader', () => {
    expect(isUnedited(DEFAULT_DOCUMENT)).toBe(true);
  });

  it('recognises it through the trailing newline an editor may drop', () => {
    expect(isUnedited(DEFAULT_DOCUMENT.trimEnd())).toBe(true);
  });

  it('sees one edited word as work', () => {
    expect(isUnedited(DEFAULT_DOCUMENT.replace('# Styledown', '# Q3 Postmortem'))).toBe(false);
  });
});
