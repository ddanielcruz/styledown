import interItalic from '@fontsource-variable/inter/files/inter-latin-wght-italic.woff2?url';
import interNormal from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
import monoItalic from '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-italic.woff2?url';
import monoNormal from '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url';
import loraItalic from '@fontsource-variable/lora/files/lora-latin-wght-italic.woff2?url';
import loraNormal from '@fontsource-variable/lora/files/lora-latin-wght-normal.woff2?url';
import merriweatherItalic from '@fontsource-variable/merriweather/files/merriweather-latin-wght-italic.woff2?url';
import merriweatherNormal from '@fontsource-variable/merriweather/files/merriweather-latin-wght-normal.woff2?url';
import sourceSansItalic from '@fontsource-variable/source-sans-3/files/source-sans-3-latin-wght-italic.woff2?url';
import sourceSansNormal from '@fontsource-variable/source-sans-3/files/source-sans-3-latin-wght-normal.woff2?url';
import sourceSerifItalic from '@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-italic.woff2?url';
import sourceSerifNormal from '@fontsource-variable/source-serif-4/files/source-serif-4-latin-wght-normal.woff2?url';
import katexAms from 'katex/dist/fonts/KaTeX_AMS-Regular.woff2?url';
import katexMainBold from 'katex/dist/fonts/KaTeX_Main-Bold.woff2?url';
import katexMainItalic from 'katex/dist/fonts/KaTeX_Main-Italic.woff2?url';
import katexMainRegular from 'katex/dist/fonts/KaTeX_Main-Regular.woff2?url';
import katexMathItalic from 'katex/dist/fonts/KaTeX_Math-Italic.woff2?url';
import katexSize1 from 'katex/dist/fonts/KaTeX_Size1-Regular.woff2?url';
import katexSize2 from 'katex/dist/fonts/KaTeX_Size2-Regular.woff2?url';
import katexSize3 from 'katex/dist/fonts/KaTeX_Size3-Regular.woff2?url';
import katexSize4 from 'katex/dist/fonts/KaTeX_Size4-Regular.woff2?url';

import { LATIN_SUBSET, toFontFace, type DocumentFaces, type FontFace } from '@/lib/export';
import { FONT_STACKS, type FontFamily } from '@/lib/styles';

/**
 * The typefaces an exported file carries with it, as bytes.
 *
 * This is browser plumbing rather than logic — `fetch`, a `FileReader` and a table of
 * bundled URLs — so it lives beside the component that triggers it, for the same reason
 * `download.ts` does. What is *worth* embedding is a question about the document, and that
 * one is answered in `src/lib/export/faces.ts`.
 *
 * Nothing is fetched from anywhere but our own bundle, and by the time a reader clicks
 * Export the preview has already rendered with these exact files, so they come from cache.
 */

/** Only the weight axis is bundled; the app loads the same files (`src/main.tsx`). */
const BODY_FILES: Record<FontFamily, { normal: string; italic: string }> = {
  inter: { normal: interNormal, italic: interItalic },
  'source-sans-3': { normal: sourceSansNormal, italic: sourceSansItalic },
  lora: { normal: loraNormal, italic: loraItalic },
  'source-serif-4': { normal: sourceSerifNormal, italic: sourceSerifItalic },
  merriweather: { normal: merriweatherNormal, italic: merriweatherItalic },
};

/** The name `--doc-font-mono` asks for in `src/styles/document.css`. */
const MONO_FAMILY = 'JetBrains Mono Variable';

/** One file covers 100–900, which is why bold needs no face of its own. */
const WEIGHT_AXIS = '100 900';

/** A face, and where its bytes are in the bundle. */
type FaceFile = Omit<FontFace, 'dataUri'> & { url: string };

