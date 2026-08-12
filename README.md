# Styledown

Turn Markdown into print-ready documents, entirely in your browser.

**[Try it →](https://ddanielcruz.github.io/styledown/)**

Markdown is where technical writing already lives — design docs, RFCs, postmortems, release notes. Getting it _out_ of Markdown and into something you would attach to an email usually means a word processor and a lost afternoon. Styledown is the shortcut: write on the left, watch the document build itself on the right, then print it to a PDF that reads like a document rather than a web page.

It is an open-source rebuild of an earlier personal project.

## What it does

- **A default that already looks good.** Real typography before you touch a single control — heading scale, spacing rhythm, tables set with rules instead of boxes.
- **GitHub-flavoured Markdown**, including tables, task lists, footnotes and autolinks.
- **Syntax highlighting** for fenced code, and **maths** typeset with KaTeX — loaded only if your document has some.
- **PDF via the browser's own print**, plus HTML and Markdown export.
- **Five controls, not fifty**: document font, base size, accent colour, page setup, code theme.

## Privacy

Your document is rendered in the browser and never transmitted. There is no account, no sync, and no analytics.

To be precise rather than flattering: fonts and code themes beyond the bundled defaults are fetched from a CDN when you pick one, so this is not an offline app and not a zero-third-party-request one. The promise is about **content** — what you write stays on your machine.

## Stack

React + TypeScript on Vite, [unified](https://unifiedjs.com) (remark/rehype) for the Markdown pipeline, CodeMirror for the editor, Tailwind and shadcn/ui for the app chrome. No backend, and no plans for one.

The document's own typography is plain, unlayered CSS in [`src/styles/document.css`](src/styles/document.css) — deliberately not Tailwind, so the HTML exporter can inline it as text.

## Development

Requires Node (see [`.nvmrc`](.nvmrc)) and pnpm.

```bash
pnpm install
pnpm dev
```

| Command            | What it does                           |
| ------------------ | -------------------------------------- |
| `pnpm dev`         | Dev server                             |
| `pnpm build`       | Production build to `dist/`            |
| `pnpm test`        | Vitest — `lib` (node) and `ui` (jsdom) |
| `pnpm lint`        | oxlint                                 |
| `pnpm check-types` | `tsc --noEmit`                         |
| `pnpm format`      | oxfmt                                  |

## Design

[`docs/DESIGN.md`](docs/DESIGN.md) is the only design doc: the decisions, the data model, and the build order. It is kept current rather than supplemented.

This repo is under active development.

## License

MIT — see [`LICENSE`](LICENSE).
