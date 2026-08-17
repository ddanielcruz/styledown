/**
 * What a first-time visitor sees. `docs/DESIGN.md` rules out a blank canvas, so the app
 * always opens on something already rendered.
 *
 * It does two jobs at once, on purpose. It explains what Styledown is — this is the front
 * page as much as it is a document — and it exercises every construct the typography
 * styles, so the first paint is also the proof that the default design holds up.
 *
 * No maths here. KaTeX loads only for documents that contain some, and putting a formula in
 * the document everyone opens would quietly undo that. `docs/sample-document.md` is where
 * the full range lives.
 *
 * The diagram is the deliberate exception, and it is not a free one: it means mermaid is
 * fetched on every first load rather than only by the documents that draw something. It is
 * here because a feature nobody sees is a feature nobody knows about — the fence is short,
 * it arrives after the page has already painted, and deleting it costs the reader nothing
 * they were waiting for.
 *
 * No image either, and that one is not close. An image lives in the document as a data URI,
 * so putting one here is not a lazy chunk that arrives late — it is bytes in the first
 * chunk, on every first load, forever. The row in the table says the feature exists; the
 * reader's own screenshot is the demonstration.
 */
export const DEFAULT_DOCUMENT = `# Styledown

Markdown is where technical writing already lives — design docs, RFCs, postmortems,
release notes. Getting it *out* of Markdown and into something you would attach to an
email usually means a word processor and a lost afternoon.

Styledown is the shortcut. Write on the left, watch the document build itself on the
right, then print it to a PDF that reads like a document rather than a web page.

## How it works

1. Type, paste, or open a Markdown file
2. Adjust the handful of settings that actually change how it reads
3. Print to PDF, or export HTML

That is the whole loop. There is no account, no upload, and no export queue — the
document is built in the browser, and it never leaves it.

> A document you cannot share is not finished, and a document you had to hand to a
> server first was never really yours.

## What it renders

Everything GitHub-flavoured Markdown covers, set the way a document sets it rather than
the way a web page does.

| Construct     | Treatment                                      |
| ------------- | ---------------------------------------------- |
| Headings      | A real scale, with space that groups the page  |
| Tables        | Horizontal rules only — no boxes, no zebra     |
| Fenced code   | Highlighted by language, in a bundled face     |
| Footnotes[^1] | Collected at the end, out of the reader's way  |
| Maths         | Typeset with KaTeX, loaded only if you use it  |
| Diagrams      | Mermaid, on the same terms                     |
| Images        | Paste or drop one — it is kept in the document |

### Code

Fenced blocks are highlighted from their language tag, and inline \`code\` picks up the
same face:

\`\`\`ts
export function renderMarkdown(markdown: string, math?: Pluggable): Root {
  const pipeline = math ? processor().use([math]) : processor;

  return pipeline.runSync(pipeline.parse(markdown));
}
\`\`\`

### Lists

- Nested lists indent without drifting
  - And change their marker as they go
- [x] Task lists render as checkboxes
- [ ] Which stay exactly as you wrote them

### Diagrams

A \`mermaid\` fence is drawn rather than printed:

\`\`\`mermaid
graph LR
  A[Markdown] --> B[Styledown]
  B --> C[PDF]
  B --> D[HTML]
\`\`\`

---

## Why the defaults matter

Most Markdown tools hand you a stylesheet and a settings panel and wish you luck. The
bet here is the opposite one: the document should look right before you touch a single
control, and every control that ships has to earn its place by improving on that.

Delete all of this and start writing — it is your document now.

[^1]: Like this one, with a link back to where it was cited.
`;
