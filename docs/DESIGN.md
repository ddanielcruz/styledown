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

## The control surface

### v1 — the five

One default preset, plus exactly these five. Anything not listed is fixed by the design tokens.

| Control           | Options                                                  | Default                             |
| ----------------- | -------------------------------------------------------- | ----------------------------------- |
| **Document font** | Inter, Source Sans 3, Lora, Source Serif 4, Merriweather | Inter                               |
| **Base size**     | 14–20 px, 1 px steps                                     | 16 px                               |
| **Accent colour** | Swatches + custom picker                                 | Slate                               |
| **Page setup**    | A4 / Letter / Legal · Narrow / Normal / Wide margins     | Locale-derived size, Normal margins |
| **Code theme**    | GitHub Light/Dark, Atom One Light/Dark, Nord, Night Owl  | GitHub Light                        |

They live in a sidebar rather than behind a menu, because every one of them is judged by looking at the document while it changes. It closes: a 1280px screen cannot show the editor, a whole page and the panel at once, and the page is the one worth keeping.

The accent is two values, not one. All six swatches carry text on white — the least of them is 5:1 — but the picker beside them reaches the whole colour space, and a pale pick renders links at 1.5:1: bad on screen and lost on paper, where there is no hover to recover the text with. So `accentInk()` derives a second value that meets 4.5:1, used only where the accent becomes text (link colour, and the box a white tick sits in). Every rule and hairline keeps the colour as chosen, because there it is decoration and a pale accent should tint the page exactly as the reader intended. Nothing changes for anyone using a preset.

The font list spans sans _and_ serif deliberately — five near-identical sans faces would be a worse menu. Heading and code fonts follow a designed pairing with the body font rather than being separately selectable; pairing type is a design skill, and letting users mix three arbitrary families mostly produces worse documents. Documents are light-background in v1; they're built to be printed.

### v2 — the depth (M12–M14)

Five controls is less than the earlier project offered, and the gap is the reason people would go back to it. So the surface grows to roughly sixty: three font slots against ~20 families, weight, line height, letter spacing, paragraph spacing, per-level headings, tables, blockquotes, lists, links, code, images, a semantic colour set, and Mermaid themes.

That is not a retreat from "every control must earn its place" — it is where that rule gets tested. Two things keep it honest:

**Defaults never move.** Every control added is a token moving out of the stylesheet's defaults and into `DocumentStyles` at exactly the value it already rendered at. The default document is unchanged, byte for byte, after all three milestones. The depth is opt-in — today's five stay at the top of the panel, open; everything else is a collapsed group with a reset.

**One descriptor table is the source of truth.** Each setting is declared once — its group, label, control kind, range, default, and the `--doc-*` property it writes — and four consumers read that declaration: the Zod schema, `toCssVariables`, the panel, and the reset. Sixty settings maintained as four parallel lists is four places to forget one, and the failure is silent: a control that edits a value nothing consumes, or a token consumed with nothing producing it. Guarded by a test that reads `src/styles/document.css` and asserts the two sets match. This is the same principle already used for the option unions, which are derived from their option lists rather than written beside them.

Four settings stay bespoke because they do not produce a custom property: the page box emits `@page` text, the code theme swaps a stylesheet, the accent derives a second value, and the Mermaid theme is a config object.

