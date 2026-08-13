import { describe, expect, it } from 'vitest';

import { fitsInStorage, imageInsertion, STORAGE_BUDGET, type Insertion } from './insert';

const PNG = 'data:image/webp;base64,AAAA';

/**
 * What the reader ends up looking at. The insertion is three coordinates into a document
 * that does not exist yet, and asserting on those coordinates is asserting on arithmetic;
 * applying them and reading the result is asserting on the document.
 *
 * Positions are in the original document's coordinates, the way CodeMirror wants a single
 * transaction's changes — so they are applied back to front.
 */
function applied(doc: string, insertion: Insertion) {
  const { reference, definition, alt } = insertion;

  const text =
    doc.slice(0, reference.from) +
    reference.insert +
    doc.slice(reference.from, definition.from) +
    definition.insert +
    doc.slice(definition.from);

  return { text, selected: text.slice(alt.from, alt.to) };
}

const insert = (doc: string, at: number, name?: string) =>
  applied(doc, imageInsertion(doc, at, { dataUrl: PNG, name }));

describe('imageInsertion', () => {
  it('puts the reference where the cursor is and the bytes at the end', () => {
    const doc = '# Title\n\nA paragraph.\n';

    expect(insert(doc, doc.length).text).toBe(
      `# Title\n\nA paragraph.\n\n![][img-1]\n\n[img-1]: ${PNG}\n`,
    );
  });

  it('opens a block of its own when the cursor is inside a paragraph', () => {
    const doc = 'Before.\n';

    expect(insert(doc, 'Before.'.length).text).toBe(`Before.\n\n![][img-1]\n\n[img-1]: ${PNG}\n`);
  });

  it('adds no blank lines the document already has', () => {
    const doc = 'Before.\n\n\n\nAfter.\n';

    expect(insert(doc, 'Before.\n\n'.length).text).toBe(
      `Before.\n\n![][img-1]\n\nAfter.\n\n[img-1]: ${PNG}\n`,
    );
  });

  it('does not thread the next image through the last one', () => {
    // Where the cursor is left after an image is inserted: inside the alt, ready to name it.
    const doc = '![tiny][img-1]\n\n# Title\n\n[img-1]: data:image/png;base64,AA\n';

    expect(insert(doc, '![tiny'.length).text).toContain('![tiny][img-1]\n\n![][img-2]\n\n# Title');
  });

  it('takes a label the document is not already using', () => {
    const doc = `See [img-1] and [img-2].\n\n[img-1]: /a.png\n  [img-2]: /b.png\n`;

    expect(insert(doc, 0).text).toContain('![][img-3]');
  });

  it('names the image after the file, and selects the name for replacing', () => {
    const { text, selected } = insert('# Title\n', 0, 'architecture_diagram.png');

    expect(text).toContain('![architecture diagram][img-1]');
    expect(selected).toBe('architecture diagram');
  });

  it('leaves the alt empty when the file has no name worth reading', () => {
    // What Chrome calls a bitmap off the clipboard. "image" describes nothing a reader
    // cannot already see, and an empty alt is a better thing to hand a screen reader.
    const { text, selected } = insert('# Title\n', 0, 'image.png');

    expect(text).toContain('![][img-1]');
    expect(selected).toBe('');
  });

  it('keeps a bracket in the filename out of the reference', () => {
    expect(insert('# Title\n', 0, 'shot [2].png').text).toContain('![shot \\[2\\]][img-1]');
  });
});

describe('fitsInStorage', () => {
  it('refuses what would cross the budget', () => {
    const doc = 'x'.repeat(STORAGE_BUDGET - 100);

    expect(fitsInStorage(doc, 100)).toBe(true);
    expect(fitsInStorage(doc, 101)).toBe(false);
  });
});
