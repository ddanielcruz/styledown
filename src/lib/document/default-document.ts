/**
 * What a first-time visitor sees. `docs/DESIGN.md` rules out a blank canvas, so the
 * app always opens on something already rendered.
 *
 * Kept deliberately plain: it exercises constructs the pipeline actually handles and
 * nothing it doesn't. M3 replaces it with a document chosen to show the typography off.
 *
 * No maths here on purpose. KaTeX loads only for documents that contain some, and
 * putting a formula in the document everyone opens would quietly undo that.
 * `docs/sample-document.md` is where the full range lives.
 */
export const DEFAULT_DOCUMENT = `# Styledown

Write Markdown on the left. It renders on the right, and prints to a PDF that looks
like a document rather than a web page.

## Why

Markdown is where technical writing already lives — design docs, RFCs, postmortems,
release notes. Getting it *out* of Markdown and into something you'd attach to an
email usually means a word processor and an afternoon.

## How it works

1. Type, paste, or open a Markdown file
2. Adjust a handful of settings
3. Print to PDF, or export HTML

Everything happens in your browser. Nothing you write is uploaded, and there is no
account to create.

## What renders

| Markdown              | Result                                    |
| --------------------- | ----------------------------------------- |
| Tables and footnotes  | GitHub-flavoured, as written              |
| Fenced code           | Highlighted by language                   |
| Math                  | Typeset with KaTeX, loaded only if used   |

## Code

Fenced blocks are highlighted from their language tag:

\`\`\`ts
export function renderMarkdown(markdown: string): Root {
  return processor.runSync(processor.parse(markdown));
}
\`\`\`

Inline \`code\` works too, alongside **bold**, *italic*, and
[links](https://github.com/ddanielcruz/styledown).
`;
