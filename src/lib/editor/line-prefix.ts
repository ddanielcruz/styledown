import { linesIn, type Change, type Edit, type Line, type Selection } from './edit';

/**
 * Headings, quotes, bullets, numbers and tasks — the markup that is a property of a line
 * rather than of a run of text, and therefore one function.
 *
 * Three things here are what the earlier project did not do, and they are the reason this
 * is not a copy of it. It prefixes **every line the selection touches**, where that one read
 * `doc.lineAt(range.from)` and silently changed only the first. It **comes off again**: its
 * buttons only ever replaced one marker with another, so there was no way back to a plain
 * paragraph. And a quote **stacks** rather than competing, because `> - item` is an ordinary
 * thing to want and losing the bullet to get the quote is not.
 */

/** The line, taken apart: `> > ` `  ` `- [ ] ` `the rest`. */
const LINE = /^((?:>[ \t]?)*)([ \t]*)((?:#{1,6} )|(?:[-*+] \[[ xX]\] )|(?:[-*+] )|(?:\d+[.)] ))?/;

/** One level of quote, which is what a press of the button is worth. */
const ONE_QUOTE = /^>[ \t]?/;

type Kind = 'heading' | 'quote' | 'bullet' | 'ordered' | 'task';

function kindOf(marker: string): Kind | undefined {
  if (/^#{1,6} $/.test(marker)) return 'heading';
  if (ONE_QUOTE.test(marker)) return 'quote';
  if (/^[-*+] \[[ xX]\] $/.test(marker)) return 'task';
  if (/^[-*+] $/.test(marker)) return 'bullet';
  if (/^\d+[.)] $/.test(marker)) return 'ordered';

  return undefined;
}

interface Parsed {
  quote: string;
  indent: string;
  marker: string;
}

function parse(text: string): Parsed {
  const [, quote = '', indent = '', marker = ''] = LINE.exec(text)!;

  return { quote, indent, marker };
}

/** A heading only counts as the one we mean when it is the same level. */
function isAlready(marker: string, target: string): boolean {
  const kind = kindOf(marker);

  if (!kind || kind !== kindOf(target)) return false;

  return kind !== 'heading' || marker.length === target.length;
}

/**
 * Where the reader ends up.
 *
 * A range grows to the lines it changed, which is the honest picture of a line-level edit —
 * the reader asked about these lines and these lines are what moved. A bare cursor stays
 * where it was **in the words**, counted from the start of the text rather than the start of
 * the line, so adding `- ` in front of it does not leave it two characters adrift.
 */
function selectionAfter(
  selection: Selection,
  lines: Line[],
  changes: Change[],
  contentStarts: number[],
): { anchor: number; head: number } {
  const grew = (change: Change) =>
    change.insert.length - ((change.to ?? change.from) - change.from);
  const total = changes.reduce((sum, change) => sum + grew(change), 0);

  if (selection.to > selection.from) {
    return { anchor: lines[0]!.from, head: lines.at(-1)!.to + total };
  }

  const index = lines.findIndex((line) => selection.from <= line.to);
  const line = lines[index]!;
  const before = changes.slice(0, index).reduce((sum, change) => sum + grew(change), 0);
  const offset = Math.max(selection.from - line.from - contentStarts[index]!, 0);
  const start =
    line.from + before + (changes[index]!.from - line.from) + changes[index]!.insert.length;

  return { anchor: start + offset, head: start + offset };
}

export function toggleLinePrefix(doc: string, selection: Selection, prefix: string): Edit {
  const lines = linesIn(doc, selection);
  const parsed = lines.map((line) => parse(line.text));
  const quoting = kindOf(prefix) === 'quote';

  // Off only when it is already on everywhere. A selection where half the lines are bullets
  // is a selection asking for bullets, not asking for none.
  const allOn = quoting
    ? parsed.every((line) => line.quote !== '')
    : parsed.every((line) => isAlready(line.marker, prefix));

  let number = 0;

  const changes = lines.map((line, index): Change => {
    const { quote, indent, marker } = parsed[index]!;

    if (quoting) {
      const level = ONE_QUOTE.exec(quote)?.[0] ?? '';

      return allOn
        ? { from: line.from, to: line.from + level.length, insert: '' }
        : { from: line.from, to: line.from, insert: prefix };
    }

    // The marker sits after the quote and the indent, so marking up a line inside a quote
    // marks up the line rather than the quote.
    const from = line.from + quote.length + indent.length;
    const insert = allOn ? '' : prefix.replace(/^\d+/, () => String(++number));

    return { from, to: from + marker.length, insert };
  });

  const contentStarts = parsed.map(({ quote, indent, marker }) =>
    quoting ? 0 : quote.length + indent.length + marker.length,
  );

  return { changes, selection: selectionAfter(selection, lines, changes, contentStarts) };
}
