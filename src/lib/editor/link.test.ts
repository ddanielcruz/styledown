import { describe, expect, it } from 'vitest';

import { applyEdit } from './apply-edit';
import { insertLink } from './link';
import { markedSelection } from './marked-selection';

function link(marked: string, clipboard?: string) {
  const { doc, selection } = markedSelection(marked);
  const edit = insertLink(doc, selection, clipboard);
  const { doc: after } = applyEdit(doc, edit);

  return { doc: after, cursor: after.slice(0, edit.selection.anchor) };
}

const URL = 'https://styledown.dev';

describe('inserting a link', () => {
  it('leaves the cursor in the destination when the words are already there', () => {
    const { doc, cursor } = link('Read the |docs| for more');

    expect(doc).toBe('Read the [docs]() for more');
    expect(cursor).toBe('Read the [docs](');
  });

  it('leaves it in the label when there are no words yet', () => {
    const { doc, cursor } = link('Read |');

    expect(doc).toBe('Read []()');
    expect(cursor).toBe('Read [');
  });

  it('takes a URL off the clipboard rather than asking for it twice', () => {
    const { doc, cursor } = link('Read the |docs| for more', URL);

    expect(doc).toBe(`Read the [docs](${URL}) for more`);
    // Nothing left to fill in, so the cursor is past the whole thing.
    expect(cursor).toBe(`Read the [docs](${URL})`);
  });

  it('asks for the label when the clipboard has the destination and nothing is selected', () => {
    const { doc, cursor } = link('Read |', URL);

    expect(doc).toBe(`Read [](${URL})`);
    expect(cursor).toBe('Read [');
  });

  it('ignores a clipboard that is not a URL', () => {
    expect(link('Read the |docs|', 'some copied prose').doc).toBe('Read the [docs]()');
  });

  it('makes a selected URL the destination rather than the label', () => {
    const { doc, cursor } = link(`See |${URL}|`);

    expect(doc).toBe(`See [](${URL})`);
    expect(cursor).toBe('See [');
  });

  it('does not swallow the space beside the words', () => {
    expect(link('Read the |docs |for more').doc).toBe('Read the [docs]() for more');
  });
});
