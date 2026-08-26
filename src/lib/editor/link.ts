import { cursorAt, trimmed, type Edit, type Selection } from './edit';

/**
 * A link, with as few of its four parts left to type as the app can work out.
 *
 * The clipboard is where a URL almost always is at the moment somebody reaches for this —
 * they copied it from the address bar and came back. Reading it can be refused (a permission
 * the reader has not granted, or a browser that only allows it during a gesture), so it
 * arrives here as a value that may be missing rather than as something to wait on: the link
 * is inserted either way, and the worst case is the destination the reader was going to type
 * anyway.
 */

/**
 * Deliberately schemes rather than anything cleverer. A guess wrong in this direction puts
 * the reader's prose in the destination, where it is invisible and looks like the app ate it.
 */
const URL = /^(?:https?|mailto|ftp):\S+$/i;

const urlIn = (text: string | undefined) => {
  const trimmedText = text?.trim() ?? '';

  return URL.test(trimmedText) ? trimmedText : undefined;
};

export function insertLink(doc: string, selection: Selection, clipboard?: string): Edit {
  const { from, to } = trimmed(doc, selection);
  const selected = doc.slice(from, to);

  // Somebody who selects a URL means it as the destination — nobody links the word
  // "https://…" to itself.
  const asDestination = urlIn(selected);
  const label = asDestination ? '' : selected;
  const destination = asDestination ?? urlIn(clipboard) ?? '';

  const insert = `[${label}](${destination})`;
  const changes = [{ from, to, insert }];

  // Whichever half is still empty is where the reader has to go next; when neither is, they
  // are past it.
  if (!label) return { changes, selection: cursorAt(from + 1) };
  if (!destination) return { changes, selection: cursorAt(from + label.length + 3) };

  return { changes, selection: cursorAt(from + insert.length) };
}
