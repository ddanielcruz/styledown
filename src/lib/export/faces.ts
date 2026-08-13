import type { Element, Root } from 'hast';

/**
 * The latin subset every bundled family shares, copied from Fontsource's own `@font-face`
 * rules.
 *
 * An exported file carries latin and nothing else — the eleven subsets of a family come to
 * roughly ten times the weight, for coverage the document has already shown it does not
 * need. Keeping the range is what makes that safe: text outside it falls through to the
 * next family in the stack and sets in a system face, where a face with no range would
 * claim the text and draw a row of empty boxes.
 */
export const LATIN_SUBSET =
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';

export interface FontFace {
  family: string;
  style?: 'normal' | 'italic';
  /** A range for a variable face — `100 900` is one file covering every weight. */
  weight?: string;
  dataUri: string;
  unicodeRange?: string;
}

export function toFontFace({ family, style, weight, dataUri, unicodeRange }: FontFace): string {
  return [
    '@font-face {',
    `  font-family: '${family}';`,
    style && `  font-style: ${style};`,
    weight && `  font-weight: ${weight};`,
    `  src: url(${dataUri}) format('woff2');`,
    unicodeRange && `  unicode-range: ${unicodeRange};`,
    '}',
  ]
    .filter(Boolean)
    .join('\n');
}

export interface DocumentFaces {
  bodyItalic: boolean;
  mono: boolean;
  math: boolean;
}

/**
 * Which typefaces this document actually needs embedding.
 *
 * The body upright is not in here because it is not a question: every document is set in
 * it. The other three are, and each is worth 50–130KB of base64 in a file someone is going
 * to email — so they are answered from the tree rather than shipped on the chance.
 *
 * Asked of the *typeset* tree, the one being written into the file. KaTeX has replaced the
 * `language-math` code elements by then, so a document of nothing but formulae no longer
 * looks like a document full of code.
 */
export function documentFaces(tree: Root): DocumentFaces {
  const faces: DocumentFaces = { bodyItalic: false, mono: false, math: false };

  const walk = (node: Root | Element): void => {
    for (const child of node.children) {
      if (child.type !== 'element') continue;

      if (child.tagName === 'em' || child.tagName === 'i') faces.bodyItalic = true;
      if (child.tagName === 'code') faces.mono = true;

      const classes = child.properties.className;
      if (Array.isArray(classes) && classes.includes('katex')) faces.math = true;

      walk(child);
    }
  };

  walk(tree);

  return faces;
}