/**
 * The nine KaTeX faces that carry everyday maths: text and variables, the four delimiter
 * sizes that make a tall bracket tall, and the AMS symbols. The other eleven — Fraktur,
 * Script, SansSerif, Typewriter, and the bold italics — are alphabets a document asks for
 * by name, and 165KB is too much to spend on the chance that one did.
 *
 * The descriptors match KaTeX's own, because its rules select faces by weight and style:
 * `.mathbf` asks KaTeX_Main for 700, and a face declared at 400 would be synthesised
 * instead of used.
 */
const MATH_FACES: FaceFile[] = [
  { family: 'KaTeX_Main', style: 'normal', weight: '400', url: katexMainRegular },
  { family: 'KaTeX_Main', style: 'normal', weight: '700', url: katexMainBold },
  { family: 'KaTeX_Main', style: 'italic', weight: '400', url: katexMainItalic },
  { family: 'KaTeX_Math', style: 'italic', weight: '400', url: katexMathItalic },
  { family: 'KaTeX_Size1', style: 'normal', weight: '400', url: katexSize1 },
  { family: 'KaTeX_Size2', style: 'normal', weight: '400', url: katexSize2 },
  { family: 'KaTeX_Size3', style: 'normal', weight: '400', url: katexSize3 },
  { family: 'KaTeX_Size4', style: 'normal', weight: '400', url: katexSize4 },
  { family: 'KaTeX_AMS', style: 'normal', weight: '400', url: katexAms },
];

/**
 * The family name the `@font-face` has to declare is the first name in the stack the
 * document is asking for — read off `FONT_STACKS` rather than written out again here,
 * where the two could drift and the file would silently fall back to a system face.
 */
function familyOf(stack: string): string {
  return (stack.split(',')[0] ?? '').trim().replace(/^'|'$/g, '');
}

/**
 * The bytes, as a data URI.
 *
 * The MIME type is set here rather than taken from the response: a host that serves woff2
 * as `application/octet-stream` would otherwise put that in the file, and Safari refuses a
 * face whose type it does not recognise.
 */
async function toDataUri(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`could not read ${url}`);

  const blob = new Blob([await response.arrayBuffer()], { type: 'font/woff2' });

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('could not encode the font'));
    reader.readAsDataURL(blob);
  });
}

/**
 * The `@font-face` rules for a document, bytes included.
 *
 * A face that cannot be read is left out rather than thrown: the cost of a missing file is
 * that the document falls back to a system face, and the cost of throwing here is that the
 * reader does not get their document at all.
 */
export async function loadFontFaceCss(bodyFont: FontFamily, faces: DocumentFaces): Promise<string> {
  const body = BODY_FILES[bodyFont];
  const family = familyOf(FONT_STACKS[bodyFont]);

  // The upright body face is not conditional: it is what the document is set in.
  const bundled: FaceFile[] = [
    { family, style: 'normal', weight: WEIGHT_AXIS, url: body.normal, unicodeRange: LATIN_SUBSET },
  ];

  if (faces.bodyItalic) {
    bundled.push({
      family,
      style: 'italic',
      weight: WEIGHT_AXIS,
      url: body.italic,
      unicodeRange: LATIN_SUBSET,
    });
  }

  // Both, once there is code: every one of the six themes sets its comments in italic, so
  // the upright alone would leave the browser to slant it and get a different shape.
  if (faces.mono) {
    bundled.push(
      {
        family: MONO_FAMILY,
        style: 'normal',
        weight: WEIGHT_AXIS,
        url: monoNormal,
        unicodeRange: LATIN_SUBSET,
      },
      {
        family: MONO_FAMILY,
        style: 'italic',
        weight: WEIGHT_AXIS,
        url: monoItalic,
        unicodeRange: LATIN_SUBSET,
      },
    );
  }

  if (faces.math) bundled.push(...MATH_FACES);

  const rules = await Promise.all(
    bundled.map(async ({ url, ...face }) => {
      try {
        return toFontFace({ ...face, dataUri: await toDataUri(url) });
      } catch {
        return '';
      }
    }),
  );

  return rules.filter(Boolean).join('\n\n');
}
