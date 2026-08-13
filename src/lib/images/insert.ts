/**
 * Where an image goes when there is nowhere to put it but the document.
 *
 * With no server there is no URL to come back, so the bytes live in the source. Inline,
 * that reads as a few thousand wrapped lines of base64 through the middle of a paragraph —
 * so the prose keeps a short `![alt][img-1]` and the bytes go to the end of the document as
 * a link definition, beside where footnote definitions already collect. That is core
 * CommonMark: nothing in the render pipeline has to know, and the `.md` is still a `.md`.
 */

export interface InsertableImage {
  /** The data URI, ready to be a link destination. */
  dataUrl: string;
  /** The file's name, if it had a real one. */
  name?: string;
}

/**
 * One edit in three pieces, in the original document's coordinates — which is what
 * CodeMirror wants for a single transaction, and a single transaction is what makes one
 * undo take the whole image back rather than half of it.
 */
export interface Insertion {
  /** The `![alt][label]` that goes where the cursor is. */
  reference: { from: number; insert: string };
  /** The `[label]: data:…` that goes at the end. */
  definition: { from: number; insert: string };
  /** The alt text, in the resulting document — selected, so typing names the image. */
  alt: { from: number; to: number };
}

/**
 * How much document we are willing to keep in `localStorage`.
 *
 * Every major browser gives an origin about 5MB. The rest is headroom: the styles and the
 * JSON around them, and the browsers that count the quota in UTF-16 units rather than
 * bytes. At a few hundred kilobytes per downscaled image that is something like ten to
 * twenty of them — and because the budget is measured on the document rather than per
 * image, an SVG that passed through unshrunk is caught by the same single rule.
 */
export const STORAGE_BUDGET = 4_000_000;

export function fitsInStorage(doc: string, added: number): boolean {
  return doc.length + added <= STORAGE_BUDGET;
}

/** A link definition, which may be indented up to three spaces before it stops being one. */
const DEFINITION = /^ {0,3}\[([^\]]+)\]:/gm;

/** The first `img-N` this document is not already using. */
function freeLabel(doc: string): string {
  const taken = new Set(Array.from(doc.matchAll(DEFINITION), ([, label]) => label?.toLowerCase()));

  for (let n = 1; ; n++) {
    const label = `img-${n}`;
    if (!taken.has(label)) return label;
  }
}

/**
 * The file's name as something worth reading aloud.
 *
 * `image` is what Chrome calls a bitmap taken off the clipboard. It describes nothing a
 * reader cannot already see, and an empty alt is a better thing to hand a screen reader
 * than a lie — so a pasted screenshot arrives unnamed, with the empty alt selected.
 */
function altFor(name: string | undefined): string {
  const stem = (name ?? '').replace(/\.[^.]+$/, '');
  const words = stem.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

  if (!words || words.toLowerCase() === 'image') return '';

  // A bracket in the filename would end the alt early and leave the rest as loose text.
  return words.replace(/([[\]])/g, '\\$1');
}

/**
 * Line breaks between this position and the nearest content, counting at most the two that
 * make a paragraph break. The edge of the document counts as two: nothing needs separating
 * from nothing.
 */
function breaksBefore(doc: string, at: number): number {
  let i = at;
  let breaks = 0;

  while (i > 0 && breaks < 2) {
    const character = doc[i - 1];
    if (character === '\n') breaks++;
    else if (character !== ' ' && character !== '\t' && character !== '\r') break;
    i--;
  }

  return i === 0 ? 2 : breaks;
}

function breaksAfter(doc: string, at: number): number {
  let i = at;
  let breaks = 0;

  while (i < doc.length && breaks < 2) {
    const character = doc[i];
    if (character === '\n') breaks++;
    else if (character !== ' ' && character !== '\t' && character !== '\r') break;
    i++;
  }

  return i === doc.length ? 2 : breaks;
}

const padding = (breaks: number) => '\n'.repeat(2 - breaks);

/** Anything that could be an image reference, finished or half-typed. */
const REFERENCE = /!\[[^\]\n]*\](\[[^\]\n]*\]?)?/g;

/**
 * The same position, unless it is inside an image reference — in which case, the end of
 * that line.
 *
 * This is not a corner case, it is the second image. The alt text of the one just inserted
 * is left selected so it can be named, which puts the cursor inside `![…][img-1]`; pasting
 * again from there would thread the second image through the middle of the first and leave
 * two broken references. It also covers the reader who clicked into an alt themselves.
 */
function clearOfReferences(doc: string, at: number): number {
  const lineStart = doc.lastIndexOf('\n', at - 1) + 1;
  const lineEnd = doc.indexOf('\n', at);
  const end = lineEnd === -1 ? doc.length : lineEnd;
  const offset = at - lineStart;

  for (const match of doc.slice(lineStart, end).matchAll(REFERENCE)) {
    if (offset > match.index && offset < match.index + match[0].length) return end;
  }

  return at;
}

export function imageInsertion(doc: string, cursor: number, image: InsertableImage): Insertion {
  const at = clearOfReferences(doc, cursor);
  const label = freeLabel(doc);
  const alt = altFor(image.name);

  // An image is a block, so it gets a blank line on each side — but only the ones the
  // document is not already providing, or pasting onto an empty line pushes everything apart.
  const before = padding(breaksBefore(doc, at));
  const reference = `${before}![${alt}][${label}]${padding(breaksAfter(doc, at))}`;

  // The definition is separated from whatever the document ends with, which may be the
  // reference we have just decided to insert. Cheaper to ask the resulting text than to
  // reason about which of the two cases we are in.
  const resulting = doc.slice(0, at) + reference + doc.slice(at);
  const start = at + before.length + '!['.length;

  return {
    reference: { from: at, insert: reference },
    definition: {
      from: doc.length,
      insert: `${padding(breaksBefore(resulting, resulting.length))}[${label}]: ${image.dataUrl}\n`,
    },
    alt: { from: start, to: start + alt.length },
  };
}
