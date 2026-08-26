import type { Selection } from './edit';

/**
 * A selection written into the document as `|`, so the tests can be read.
 *
 * Two integers beside a string say nothing about which characters they cover, and every
 * awkward case in this module is a question about exactly which characters those are. One
 * bar is a cursor; two are a range.
 */
export function markedSelection(marked: string): { doc: string; selection: Selection } {
  const from = marked.indexOf('|');
  const second = marked.indexOf('|', from + 1);

  return {
    doc: marked.replaceAll('|', ''),
    selection: { from, to: second === -1 ? from : second - 1 },
  };
}
