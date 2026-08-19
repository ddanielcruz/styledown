import { describe, expect, it } from 'vitest';

import { applyEdit } from './apply-edit';
import { insertRule, wrapFence } from './blocks';
import { markedSelection } from './marked-selection';

const run = (marked: string, transform: typeof wrapFence) => {
  const { doc, selection } = markedSelection(marked);

  return applyEdit(doc, transform(doc, selection));
};

describe('wrapping a fence', () => {
  it('puts the selected lines inside it', () => {
    const { doc } = run('before\n\n|npm install|\n\nafter', wrapFence);

    expect(doc).toBe('before\n\n```\nnpm install\n```\n\nafter');
  });

  it('takes whole lines, so the fence cannot open mid-sentence', () => {
    const { doc } = run('before\n\nnpm |install|\n\nafter', wrapFence);

    expect(doc).toBe('before\n\n```\nnpm install\n```\n\nafter');
  });

  it('leaves the cursor in the language slot', () => {
    const { doc, selected } = run('|', wrapFence);

    expect(doc).toBe('```\n\n```');
    expect(selected).toBe('');
    // Right after the opening backticks, so a language is one word away.
    expect(doc.slice(0, 3)).toBe('```');
  });

  it('adds only the blank lines the document is not already providing', () => {
    expect(run('text\n\n|', wrapFence).doc).toBe('text\n\n```\n\n```');
    expect(run('a\n\nb|\n\nc', wrapFence).doc).toBe('a\n\n```\nb\n```\n\nc');
    // Nothing to separate it from at the top of the document.
    expect(run('text|', wrapFence).doc).toBe('```\ntext\n```');
  });
});

describe('inserting a rule', () => {
  it('goes on its own line after the one the cursor is on', () => {
    const { doc } = run('one|\n\ntwo', insertRule);

    expect(doc).toBe('one\n\n---\n\ntwo');
  });

  it('leaves somewhere to keep writing at the end of the document', () => {
    const { doc, selected } = run('one|', insertRule);

    expect(doc).toBe('one\n\n---\n\n');
    expect(selected).toBe('');
  });

  it('does not double the blank lines that are already there', () => {
    expect(run('one|\n\n\n\ntwo', insertRule).doc).toBe('one\n\n---\n\n\n\ntwo');
  });
});
