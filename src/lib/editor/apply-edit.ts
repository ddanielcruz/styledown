import type { Edit } from './edit';

/**
 * What an `Edit` means, written down once.
 *
 * The transforms return coordinates into a document that does not exist yet, and asserting
 * on those coordinates is asserting on arithmetic. Applying them and reading the result is
 * asserting on the document — so this is what every test in this module measures through,
 * and it is the definition the CodeMirror adapter is expected to agree with.
 */
export function applyEdit(doc: string, edit: Edit): { doc: string; selected: string } {
  // Sorted rather than assumed: a transform that wraps a selection produces the closing
  // marker before it knows it needed an opening one, and the order it says them in is its
  // own business.
  const changes = [...edit.changes].sort((a, b) => a.from - b.from);

  let out = '';
  let at = 0;

  for (const change of changes) {
    out += doc.slice(at, change.from) + change.insert;
    at = change.to ?? change.from;
  }

  out += doc.slice(at);

  const { anchor, head } = edit.selection;

  return { doc: out, selected: out.slice(Math.min(anchor, head), Math.max(anchor, head)) };
}
