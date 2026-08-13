import { describe, expect, it } from 'vitest';

import { fileNameOf, titleOf } from './title';

describe('titleOf', () => {
  it('is the first top-level heading', () => {
    expect(titleOf('# Q3 Postmortem\n\nSomething broke.')).toBe('Q3 Postmortem');
  });

  it('reads through the marks inside it', () => {
    expect(titleOf('# The *`useEffect`* problem')).toBe('The useEffect problem');
  });

  it('takes a setext heading too', () => {
    expect(titleOf('Q3 Postmortem\n=============\n\nSomething broke.')).toBe('Q3 Postmortem');
  });

  it('ignores a hash inside a code fence', () => {
    // The reason this parses rather than matching `/^# (.+)/m`: a document that opens with
    // a shell fence would otherwise be titled after a comment in it.
    expect(titleOf('```bash\n# Install first\npnpm install\n```\n\n# Getting started')).toBe(
      'Getting started',
    );
  });

  it('ignores deeper headings', () => {
    expect(titleOf('## Not the title\n\n# The title')).toBe('The title');
  });

  it('has none for a document without one', () => {
    expect(titleOf('Just a paragraph.')).toBeUndefined();
    expect(titleOf('')).toBeUndefined();
  });
});

describe('fileNameOf', () => {
  it('slugs the title', () => {
    expect(fileNameOf('Q3 Postmortem: What Broke')).toBe('q3-postmortem-what-broke.md');
  });

  it('keeps letters that are not English ones', () => {
    // Slugging to ASCII would name every document in this language `untitled.md`.
    expect(fileNameOf('Relatório Anual')).toBe('relatório-anual.md');
  });

  it('falls back when there is no title, or nothing left of one', () => {
    expect(fileNameOf(undefined)).toBe('untitled.md');
    expect(fileNameOf('!!!')).toBe('untitled.md');
  });

  it('does not run away with a heading that is really a sentence', () => {
    const name = fileNameOf(
      'A title so long that it is plainly a paragraph wearing a hash '.repeat(3),
    );

    expect(name.length).toBeLessThanOrEqual(64);
    expect(name.endsWith('-.md')).toBe(false);
  });
});
