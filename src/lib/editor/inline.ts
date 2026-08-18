import { cursorAt, trimmed, type Edit, type Selection } from './edit';

/**
 * Bold, italic, strikethrough and inline code — the four that are a pair of markers around
 * a run of text, and therefore one function.
 *
 * The interesting half is *off*. A reader who wraps a word and immediately changes their
 * mind presses the same key again, and by then the selection is the word rather than the
 * word and its markers — so the markers have to be recognised from outside the selection as
 * well as inside it. The earlier project only ever looked at the selected text, which meant
 * the second press produced `****bold****` instead of undoing the first.
 */
export function toggleInline(doc: string, selection: Selection, marker: string): Edit {
  const { from, to } = trimmed(doc, selection);
  const width = marker.length;

  // Wrapped from outside: the reader selected the words, and the markers are the characters
  // either side of them.
  if (doc.slice(from - width, from) === marker && doc.slice(to, to + width) === marker) {
    return {
      changes: [
        { from: from - width, to: from, insert: '' },
        { from: to, to: to + width, insert: '' },
      ],
      selection: { anchor: from - width, head: to - width },
    };
  }

  const text = doc.slice(from, to);

  // Wrapped from inside: the selection is the markers and everything between them.
  if (text.length >= width * 2 && text.startsWith(marker) && text.endsWith(marker)) {
    return {
      changes: [
        { from, to: from + width, insert: '' },
        { from: to - width, to, insert: '' },
      ],
      selection: { anchor: from, head: to - width * 2 },
    };
  }

  return {
    changes: [
      { from, to: from, insert: marker },
      { from: to, to, insert: marker },
    ],
    // The words stay selected and the markers do not, so pressing the key twice is a round
    // trip rather than a slow accumulation of asterisks.
    selection: from === to ? cursorAt(from + width) : { anchor: from + width, head: to + width },
  };
}
