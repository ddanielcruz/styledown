# Styledown — Design

Working document: the decisions that are expensive to reverse, and the order we build in. Enough to start coding, not exhaustive. Expect it to change as the code teaches us things.

## What it is

Styledown turns Markdown into professionally typeset documents — PDF, HTML, or Markdown — entirely in the browser, with no account and nothing uploaded.

Built for developers and technical writers who already live in Markdown: RFCs, design docs, postmortems, API guides, release notes. Code blocks, tables, and diagrams are first-class concerns, not afterthoughts. The default styling should look right for a _technical_ document.

This is an open-source rebuild of an earlier personal project. The rendering and styling approach is already proven, so most of the work here is deciding what to keep, what to cut, and what to build first.

## The promise

**Beautiful by default.** Paste Markdown and it already looks good, before touching a single setting. Controls exist to _adjust_ a good document, never to _assemble_ one.

Three rules that follow, for when scope gets tempting:

1. **The default is the product.** If it doesn't look great, no amount of configurability rescues it.
2. **Every control must earn its place.** "It was easy to add" is not a reason.
3. **No blank canvas.** First load always shows something rendered and already styled.

## Stack

| Concern     | Choice                                                       |
| ----------- | ------------------------------------------------------------ |
| Build       | Vite (static SPA, deployed to GitHub Pages)                  |
| UI          | React + TypeScript strict, Tailwind v4, shadcn/ui on Base UI |
| Editor      | CodeMirror 6                                                 |
| Rendering   | unified / remark / rehype                                    |
| Diagrams    | Mermaid, lazy-loaded                                         |
| Math        | KaTeX                                                        |
| Validation  | Zod (persisted state)                                        |
| Test / lint | Vitest, oxlint + oxfmt                                       |

## Architecture

Single package. Internal boundaries instead of a monorepo — there's only one consumer.

```text
src/
├─ lib/                 # Pure TypeScript. No React. Unit-tested.
│  ├─ markdown/         #   Markdown → AST → rendered output
│  ├─ styles/           #   Design tokens, style schema, CSS variable generation
│  ├─ export/           #   HTML and Markdown exporters
│  └─ storage/          #   Load / save / validate persisted state
├─ components/
│  ├─ editor/           # CodeMirror pane, toolbar, shortcuts
│  ├─ preview/          # Rendered document
│  ├─ style-panel/      # Right sidebar
│  ├─ top-bar/          # New / Open / Save / Export / view mode
│  └─ ui/               # shadcn primitives
├─ state/               # Document + styles context
├─ hooks/
└─ styles/              # App CSS, the document stylesheet, print CSS
```

**The one rule that matters:** `src/lib/**` never imports from `src/components/**`. The core is framework-free and testable without rendering anything; the UI is a consumer of it.

## Data model

The full typographic system — heading scale, spacing rhythm, table and blockquote treatment, list styling — lives as **fixed design tokens**. Only five values are user-editable.

The fixed tokens live in `src/styles/document.css` as `--doc-*` custom properties, not in a TypeScript object. A fixed token is never computed, validated, or persisted, so an object holding it would only ever serialise back to the same string — and the stylesheet has to be readable as text anyway for the HTML exporter to inline it. `src/lib/styles/` holds the five that move.

```ts
type DocumentStyles = {
  bodyFont: FontFamily; // shortlist of 5
  fontSize: number; // 14–20px; everything scales from it
  accent: string; // links, rules, small accents
  page: { size: PageSize; margins: Margins };
  codeTheme: CodeTheme; // shortlist of 6
};

type PersistedState = {
  version: 1; // so future formats can migrate or safely reset
  document: { title: string; content: string };
  styles: DocumentStyles;
};
```

Name the tokens as though they were already settings — every future control is a token moving out of the stylesheet's defaults and into `DocumentStyles`, not a refactor.

`toCssVariables()` turns those five into the `--doc-*` properties the stylesheet reads, set on the document container so a change repaints without regenerating a stylesheet. Two of them have a second consumer: `@page` cannot reliably read custom properties, and its `size` descriptor will not take a `var()` at all, so M4 generates its `@page` rule from `DocumentStyles.page` directly. Same source of truth, two ways out of it. `codeTheme` produces no variable — a highlight.js theme is a whole stylesheet of token colours, so choosing one swaps the `<link>`.

Persisted state is Zod-validated on read, falling back to defaults. A corrupted `localStorage` entry must never produce a broken app.

## The v1 control surface

One default preset, plus exactly these five. Anything not listed is fixed by the design tokens.

| Control           | Options                                                  | Default                             |
| ----------------- | -------------------------------------------------------- | ----------------------------------- |
| **Document font** | Inter, Source Sans 3, Lora, Source Serif 4, Merriweather | Inter                               |
| **Base size**     | 14–20 px, 1 px steps                                     | 16 px                               |
| **Accent colour** | Swatches + custom picker                                 | Slate                               |
| **Page setup**    | A4 / Letter / Legal · Narrow / Normal / Wide margins     | Locale-derived size, Normal margins |
| **Code theme**    | GitHub Light/Dark, Atom One Light/Dark, Nord, Night Owl  | GitHub Light                        |

