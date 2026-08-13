/*
 * What paper did a PDF actually come out on, and how wide is the text on it?
 *
 * `MediaBox` is the sheet. The margins are nowhere in the file — Chrome bakes them into
 * the page's content stream as a transform and a clip rectangle, so the printable box has
 * to be read back out of `<sx> 0 0 <sy> <tx> <ty> cm` followed by `<x> <y> <w> <h> re W* n`.
 *
 * The transform's y scale is negative: Chrome flips the axis so it can lay a page out from
 * the top left the way a browser does. That is what makes the clip rectangle's x and y the
 * left and top insets directly, and it is the reason for reading the transform first
 * rather than assuming a scale.
 *
 * Usage: node scripts/measure-pdf.mjs <file.pdf>
 *
 *   pages    8
 *   paper    209.9 x 297 mm
 *   margins  L 22  T 22  R 21.9  B 22 mm
 *   measure  166 x 253 mm
 */
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const path = process.argv[2];

if (!path) {
  console.error('usage: node scripts/measure-pdf.mjs <file.pdf>');
  process.exit(1);
}

const PT_TO_MM = 25.4 / 72;
const mm = (pt) => Math.round(pt * PT_TO_MM * 10) / 10;

const buffer = readFileSync(path);
const raw = buffer.toString('latin1');

const boxes = [
  ...raw.matchAll(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/g),
];

if (boxes.length === 0) {
  console.error('no /MediaBox — is this a PDF?');
  process.exit(1);
}

const [, , , pageWidth, pageHeight] = boxes[0].map(Number);

// The first stream that inflates is page one's content.
let content = '';
for (let index = 0; !content;) {
  const start = raw.indexOf('stream', index);
  if (start < 0) break;
  const from = raw[start + 6] === '\r' ? start + 8 : start + 7;
  const end = raw.indexOf('endstream', from);
  try {
    content = inflateSync(buffer.subarray(from, end)).toString('latin1');
  } catch {
    /* not a flate stream — keep looking */
  }
  index = end + 9;
}

const transform = content.match(/([\d.-]+)\s+0\s+0\s+([\d.-]+)\s+[\d.-]+\s+[\d.-]+\s+cm/);
const clip = content.match(/([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+re\s*\n?W\*?\s*n/);

console.log(`pages    ${boxes.length}`);
console.log(`paper    ${mm(pageWidth)} x ${mm(pageHeight)} mm`);

if (transform && clip) {
  const scaleX = Math.abs(Number(transform[1]));
  const scaleY = Math.abs(Number(transform[2]));
  const [, x, y, width, height] = clip.map(Number);

  const left = mm(x * scaleX);
  const top = mm(y * scaleY);
  const right = mm(pageWidth - (x + width) * scaleX);
  const bottom = mm(pageHeight - (y + height) * scaleY);

  console.log(`margins  L ${left}  T ${top}  R ${right}  B ${bottom} mm`);
  console.log(`measure  ${mm(width * scaleX)} x ${mm(height * scaleY)} mm`);
} else {
  console.log('measure  (no clip box on page one)');
}
