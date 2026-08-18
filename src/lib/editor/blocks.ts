import { breaksAfter, breaksBefore, padding } from './blank-lines';
import { cursorAt, linesIn, type Edit, type Selection } from './edit';

/**
 * The two that are a block rather than a span: a fence, and a rule.
 *
 * Both take whole lines. A fence that opens in the middle of a sentence is not a fence, it
 * is three backticks and a broken paragraph — so the selection is widened to the lines it
 * touches before anything is wrapped around it.
 */

/** Opened and closed with no language, because guessing one is worse than asking for one. */
export function wrapFence(doc: string, selection: Selection): Edit {
  const lines = linesIn(doc, selection);
  const from = lines[0]!.from;
  const to = lines.at(-1)!.to;

  const before = padding(breaksBefore(doc, from));
  const after = padding(breaksAfter(doc, to));
  const insert = `${before}\`\`\`\n${doc.slice(from, to)}\n\`\`\`${after}`;

  return {
    changes: [{ from, to, insert }],
    // In the language slot rather than in the code: the code is already there if there was
    // a selection, and the language is the part only the reader knows.
    selection: cursorAt(from + before.length + 3),
  };
}

export function insertRule(doc: string, selection: Selection): Edit {
  const at = linesIn(doc, selection).at(-1)!.to;

  const before = padding(breaksBefore(doc, at));
  // At the end of the document there is nothing after the rule to separate it from, and a
  // rule with the cursor stuck against it is a rule you cannot write past.
  const after = at === doc.length ? '\n\n' : padding(breaksAfter(doc, at));
  const insert = `${before}---${after}`;

  return { changes: [{ from: at, insert }], selection: cursorAt(at + insert.length) };
}
