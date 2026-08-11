/**
 * What a first-time visitor sees. `docs/DESIGN.md` rules out a blank canvas, so the
 * app always opens on something already rendered.
 *
 * Kept deliberately plain for M1: it exercises every construct the pipeline currently
 * handles and nothing it doesn't. M3 replaces it with a document chosen to show the
 * typography off.
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

## Code

Fenced blocks keep their language, ready for highlighting:

\`\`\`ts
export function renderMarkdown(markdown: string): Root {
  return processor.runSync(processor.parse(markdown));
}
\`\`\`

Inline \`code\` works too, alongside **bold**, *italic*, and
[links](https://github.com/ddanielcruz/styledown).
`;
