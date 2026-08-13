/**
 * The accent, made readable where it becomes text.
 *
 * The six swatches were chosen to carry text on white — the least of them is 5:1. The
 * picker beside them reaches the whole colour space, and nothing in it stops a reader
 * landing on a pale yellow that renders links at 1.5:1. That is a bad link on screen and a
 * lost one on paper, where there is no hover to recover the text with and no way to pick
 * again.
 *
 * So the accent splits in two. Everywhere it is decoration — the heading rule, the
 * horizontal rule, the blockquote bar, all of them already tinted rather than painted — it
 * stays exactly as chosen, and a pale accent tints every page of the document as the reader
 * intended. Only where it becomes text does it darken to the point it can be read.
 */

/** WCAG AA for body text. Below this the link is decoration rather than a link. */
const MIN_CONTRAST = 4.5;

const channels = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const toHex = (values: readonly number[]): string =>
  `#${values.map((value) => value.toString(16).padStart(2, '0')).join('')}`;

/** Relative luminance, per WCAG 2.1 — gamma undone, then weighted by how we see. */
function luminance(hex: string): number {
  const [red, green, blue] = channels(hex).map((value) => {
    const channel = value / 255;

    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** The document is white and stays white — v1 documents are built to be printed. */
export function contrastOnWhite(hex: string): number {
  return 1.05 / (luminance(hex) + 0.05);
}

/**
 * The same colour, dark enough to read on the page.
 *
 * Darkened by scaling all three channels together, which in HSV moves the value and leaves
 * the hue and saturation untouched — the reader's yellow comes back a darker yellow rather
 * than a different colour. Found by bisection because the gamma curve gives no closed form,
 * and measured on the *rounded* colour at every step, so the eight-bit value that comes out
 * is the one that was checked rather than one rounding pushed back below the line.
 */
export function accentInk(accent: string): string {
  if (contrastOnWhite(accent) >= MIN_CONTRAST) return accent;

  const original = channels(accent);
  const scaled = (factor: number) => toHex(original.map((value) => Math.round(value * factor)));

  let readable = 0;
  let tooLight = 1;

  for (let step = 0; step < 24; step++) {
    const middle = (readable + tooLight) / 2;

    if (contrastOnWhite(scaled(middle)) >= MIN_CONTRAST) readable = middle;
    else tooLight = middle;
  }

  return scaled(readable);
}
