import { describe, expect, it } from 'vitest';

import { applyEdit } from './apply-edit';
import { toggleInline } from './inline';
import { markedSelection } from './marked-selection';

function toggle(marked: string, marker: string) {
  const { doc, selection } = markedSelection(marked);

  return applyEdit(doc, toggleInline(doc, selection, marker));
}

const bold = (marked: string) => toggle(marked, '**');

describe('toggling inline markup', () => {
  it('leaves the cursor between the markers when there is no selection', () => {
    const { doc, selected } = bold('The |quick fox');

    expect(doc).toBe('The ****quick fox');
    expect(selected).toBe('');
    // Between them, not after them: the next keystroke has to land inside.
    expect(doc.slice(0, 6)).toBe('The **');
  });

  it('wraps a selection and keeps the words selected, not the markers', () => {
    const { doc, selected } = bold('The |quick| fox');

    expect(doc).toBe('The **quick** fox');
    expect(selected).toBe('quick');
  });

  it('takes the markers off a selection it already put them on', () => {
    // The round trip: what the previous test left selected, toggled again.
    const { doc, selected } = bold('The **|quick|** fox');

    expect(doc).toBe('The quick fox');
    expect(selected).toBe('quick');
  });

  it('takes the markers off when they are inside the selection too', () => {
    const { doc, selected } = bold('The |**quick**| fox');

    expect(doc).toBe('The quick fox');
    expect(selected).toBe('quick');
  });

  it('does not wrap a trailing space', () => {
    // A double-click takes the space after the word in most browsers, and `**word **` is
    // not bold — CommonMark will not close emphasis on a space, so it would render as four
    // literal asterisks.
    const { doc, selected } = bold('The |quick |fox');

    expect(doc).toBe('The **quick** fox');
    expect(selected).toBe('quick');
  });

  it('does not wrap a leading one either', () => {
    const { doc, selected } = bold('The| quick| fox');

    expect(doc).toBe('The **quick** fox');
    expect(selected).toBe('quick');
  });

  it('puts the markers where the cursor was when the selection is only whitespace', () => {
    const { doc } = bold('The |   |fox');

    expect(doc).toBe('The ****   fox');
  });

  it('nests inside markup that is not its own', () => {
    // `_` for italic and `**` for bold, so an underscore beside asterisks must not read as
    // half of anything.
    const { doc, selected } = toggle('The **|quick|** fox', '_');

    expect(doc).toBe('The **_quick_** fox');
    expect(selected).toBe('quick');
  });

  it('handles a one-character marker as well as a two', () => {
    expect(toggle('a |b| c', '`').doc).toBe('a `b` c');
    expect(toggle('a `|b|` c', '`').doc).toBe('a b c');
    expect(toggle('a |b| c', '~~').doc).toBe('a ~~b~~ c');
  });
});