The font list spans sans _and_ serif deliberately — five near-identical sans faces would be a worse menu. Heading and code fonts follow a designed pairing with the body font rather than being separately selectable; pairing type is a design skill, and letting users mix three arbitrary families mostly produces worse documents. Documents are light-background in v1; they're built to be printed.

## Assets and the privacy claim

Fonts and code themes load from CDNs at runtime — bundling every typeface and theme would ship megabytes so each user can use two. The **defaults are bundled** — font and code theme both — so first paint is instant and the default experience never flashes unstyled.

The promise is about **content**: document text, styles, and images are never transmitted, and there's no account, sync, or analytics. We do **not** claim "offline" or "zero third-party requests" — neither is true, both are trivially disprovable in devtools, and an inaccurate privacy claim is worse than a modest accurate one.

## Key mechanisms

- **Rendering** — `Markdown → remark (GFM, math) → rehype (slugs, highlight, mermaid placeholders, katex) → hast → React`. Stopping at hast keeps the pipeline framework-free and gives the preview and the HTML exporter one shared source, so they cannot drift. Synchronous, and measured fast enough not to need debouncing — 2.5 ms for a dense document, no dropped frames while typing. Mermaid renders asynchronously into placeholders so a slow diagram never blocks text.
- **Weight that only some documents carry** — KaTeX is a quarter of a megabyte and most technical documents have no maths, so it loads only once a document proves it needs one; until then the TeX shows as its own source. Mermaid will work the same way. Highlighting, by contrast, is eager: nearly every technical document has code in it.
- **Raw HTML in Markdown is dropped**, not rendered. Supporting `<details>` and friends needs `rehype-raw` plus a sanitisation policy, and its own answer for what a collapsed block means on paper. Deferred deliberately, not overlooked.
- **Styling** — CSS custom properties set on the document container, consumed by a static stylesheet. Changing a setting updates a few variables; no stylesheet regeneration. The same variables drive screen, print, and HTML export, so all three match by construction.
- **PDF** — `window.print()` with a print stylesheet that hides the app chrome. `@page` for size and margins; `break-inside: avoid` on code blocks, tables, images, and diagrams; orphan and widow control. This is the area most likely to need iteration.
- **Persistence** — one active document plus styles in `localStorage`, debounced. `.md` import/export is the portability mechanism.

## Not doing

**Permanently:** accounts, any backend, telemetry, WYSIWYG editing, real-time collaboration.

**Not in v1:** multi-document library, DOCX export, deep style customisation, shareable links.

## Build order

Risk first. The two things that could sink this are _bad PDF pagination_ and _a default that doesn't look good_ — so both get proven early instead of discovered at the end.

The repo starts private and goes public at M3, the point where the first impression is a document worth looking at rather than a scaffold. Public well before launch, announced only at the end.

A free account can't serve Pages from a private repo, or protect its branches — so until M3, CI reports but nothing enforces it, and `main` is pushable. Going public turns both on: add the Pages deploy, and a ruleset requiring CI to pass before merge.

- [x] **M0** — CI on pull requests → _every commit lands green_
- [x] **M1** — Walking skeleton: editor + preview + print to PDF, deliberately ugly → _the full path works_
- [x] **M2** — Rendering pipeline: GFM, code highlighting, math → _real documents render correctly_
- [x] **M3** — The default design: tokens, bundled font, CSS variables → _it looks genuinely good_; go public, add the Pages deploy
- [ ] **M4** — Print quality: `@page`, break rules, orphans and widows → _PDFs paginate properly_
- [ ] **M5** — The five controls → _adjustable_
- [ ] **M6** — Persistence, `.md` import/export → _work survives a refresh_
- [ ] **M7** — HTML and Markdown export
- [ ] **M8** — Mermaid, lazy-loaded and code-split
- [ ] **M9** — Image paste/drop as data URIs
- [ ] **M10** — Launch polish: empty states, accessibility, README with screenshots, `CONTRIBUTING.md`

**M1 is the highest-value milestone** — everything after it is improvement. **M3 and M4 deserve the most time**; they decide whether the project is any good.

## After v1

The full styling surface is a known destination, not an open question. Every item below already exists as a design token, so exposing one is a small local change. Not committed — real feedback should be allowed to reorder this.

- **Typography** — heading and code fonts separately, ~20 families, per-level heading control, line height, letter spacing, paragraph spacing
- **Color** — full semantic set (~17 slots), dark-background documents
- **Components** — tables, blockquotes, lists, links, inline code; ~25 code themes
- **Images & diagrams** — sizing, alignment, shadow, border; ~13 Mermaid themes
- **Presets & templates** — curated preset library, save your own, document starters

Beyond styling: shareable URL links (document in the fragment, still no server) → local multi-document library → PWA → DOCX.
