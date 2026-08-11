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
└─ styles/              # App CSS, print CSS, bundled default font
```

**The one rule that matters:** `src/lib/**` never imports from `src/components/**`. The core is framework-free and testable without rendering anything; the UI is a consumer of it.

## Data model

The full typographic system — heading scale, spacing rhythm, table and blockquote treatment, list styling — lives as **fixed design tokens**. Only five values are user-editable.

```ts
const DESIGN_TOKENS = {/* headings, spacing, table, quote, lists, ... */};

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

Name the tokens as though they were already settings — every future control is a token moving into `DocumentStyles`, not a refactor.

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

Fonts and code themes load from CDNs at runtime — bundling every typeface and theme would ship megabytes so each user can use two. The **default font is bundled**, so first paint is instant and the default experience never flashes unstyled.

The promise is about **content**: document text, styles, and images are never transmitted, and there's no account, sync, or analytics. We do **not** claim "offline" or "zero third-party requests" — neither is true, both are trivially disprovable in devtools, and an inaccurate privacy claim is worse than a modest accurate one.

## Key mechanisms

- **Rendering** — `Markdown → remark (GFM, math) → rehype (highlight, mermaid placeholders, katex) → React`. Debounced against typing. Mermaid renders asynchronously into placeholders so a slow diagram never blocks text.
- **Styling** — CSS custom properties set on the document container, consumed by a static stylesheet. Changing a setting updates a few variables; no stylesheet regeneration. The same variables drive screen, print, and HTML export, so all three match by construction.
- **PDF** — `window.print()` with a print stylesheet that hides the app chrome. `@page` for size and margins; `break-inside: avoid` on code blocks, tables, images, and diagrams; orphan and widow control. This is the area most likely to need iteration.
- **Persistence** — one active document plus styles in `localStorage`, debounced. `.md` import/export is the portability mechanism.

## Not doing

**Permanently:** accounts, any backend, telemetry, WYSIWYG editing, real-time collaboration.

**Not in v1:** multi-document library, DOCX export, deep style customisation, shareable links.

## Build order

Risk first. The two things that could sink this are _bad PDF pagination_ and _a default that doesn't look good_ — so both get proven early instead of discovered at the end. Deployment is live from M0; the app is public throughout and only _announced_ at the end.

- [ ] **M0** — CI, Pages deploy, Vitest → _a live URL exists_
- [ ] **M1** — Walking skeleton: editor + preview + print to PDF, deliberately ugly → _the full path works_
- [ ] **M2** — Rendering pipeline: GFM, code highlighting, math → _real documents render correctly_
- [ ] **M3** — The default design: tokens, bundled font, CSS variables → _it looks genuinely good_
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
