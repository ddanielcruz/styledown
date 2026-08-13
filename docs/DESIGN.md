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
│  ├─ top-bar/          # Open / Download / Print / panel toggle
│  └─ ui/               # shadcn primitives
├─ hooks/               # The persisted document, and what else needs a lifecycle
└─ styles/              # App CSS, the document stylesheet, print CSS
```

**The one rule that matters:** `src/lib/**` never imports from `src/components/**`. The core is framework-free and testable without rendering anything; the UI is a consumer of it.

The document and its styles are one saved thing, so one hook owns both and `App` passes them down. There is no state directory and no context: one level of props is not a problem a context solves, and the day it crosses three is the day to add one.

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
  content: string;
  styles: DocumentStyles;
};
```

A document's **title is derived, never stored**: it is the first top-level heading, read off the parsed tree so a `#` inside a code fence cannot become one. A title field would be a sixth control that can silently disagree with the heading on the page, and there would be nothing to gain by it — the title's whole job is to name things outside the document. It sets the browser tab, it names both downloads and titles the exported page, and it is what Chrome offers as the filename when a reader saves the PDF, which is the one screen in the flow we cannot style.

Name the tokens as though they were already settings — every future control is a token moving out of the stylesheet's defaults and into `DocumentStyles`, not a refactor.

Each of the four unions is **derived from its list of options** — the labelled choices are declared, and the type is read back off them. A union and a menu written separately can disagree, and the failure is silent: a theme with no label is a blank row in a dropdown. This way they are one statement, so the panel can only offer what the type allows and `Record<PageSize, …>` still refuses to compile when a paper has no width. Only the page size has a default worth computing: it comes from the reader's locale, so `createDefaultStyles()` takes the locales as an argument rather than reaching for a browser inside `src/lib`.

`toCssVariables()` turns those five into the `--doc-*` properties the stylesheet reads, set on the document container so a change repaints without regenerating a stylesheet. Two of them have a second consumer: `@page` cannot reliably read custom properties, and its `size` descriptor will not take a `var()` at all, so `toPageRule()` emits the page box as text and React hoists it into the head. Same source of truth, two ways out of it — kept honest by a test asserting the printed margin is the string the preview inset itself by. `codeTheme` produces no variable — a highlight.js theme is a whole stylesheet of token colours, so choosing one swaps the `<link>`.

Persisted state is Zod-validated on read, falling back to defaults. A corrupted `localStorage` entry must never produce a broken app — and the validation is **per field**, because how far a bad value is allowed to reach is the whole question. Parsing the object as one unit would answer a single unrecognised colour by discarding everything the reader has written, which is a far worse failure than the one it is reporting. Only `version` is all-or-nothing: a format we do not recognise is not a document we can partially rescue.

## The v1 control surface

One default preset, plus exactly these five. Anything not listed is fixed by the design tokens.

| Control           | Options                                                  | Default                             |
| ----------------- | -------------------------------------------------------- | ----------------------------------- |
| **Document font** | Inter, Source Sans 3, Lora, Source Serif 4, Merriweather | Inter                               |
| **Base size**     | 14–20 px, 1 px steps                                     | 16 px                               |
| **Accent colour** | Swatches + custom picker                                 | Slate                               |
| **Page setup**    | A4 / Letter / Legal · Narrow / Normal / Wide margins     | Locale-derived size, Normal margins |
| **Code theme**    | GitHub Light/Dark, Atom One Light/Dark, Nord, Night Owl  | GitHub Light                        |

They live in a sidebar rather than behind a menu, because every one of them is judged by looking at the document while it changes. It closes: a 1280px screen cannot show the editor, a whole page and the panel at once, and the page is the one worth keeping.

The font list spans sans _and_ serif deliberately — five near-identical sans faces would be a worse menu. Heading and code fonts follow a designed pairing with the body font rather than being separately selectable; pairing type is a design skill, and letting users mix three arbitrary families mostly produces worse documents. Documents are light-background in v1; they're built to be printed.

## Assets and the privacy claim

**Everything ships in the bundle. No CDN.** The plan was to fetch fonts and themes at runtime, on the assumption that bundling five typefaces means shipping megabytes. It doesn't: Fontsource splits each face by `unicode-range`, so a family nobody picks costs ~2.4KB of `@font-face` text and downloads nothing — the browser fetches a woff2 only when a rule matches text with it. Measured on first load: Inter (upright and italic), JetBrains Mono, and the app's own face. The other four families cost nothing until chosen. All six highlight.js themes minify to 8.4KB together and are carried as strings.

Two things fall out of that. There is no third party in the render path, so no face can still be arriving when the reader hits print. And **there are currently no third-party requests at all** — but the claim we make stays about **content**: document text, styles, and images are never transmitted, and there's no account, sync, or analytics. "Zero third-party requests" is a promise about how the app is built rather than what it does with your document, and it would be one bad dependency away from being a lie.

The font menu sets each option in its own face, which is the one place that requests the other families — about 300KB, on opening a menu, to see what you are choosing.

## Key mechanisms

- **Rendering** — `Markdown → remark (GFM, math) → rehype (slugs, highlight, mermaid placeholders, katex) → hast → React`. Stopping at hast keeps the pipeline framework-free and gives the preview and the HTML exporter one shared source, so they cannot drift. Synchronous, and measured fast enough not to need debouncing — 2.5 ms for a dense document, no dropped frames while typing. Mermaid renders asynchronously into placeholders so a slow diagram never blocks text.
- **Weight that only some documents carry** — KaTeX is a quarter of a megabyte and most technical documents have no maths, so it loads only once a document proves it needs one; until then the TeX shows as its own source. Mermaid will work the same way. Highlighting, by contrast, is eager: nearly every technical document has code in it.
- **Raw HTML in Markdown is dropped**, not rendered. Supporting `<details>` and friends needs `rehype-raw` plus a sanitisation policy, and its own answer for what a collapsed block means on paper. Deferred deliberately, not overlooked.
- **Styling** — CSS custom properties set on the document container, consumed by a static stylesheet. Changing a setting updates a few variables; no stylesheet regeneration. The same variables drive screen, print, and HTML export, so all three match by construction. The two settings a variable cannot carry — the page box and the code theme — are each one plain `<style>` element whose text is swapped. Deliberately **not** hoisted into the head by React: hoisted stylesheets are keyed by `href` and never removed, so choosing a paper you have already been on reuses an element sitting above the newer one and the document prints the paper before last. Found by printing and measuring, not by reading the code.
- **PDF** — `window.print()` with a print stylesheet that hides the app chrome; `toPageRule()` generates the page box. Orphans and widows are set at the document root and inherit from there. `break-inside: avoid` guards table rows, images, blockquotes and display maths — deliberately **not** code blocks or list items: a fence taller than the space left jumps to the next page, and if it is taller than a whole page it splits anyway, so `avoid` buys a half-empty page and the break as well. Orphans and widows say what we actually meant, which is that a block may only split where it can leave three lines behind and carry three over. Anything that scrolls on screen has to be un-boxed for print, or its overflow is simply absent from the PDF with nothing to show the reader that text went missing.
- **What print cannot do** — Chrome draws its own header and footer, and neither CSS nor `window.print()` can reach that switch; Blink has never implemented `@page` margin boxes, so page numbers of our own are not an option either. The app asks the reader to turn headers and footers off, which is the whole of the remedy. And **no page breaks are drawn on screen**: the preview is one continuous sheet, because a break we predict is a break the print engine remains free to put somewhere else.
- **HTML export** — one file with everything in it: the rendered document, `document.css`, the code theme, the page box, and the typefaces as base64 `@font-face` rules. Nothing we put in it is fetched from anywhere, which is the privacy claim surviving the one artefact that leaves the app — the exception is the document's own remote images, which stay the URLs the author wrote until M9 inlines them. It prints to the same PDF the app does because `@page` travels with it — verified by printing both and measuring the files. Only the faces the document uses are embedded: the body upright always, its italic if there is emphasis, JetBrains Mono if there is code, and KaTeX's nine core faces if there is maths. Latin subsets only, with the `unicode-range` kept so other scripts fall back to a system face rather than to boxes. That puts a prose document around 90KB and a dense one with maths in the hundreds — the alternative is a document exported without the typography it was designed in. The body is the app's own structure, wrapper included, so the container query that decides whether to draw a sheet answers there too and a phone gets the same full-bleed document it gets in the preview.
- **Persistence** — one active document plus its styles in `localStorage`, written on a 500 ms debounce and flushed when the tab is hidden, because the debounce window is exactly where a closing tab loses work. Storage is treated as something that throws: private mode refuses writes and a full origin refuses them once the quota is reached, and forgetting a document is bad where taking the editor down mid-sentence is worse. An empty document is saved like any other edit but never restored: an editor with nothing in it and no way to ask for something is the blank canvas the first rule forbids, so coming back to one starts the reader over on the default document with their settings intact. `.md` import and export are the portability mechanism, and the honest answer to "what happens if I clear my browsing data" — Open replaces the document outright, since choosing a file is already deliberate and the editor's own undo reaches back over it.

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
- [x] **M4** — Print quality: `@page`, break rules, orphans and widows → _PDFs paginate properly_
- [x] **M5** — The five controls → _adjustable_
- [x] **M6** — Persistence, `.md` import/export → _work survives a refresh_
- [x] **M7** — HTML and Markdown export
- [ ] **M8** — Mermaid, lazy-loaded and code-split
- [ ] **M9** — Image paste/drop as data URIs
- [ ] **M10** — Launch polish: empty states and the New document that needs one, accessibility, README with screenshots, `CONTRIBUTING.md`

**M1 is the highest-value milestone** — everything after it is improvement. **M3 and M4 deserve the most time**; they decide whether the project is any good.

## After v1

The full styling surface is a known destination, not an open question. Every item below already exists as a design token, so exposing one is a small local change. Not committed — real feedback should be allowed to reorder this.

- **Typography** — heading and code fonts separately, ~20 families, per-level heading control, line height, letter spacing, paragraph spacing
- **Color** — full semantic set (~17 slots), dark-background documents
- **Components** — tables, blockquotes, lists, links, inline code; ~25 code themes
- **Images & diagrams** — sizing, alignment, shadow, border; ~13 Mermaid themes
- **Presets & templates** — curated preset library, save your own, document starters

Beyond styling: shareable URL links (document in the fragment, still no server) → local multi-document library → PWA → DOCX.
