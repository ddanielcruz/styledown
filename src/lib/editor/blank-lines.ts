/**
 * What separates one block from the next, and how much of it the document already has.
 *
 * A fence, a rule and an image are all blocks, and all three want a blank line on each side
 * — but only the ones that are not already there, or inserting onto an empty line pushes
 * everything apart. Shared rather than copied three times, because "how many line breaks are
 * between here and the nearest content" is the same question every time it is asked.
 */

/**
 * Line breaks between this position and the nearest content, counting at most the two that
 * make a paragraph break. The edge of the document counts as two: nothing needs separating
 * from nothing.
 */
export function breaksBefore(doc: string, at: number): number {
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

export function breaksAfter(doc: string, at: number): number {
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

export const padding = (breaks: number) => '\n'.repeat(2 - breaks);
