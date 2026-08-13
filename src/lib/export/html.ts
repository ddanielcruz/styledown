import type { Element, ElementContent, Root } from 'hast';
import { toHtml } from 'hast-util-to-html';

import { toCssVariables, toPageRule, type DocumentStyles } from '@/lib/styles';

/**
 * Everything the app's shell was providing that the document still needs — and nothing
 * else. `document.css` already carries the sheet, the type and the print rules; this is
 * only the surface it sits on.
 *
 * The container is what makes the sheet a sheet: `document.css` asks its container whether
 * there is room for a whole page, and drops the frame when there is not. Same query, same
 * two answers, no second set of responsive rules to keep in step with the app.
 *
 * The print block is `src/styles/print.css`'s job in the app, and this file has no
 * `print.css` — a fixed-height scrolling ancestor clips the print to one page, which is
 * the classic failure for this layout and would take everything past page one with it.
 */
const SHELL_CSS = `html,
body {
  height: 100%;
}

body {
  margin: 0;
  background: #f5f5f5;
}

.styledown-page {
  height: 100%;
  overflow: auto;
  container-type: inline-size;
}

@media print {
  body {
    background: none;
  }

  .styledown-page {
    height: auto;
    overflow: visible;
  }
}`;

export interface HtmlDocumentInput {
  /** hast, already typeset if the document had maths. */
  tree: Root;
  styles: DocumentStyles;
  title: string | undefined;
  /** `src/styles/document.css`, as text. */
  documentCss: string;
  codeThemeCss: string;
  /** `@font-face` rules carrying their own bytes — see `faces.ts`. */
  fontFaceCss: string;
  /** Only for a document with maths in it. */
  mathCss?: string;
}

const UNTITLED = 'Untitled';

function element(
  tagName: string,
  properties: Element['properties'],
  children: ElementContent[] = [],
): Element {
  return { type: 'element', tagName, properties, children };
}

/** One `<style>` per concern, because this is a file people open the source of. */
const styleSheet = (css: string): Element =>
  element('style', {}, [{ type: 'text', value: `\n${css}\n` }]);

/**
 * The document as a file that stands on its own.
 *
 * Assembled as hast and serialised once rather than built as a template string: `<style>`
 * is a raw-text element the serialiser already knows not to escape, and a heading
 * containing a `<` cannot break out of the title.
 *
 * The order of the stylesheets is the app's own, and `document.css` is last for the reason
 * it is last in `main.tsx` — every one of them is unlayered, so which one wins is decided
 * by where it sits.
 */
export function toHtmlDocument({
  tree,
  styles,
  title,
  documentCss,
  codeThemeCss,
  fontFaceCss,
  mathCss,
}: HtmlDocumentInput): string {
  const variables = Object.entries(toCssVariables(styles))
    .map(([property, value]) => `${property}: ${value}`)
    .join('; ');

  // A doctype is the only thing in a hast root that an element cannot hold, and the
  // pipeline never produces one.
  const content = tree.children.filter((node): node is ElementContent => node.type !== 'doctype');

  const head = element('head', {}, [
    element('meta', { charSet: 'utf-8' }),
    element('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }),
    element('meta', { name: 'generator', content: 'Styledown' }),
    element('title', {}, [{ type: 'text', value: title ?? UNTITLED }]),
    styleSheet(SHELL_CSS),
    styleSheet(fontFaceCss),
    styleSheet(codeThemeCss),
    ...(mathCss ? [styleSheet(mathCss)] : []),
    styleSheet(documentCss),
    styleSheet(toPageRule(styles)),
  ]);

  const body = element('body', {}, [
    element('div', { className: ['styledown-page'] }, [
      element(
        'article',
        { className: ['styledown-doc'], dataPageSize: styles.page.size, style: variables },
        content,
      ),
    ]),
  ]);

  const document: Root = {
    type: 'root',
    // No `lang`. We do not know what language the document is in, and the browser's own
    // is a preference rather than an answer — a Brazilian writing English gets `pt-BR`,
    // and a wrong `lang` mis-hyphenates the text and mispronounces it to a screen reader.
    children: [{ type: 'doctype' }, element('html', {}, [head, body])],
  };

  return toHtml(document);
}