**Diagram themes are layers, not a setting.** M14 brings all seventeen, and what mermaid is handed is a merge in a fixed order: our base (`theme: 'base'`, plus the document's resolved font stack) → the chosen theme → overrides derived from the document → overrides from the reader. Only the first two exist at M14. The other two are the shape of every request this feature will attract — tint the diagram with my accent, paste the config I already have — and each of them is a layer at a merge point that already exists rather than a rewrite. The merge is a pure function, so the order is testable without drawing anything.

A theme also has to survive paper. The earlier project's themes lean on `!important` and uppercased labels, which will argue with the print stylesheet; each one gets printed and looked at, and one that cannot be made legible there is fixed or dropped rather than shipped as a trap.

## Assets and the privacy claim

**Everything ships in the bundle**, which is how it works through M11. The plan was to fetch fonts and themes at runtime, on the assumption that bundling five typefaces means shipping megabytes. It doesn't: Fontsource splits each face by `unicode-range`, so a family nobody picks costs ~2.4KB of `@font-face` text and downloads nothing — the browser fetches a woff2 only when a rule matches text with it. Measured on first load: Inter (upright and italic), JetBrains Mono, and the app's own face. The other four families cost nothing until chosen. All six highlight.js themes minify to 8.4KB together and are carried as strings.

Two things fall out of that. There is no third party in the render path, so no face can still be arriving when the reader hits print. And **there are currently no third-party requests at all** — but the claim we make stays about **content**: document text, styles, and images are never transmitted, and there's no account, sync, or analytics. "Zero third-party requests" is a promise about how the app is built rather than what it does with your document, and it would be one bad dependency away from being a lie.

The font menu sets each option in its own face, which is the one place that requests the other families — about 300KB, on opening a menu, to see what you are choosing.

**M12 moves the document's fonts to Google Fonts and drops the menu's previews.** Bundling holds at five families and does not hold at twenty: measured here, eight families are 2.5MB of woff2 across 94 files, and — more to the point — every family costs 4.8KB of `@font-face` text whether or not anyone picks it, which is a first-chunk cost that grows with the menu. Serving them lifts the cap entirely. The privacy claim stays exactly where it was, because it was always about content: the document never leaves the browser. A font request carries a family name and an IP address and never a byte of what you wrote.

Two things do break and are handled rather than discovered:

- **HTML export** has to fetch the stylesheet, read the file URLs out of it, and inline the bytes, where before it read them from our own bundle. `src/lib/export/remote-images.ts` already does this shape for linked images — bounded by a timeout and a size cap, best effort, degrading to the plain family name if the host will not answer.
- **Print** can no longer assume the face has landed, which was one of the reasons for bundling. Print waits on `document.fonts.ready`.

The app's own face and KaTeX's nine stay bundled: neither is on Google Fonts, and the chrome should not depend on the network. Code themes stay bundled too — all six are 8.4KB of strings together, and twenty-five would be about 35KB.

## Key mechanisms

- **Rendering** — `Markdown → remark (GFM, math) → rehype (slugs, highlight, katex, mermaid) → hast → React`. Stopping at hast keeps the pipeline framework-free and gives the preview and the HTML exporter one shared source, so they cannot drift. Synchronous, and measured fast enough not to need debouncing — 2.5 ms for a dense document, no dropped frames while typing. The two plugins that arrive late are passed in once they have loaded, and the document is simply rendered again. That "fast enough" only survives because **an image's bytes are held back from the parser**: a data URI is swapped for a short token before parsing and put back into the tree afterwards, which is invisible from outside — same markdown in, same tree out. Without it the whole thing is linear in the base64, because the preview re-renders on every keystroke and the parser re-reads a quarter of a million characters per image to reach the same conclusion each time. Measured end to end, keystroke to the character appearing in the preview: one image 93 ms, two 173 ms, three 256 ms, with three seconds of blocking time across a dozen keystrokes. Holding the bytes back flattens that to 10–12 ms and no blocking at all, whatever the document weighs. The token is restored in text as well as in attributes, because a data URI can be content rather than a destination — someone documenting the format inside a code fence — and it has to come back exactly as typed.
- **Weight that only some documents carry** — KaTeX is a quarter of a megabyte and most technical documents have no maths, so it loads only once a document proves it needs one; until then the TeX shows as its own source. Mermaid is the same bargain at four times the price. Highlighting, by contrast, is eager: nearly every technical document has code in it.
- **Diagrams** — a ` ```mermaid ` fence is drawn and swapped into the tree as real SVG nodes, which is what lets one tree serve the screen, the printer and the exported file without any of them being handed markup to trust. Drawing is asynchronous, so a fence with no drawing yet is shown as what it is — its own source, in a code block. **A diagram mermaid cannot parse gets exactly the same treatment**, deliberately: a half-written diagram is the normal state of a diagram being written, and an error box in the document would be the thing that printed. Nothing stale is ever held on screen; if the source does not currently draw, the source is what you see. The theme is `neutral` — greys and hairlines, legible without colour on paper and never in an argument with the accent. Labels are SVG text rather than HTML in a `foreignObject`, because the diagram has to survive being serialised into a file. Mermaid is told the document's font stack rather than a custom property, since it measures label text in a throwaway element outside the document where a custom property does not resolve — text measured in one face and drawn in another overflows the box drawn for it. Changing the body font therefore redraws every diagram: measured, the boxes move by a few pixels, which is the point.
- **What arrives first** — the first chunk is 912KB (292KB gzipped) and the editor is a second one, because CodeMirror and its grammars were 40% of a single bundle standing between the reader and the document — including the JavaScript, CSS and HTML parsers `@codemirror/lang-markdown` imports statically to colour inline HTML in the source, which we drop rather than render. Cold on 5 Mbps that moves the document from 1186 ms to 828 ms and the editor from 1197 ms to 1561 ms: the promise is a document that already looks good, so the document goes first and a skeleton holds the editor's place. What remains, in order, is react-dom, Base UI, highlight.js and Zod. The 37 languages highlight.js registers are 137KB and **cannot** be trimmed by configuration — `rehype-highlight` imports lowlight's `common` statically, so passing a shorter list drops languages without dropping bytes. Reachable only by owning the plugin, which is not worth 15KB gzipped. Mermaid changed none of that: it is 660KB on its own and splits itself again per diagram type, so it is never in the first chunk and a document with no diagram in it never fetches a byte of it — three chunks and 486KB over the wire, measured against the built app. The default document does draw one, deliberately, and that is the one place we pay on purpose: 209KB more, in thirty small chunks. Cold on 5 Mbps it costs the editor 151 ms (1561 → 1712 ms) and nothing at all to the document, which still paints at 824 ms with the diagram arriving at 2202 ms — it is behind the first paint, not in front of it. Thirty requests for one drawing is a lot, and it is mermaid's own splitting rather than ours; it buys a reader who draws a flowchart not paying for the other twenty diagram types.
- **Images** — pasted or dropped, and kept in the document itself, because there is no server to put one on and nothing may leave the browser. Two consequences, and both are the design. The bytes go in as a **link definition at the end of the document** rather than inline: the prose keeps a short `![alt][img-1]`, which is core CommonMark, so the pipeline needs to know nothing and the `.md` is still a `.md` — inline, one screenshot is a few thousand wrapped lines of base64 through the middle of a paragraph. And an image is **downscaled to 1600px on the long edge and re-encoded as WebP** on the way in, which is not a judgement call: a photograph off a phone is four megabytes and `localStorage` gives us five in total. Measured, a 3.8MB photo lands at 325KB and a 2400px screenshot at 4KB; anything already smaller than we would make it keeps its own bytes, and SVG and GIF are never rasterised. EXIF orientation is read rather than ignored, or a portrait photograph arrives on its side. A browser with no WebP encoder does not say so — it quietly hands back a PNG — so the fallback **asks the canvas whether the pixels are opaque** rather than believing the file's type, and reaches for JPEG when they are. A screenshot arrives as a PNG and is almost always opaque, and on the WebKit build we tested that one distinction is the difference between 1.8MB and 79KB for the same image. The threshold is 250 rather than 255, because a canvas does not hand back exactly what was drawn on it: WebKit's own gradient dithering leaves a sixth of the pixels one short of opaque. The document is held to a 4,000,000-character budget and an image that would cross it is **refused, with a reason, at the paste** — the alternative is a document that has silently stopped being saved, which is the worst thing this app could do to anyone. The alt starts as the file's own name, or `Image` for a clipboard paste that has none, and is **left selected** so it is one keystroke from being replaced. Never empty: an image someone pasted into a document is content rather than decoration, so an empty alt tells a screen reader to skip the thing the paragraph is about, and it gives the writer nothing to react to either. That does put the cursor inside the reference — so the next image steps clear of it rather than threading itself through the last one. In the editor a base64 payload is **replaced by its size**, atomically: unfolded, one pasted photograph turns the source pane into eighty-eight screens of scrolling of which eighty-six are base64, and the document becomes two percent of its own scrollbar. Folded, the same document is 1.9 screens and the tallest line is an ordinary one — with no measurable cost to typing, because CodeMirror was never struggling with the long line, only the reader was. None of this is in the first chunk: images added 3KB to it and nothing to the dependency list — a canvas, `createImageBitmap` and `fetch` were already there.
- **Small screens** — below 768px the split gives way to a Source / Document switch, and the settings panel takes the pane rather than floating over it: the same panel one breakpoint wider, not a second sheet-shaped thing to keep in agreement with the first. The rule that makes it work is that **neither pane is ever unmounted, only hidden** — unmounting the editor would cost the cursor and the undo history on every switch, and unmounting the document would mean printing from the Source tab printed nothing. `print.css` already forces every ancestor of `.styledown-doc` back to `display: block`, so a hidden pane still reaches the paper; verified by printing from a 390px viewport with the source in front and measuring the file, which came back the same three pages as from 1440px. Crossing the breakpoint by resizing does remount the editor, since the two layouts are different trees — rare enough to accept, and named so it is a decision rather than a surprise. There is a second, wider threshold that only decides a default: two panes fit from 768px, but two panes _and_ a 288px panel do not until about 1024, and in between the panel opening itself left the document 240px — narrower than the tabbed layout it had just left. So below 1024 the panel starts closed. After the first render the reader owns it, and resizing never takes it back.
- **Accessibility** — the editor was a keyboard trap, which is the failure that matters most in a product whose whole surface is one text pane. Tab indents, as it does in every Markdown editor and as the sample document's nested list wants, so **Escape opens a two-second window in which Tab moves focus** — CodeMirror's own tab-focus mode, bound to the key people actually try rather than to the Ctrl-m nobody guesses. It chains rather than overrides: Escape is already `simplifySelection`, which returns false when there is nothing to collapse and hands the key on. Beyond that: every landmark and control has a name (the editor was announced as "edit text"), the focus ring was darkened because the registry's `--ring` is 2.3:1 on white where the bar is 3:1, motion is answered, and a skip link gets past what is otherwise one enormous focus stop. Checked by reading the accessibility tree back out of a real browser and by walking the app on the keyboard, not by counting attributes.
- **Raw HTML in Markdown is dropped**, not rendered. Supporting `<details>` and friends needs `rehype-raw` plus a sanitisation policy, and its own answer for what a collapsed block means on paper. Deferred deliberately, not overlooked.
- **Styling** — CSS custom properties set on the document container, consumed by a static stylesheet. Changing a setting updates a few variables; no stylesheet regeneration. The same variables drive screen, print, and HTML export, so all three match by construction. The two settings a variable cannot carry — the page box and the code theme — are each one plain `<style>` element whose text is swapped. Deliberately **not** hoisted into the head by React: hoisted stylesheets are keyed by `href` and never removed, so choosing a paper you have already been on reuses an element sitting above the newer one and the document prints the paper before last. Found by printing and measuring, not by reading the code.
- **PDF** — `window.print()` with a print stylesheet that hides the app chrome; `toPageRule()` generates the page box. Orphans and widows are set at the document root and inherit from there. `break-inside: avoid` guards table rows, images, blockquotes and display maths — deliberately **not** code blocks or list items: a fence taller than the space left jumps to the next page, and if it is taller than a whole page it splits anyway, so `avoid` buys a half-empty page and the break as well. Orphans and widows say what we actually meant, which is that a block may only split where it can leave three lines behind and carry three over. Anything that scrolls on screen has to be un-boxed for print, or its overflow is simply absent from the PDF with nothing to show the reader that text went missing.
- **What print cannot do** — Chrome draws its own header and footer, and neither CSS nor `window.print()` can reach that switch; Blink has never implemented `@page` margin boxes, so page numbers of our own are not an option either. The app asks the reader to turn headers and footers off, which is the whole of the remedy. And **no page breaks are drawn on screen**: the preview is one continuous sheet, because a break we predict is a break the print engine remains free to put somewhere else.
- **HTML export** — one file with everything in it: the rendered document, `document.css`, the code theme, the page box, the diagrams as inline SVG, and the typefaces as base64 `@font-face` rules. Nothing we put in it is fetched from anywhere, which is the privacy claim surviving the one artefact that leaves the app. A remote image the author linked by URL is fetched at export and inlined too, best effort: reading a cross-origin image's bytes needs CORS, which plenty of hosts do not send, so one that will not come back keeps the URL it already had — trying can only improve the file, never spoil it. Bounded on both sides, by a timeout so a dead host cannot hold up a download and by a size cap so nobody is emailed a fourteen-megabyte page. It prints to the same PDF the app does because `@page` travels with it — verified by printing both and measuring the files. Only the faces the document uses are embedded: the body upright always, its italic if there is emphasis, JetBrains Mono if there is code, and KaTeX's nine core faces if there is maths. Latin subsets only, with the `unicode-range` kept so other scripts fall back to a system face rather than to boxes. That puts a prose document around 90KB and a dense one with maths in the hundreds — the alternative is a document exported without the typography it was designed in. The body is the app's own structure, wrapper included, so the container query that decides whether to draw a sheet answers there too and a phone gets the same full-bleed document it gets in the preview.
- **Persistence** — one active document plus its styles in `localStorage`, written on a 500 ms debounce and flushed when the tab is hidden, because the debounce window is exactly where a closing tab loses work. Storage is treated as something that throws: private mode refuses writes and a full origin refuses them once the quota is reached, and forgetting a document is bad where taking the editor down mid-sentence is worse. A refused write is now **reported** rather than swallowed — until images existed nothing could make a document large enough to reach the quota, and a document that has quietly stopped being saved is worse than one that says so. An empty document is saved like any other edit but never restored: an editor with nothing in it and no way to ask for something is the blank canvas the first rule forbids, so coming back to one starts the reader over on the default document with their settings intact. That rule used to hold only at the door, which left it reachable in two keystrokes mid-session — so an empty document now **says what it is and offers the way back**, and the toolbar carries the New the offer needed anyway. New is the one action in the app that asks first, and only when there is something to lose: an untouched document is replaced in silence, because a confirmation in front of nothing is a habit rather than a question. `.md` import and export are the portability mechanism, and the honest answer to "what happens if I clear my browsing data" — Open replaces the document outright, since choosing a file is already deliberate and the editor's own undo reaches back over it.

## Not doing

**Permanently:** accounts, any backend, telemetry, WYSIWYG editing, real-time collaboration.

Everything else that is wanted but unscheduled is in **Deferred, and why**, below — with the reason it came off the list rather than just its name.

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
- [x] **M8** — Mermaid, lazy-loaded and code-split
- [x] **M9** — Image paste/drop as data URIs
- [x] **M10** — Launch polish: empty states and the New document that needs one, accessibility, small screens, README with screenshots, `CONTRIBUTING.md`

Then the four that close the gap with the earlier project, which is what launch waits on. Each is tracked as an issue; the issue holds the breakdown, this doc holds the decisions.

- [ ] **M11** — Editor toolbar, shortcuts and the dialog that lists them (#12)
- [ ] **M12** — The style system: the descriptor table, the panel's groups, fonts from Google, and the typography controls (#13)
- [ ] **M13** — Component styling: tables, blockquotes, lists, links, code, images (#14)
- [ ] **M14** — The semantic colour set, and Mermaid's seventeen themes (#15)

**M1 is the highest-value milestone** — everything after it is improvement. **M3 and M4 deserve the most time**; they decide whether the project is any good.

## Deferred, and why

These were on the list and came off it deliberately, so they are not mistaken later for things nobody thought of.

- **Templates** — the earlier project shipped fourteen document starters, each with its own styles. Wanted, and cheap once the style system exists, which is the argument for doing it after M12 rather than before.
- **Presets** — a curated library, and saving your own. Same reason: a preset is a `DocumentStyles` value, and there is no point designing the file format for one twice.
- **Shareable links** — the document in the URL fragment, still with no server. The one feature the earlier project had that needed a backend, and the version worth building is the one that does not.

Further out: dark-background documents, ~25 code themes, a local multi-document library, PWA, DOCX.
