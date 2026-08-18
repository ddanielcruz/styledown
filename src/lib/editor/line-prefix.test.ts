import { describe, expect, it } from 'vitest';

import { applyEdit } from './apply-edit';
import { toggleLinePrefix } from './line-prefix';
import { markedSelection } from './marked-selection';

function toggle(marked: string, prefix: string) {
  const { doc, selection } = markedSelection(marked);

  return applyEdit(doc, toggleLinePrefix(doc, selection, prefix));
}

describe('toggling a line prefix', () => {
  it('prefixes the line the cursor is on', () => {
    expect(toggle('Some|thing', '- ').doc).toBe('- Something');
  });

  it('keeps the cursor where it was in the words, not where it was on the line', () => {
    const { doc, selected } = applyEdit(
      'Something',
      toggleLinePrefix('Something', { from: 4, to: 4 }, '- '),
    );

    expect(doc).toBe('- Something');
    // Still after "Some", which is now two characters further along the line.
    expect(doc.slice(0, 6)).toBe('- Some');
    expect(selected).toBe('');
  });

  it('prefixes every line the selection touches', () => {
    expect(toggle('|one\ntwo\nthree|', '- ').doc).toBe('- one\n- two\n- three');
  });

  it('leaves alone a line the selection only just reaches', () => {
    // Dragging down to the start of the next line is how the line above gets selected.
    expect(toggle('|one\n|two', '- ').doc).toBe('- one\ntwo');
  });

  it('takes the prefix off only when every line already has one', () => {
    expect(toggle('|- one\n- two|', '- ').doc).toBe('one\ntwo');
    expect(toggle('|- one\ntwo|', '- ').doc).toBe('- one\n- two');
  });

  it('numbers an ordered list across the selection', () => {
    expect(toggle('|one\ntwo\nthree|', '1. ').doc).toBe('1. one\n2. two\n3. three');
  });

  it('replaces one kind of list with another rather than stacking them', () => {
    expect(toggle('|- one\n- two|', '1. ').doc).toBe('1. one\n2. two');
    expect(toggle('|1. one\n2. two|', '- ').doc).toBe('- one\n- two');
  });

  it('turns a bullet into a task and back', () => {
    expect(toggle('|- one', '- [ ] ').doc).toBe('- [ ] one');
    expect(toggle('|- [ ] one', '- ').doc).toBe('- one');
    // A ticked box is still a task, so the task button takes it off.
    expect(toggle('|- [x] one', '- [ ] ').doc).toBe('one');
  });

  it('changes a heading to another level, and removes it at its own', () => {
    expect(toggle('|## Title', '# ').doc).toBe('# Title');
    expect(toggle('|## Title', '## ').doc).toBe('Title');
    expect(toggle('|Title', '### ').doc).toBe('### Title');
  });

  it('keeps the indentation of a nested item', () => {
    expect(toggle('  |- one', '1. ').doc).toBe('  1. one');
    expect(toggle('  |- one', '- ').doc).toBe('  one');
  });

  it('stacks a quote in front of whatever the line already is', () => {
    expect(toggle('|- one\n- two|', '> ').doc).toBe('> - one\n> - two');
    expect(toggle('|> - one', '> ').doc).toBe('- one');
    // One level at a time, so a nested quote can be climbed out of.
    expect(toggle('|> > deep', '> ').doc).toBe('> deep');
  });

  it('marks up the line inside a quote rather than the quote', () => {
    expect(toggle('|> something', '## ').doc).toBe('> ## something');
    expect(toggle('|> ## something', '## ').doc).toBe('> something');
  });

  it('selects the lines it changed', () => {
    const { selected } = toggle('|one\ntwo|', '> ');

    expect(selected).toBe('> one\n> two');
  });
});
