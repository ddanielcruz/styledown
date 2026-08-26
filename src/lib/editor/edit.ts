/**
 * What every editor transform hands back: a change to the document, not a new document.
 *
 * The obvious shape is `(doc, selection) → doc`, and it is wrong here for one reason — a
 * document in this app can be carrying a few hundred kilobytes of base64 in its link
 * definitions. Replacing the whole thing to add two asterisks rewrites all of it, keeps a
 * second copy of all of it in the undo history, and throws away every image fold on the way
 * past. An edit says only what moved, which is also exactly what CodeMirror wants for a
 * single transaction — and a single transaction is what makes one undo take the whole thing
 * back rather than half of it.
 */

/** Where the reader is. `from` and `to` are equal for a bare cursor. */
export interface Selection {
  from: number;
  to: number;
}

/** A splice, in the *original* document's coordinates. `to` defaults to `from` — an insert. */
export interface Change {
  from: number;
  to?: number;
  insert: string;
}

export interface Edit {
  changes: Change[];
  /** In the *resulting* document's coordinates, because that is where it will be applied. */
  selection: { anchor: number; head: number };
}

/** A cursor rather than a range, said once so the transforms do not each spell it out. */
export const cursorAt = (at: number) => ({ anchor: at, head: at });

/** The start of the line `at` falls on. */
export function lineStart(doc: string, at: number): number {
  return doc.lastIndexOf('\n', at - 1) + 1;
}

/** The end of the line `at` falls on, not counting its newline. */
export function lineEnd(doc: string, at: number): number {
  const next = doc.indexOf('\n', at);

  return next === -1 ? doc.length : next;
}

export interface Line {
  from: number;
  to: number;
  text: string;
}

/**
 * Every line the selection touches, whole.
 *
 * A block prefix is a property of a line, so selecting three words across two lines is a
 * request about both of those lines. A selection that ends exactly at the start of a line
 * does *not* include it — dragging down to the beginning of the next line is the ordinary
 * way to select the line above, and prefixing an untouched line would be a surprise.
 */
export function linesIn(doc: string, selection: Selection): Line[] {
  const first = lineStart(doc, selection.from);
  const reaches = selection.to > selection.from ? selection.to - 1 : selection.to;
  const last = lineEnd(doc, Math.max(reaches, first));
  const lines: Line[] = [];

  for (let from = first; from <= last; from = lineEnd(doc, from) + 1) {
    const to = lineEnd(doc, from);

    lines.push({ from, to, text: doc.slice(from, to) });

    if (to >= last) break;
  }

  return lines;
}

/**
 * The selection with its outer whitespace given back.
 *
 * `**word **` is not bold — CommonMark will not close emphasis on a space, so it renders as
 * literal asterisks. Double-clicking a word in most browsers takes the space after it, so
 * this is the common case rather than the careless one, and the fix belongs here rather than
 * in each caller.
 */
export function trimmed(doc: string, selection: Selection): Selection {
  let { from, to } = selection;

  while (from < to && /\s/.test(doc[from]!)) from++;
  while (to > from && /\s/.test(doc[to - 1]!)) to--;

  // A selection that was nothing but whitespace collapses to where it started, so the
  // markers land somewhere the reader was rather than somewhere they were not.
  return from === to ? { from: selection.from, to: selection.from } : { from, to };
}
